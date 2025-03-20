// Squat.jsx

// Data storage for analysis
const squatData = []; // Stores frame-by-frame angle data (optional)

let highest_angle = -Infinity; // We'll record the highest angle observed
let lowest_angle = Infinity; // We'll record the lowest angle observed

const minScore = 0.6; // Minimum acceptable confidence score
// In Squat.jsx, below your existing getPreparedData function:
export function getPreparedDataSummary() {
  const samplingRate = 50; // For instance, sample every 10th frame
  const sampledData = squatData.filter((frame, index) => index % samplingRate === 0);

  return {
    highestAngle: highest_angle,
    lowestAngle: lowest_angle,
    squatData: sampledData,
    totalFrames: squatData.length,
    sampledFrames: sampledData.length,
  };
}

/**
 * Determines which side (left or right) to use for measurements,
 * based on the higher average confidence of keypoints on that side.
 * (This ensures that for a side view, we use only one reliable side.)
 *
 * @param {Array} keypoints - Array of PoseNet keypoints.
 * @returns {Object|null} Object with selected keypoints or null if none are reliable.
 */
function selectSide(keypoints) {
  // Key parts we need: shoulder, hip, knee, and ankle.
  const left = {
    shoulder: keypoints.find(k => k.part === 'leftShoulder'),
    elbow: keypoints.find(k => k.part === 'leftElbow'),
    wrist: keypoints.find(k => k.part === 'leftWrist'),
    hip: keypoints.find(k => k.part === 'leftHip'),
    knee: keypoints.find(k => k.part === 'leftKnee'),
    ankle: keypoints.find(k => k.part === 'leftAnkle'),
  };
  const right = {
    shoulder: keypoints.find(k => k.part === 'rightShoulder'),
    elbow: keypoints.find(k => k.part === 'rightElbow'),
    wrist: keypoints.find(k => k.part === 'rightWrist'),
    hip: keypoints.find(k => k.part === 'rightHip'),
    knee: keypoints.find(k => k.part === 'rightKnee'),
    ankle: keypoints.find(k => k.part === 'rightAnkle'),
  };


  // Calculate average confidence for each side (only count those above threshold)
  const avgScore = (side) => {
    const scores = [];
    Object.values(side).forEach(kp => {
      if (kp && kp.score >= minScore) scores.push(kp.score);
    });
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  };

  const leftAvg = avgScore(left);
  const rightAvg = avgScore(right);

  if (leftAvg >= rightAvg && leftAvg > 0) {
    return { ...left, side: 'left' };
  } else if (rightAvg > 0) {
    return { ...right, side: 'right' };
  }
  return null;
}

/**
 * Provides squat depth feedback based on the selected side keypoints.
 * For a proper squat, the hip should be lower than the knee.
 *
 * @param {Object} selected - Object containing keypoints from one side.
 * @returns {Object} Feedback with a message and a color.
 */
function getSquatFeedback(selected) {
  if (!selected) {
    return { message: "Required keypoints not detected reliably", color: "yellow" };
  }
  if (selected.hip.position.y < selected.knee.position.y) {
    return { message: "You're not squatting deep enough", color: "red" };
  }
  return { message: "Correct Form!!", color: "green" };
}

/**
 * Processes the squat by:
 * - Selecting the reliable side.
 * - Drawing a red line from the chosen shoulder to hip.
 * - Calculating the angle between that line and the vertical.
 * - Storing the lowest angle across the session.
 * - (Optionally) Storing the angle for each frame.
 *
 * @param {Array} keypoints - Array of PoseNet keypoints.
 * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
 * @returns {Object} Feedback object with a temporary message.
 */
export function processSquat(keypoints, ctx) {
  const selected = selectSide(keypoints);
  if (selected && selected.shoulder && selected.hip) {
    // Draw vertical line (for reference)
    ctx.beginPath();
    ctx.moveTo(selected.shoulder.position.x, 0);
    ctx.lineTo(selected.shoulder.position.x, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw a red line from shoulder to hip on the selected side.
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.moveTo(selected.shoulder.position.x, selected.shoulder.position.y);
    ctx.lineTo(selected.hip.position.x, selected.hip.position.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw hip to ankle line
    ctx.beginPath();
    ctx.moveTo(selected.hip.position.x, selected.hip.position.y);
    ctx.lineTo(selected.ankle.position.x, selected.ankle.position.y);
    ctx.strokeStyle = 'blue';  // Use a different color to distinguish the lines
    ctx.lineWidth = 2;
    ctx.stroke();
    // Calculate the angle between this line and the vertical axis.
    const dx = selected.hip.position.x - selected.shoulder.position.x;
    const dy = selected.hip.position.y - selected.shoulder.position.y;
    const angleRad = Math.atan2(dx, dy);
    const angleDeg = Math.abs(angleRad * (180 / Math.PI));

  

    // Update the lowest angle (we want the minimum angle observed)
    if (angleDeg < lowest_angle) {
      lowest_angle = angleDeg;
    }
    if (angleDeg > highest_angle) {
      highest_angle = angleDeg;
    }


    // (Optionally) Store this frame's angle
    squatData.push({
      shoulder: selected.shoulder.position,
      elbow: selected.elbow.position,
      wrist: selected.wrist.position,
      hip: selected.hip.position,
      knee: selected.knee.position,
      ankle: selected.ankle.position,
      side: selected.side,
    });

    // Display the current angle on the canvas (for live feedback)
    ctx.font = "18px Arial";
    ctx.fillStyle = "red";
    ctx.fillText(`Angle: ${angleDeg.toFixed(1)}°`, selected.shoulder.position.x + 10, selected.shoulder.position.y - 20);
  }

  // Return temporary feedback during the session.
  // (Final evaluation will be done after the video.)
  return { message: "Analyzing squat...", color: "blue" };
}

/**
 * Evaluates the squat session using the lowest angle recorded.
 * Thresholds:
 *   - Great form: lowest angle < 10°
 *   - Okay form: lowest angle between 10° and 15°
 *   - Bad form: lowest angle ≥ 15°
 *
 * @returns {Object} Final evaluation with a score, message, and color.
 */
export function evaluateSquatSession() {
  if (highest_angle === -Infinity || lowest_angle === Infinity) {
    return { score: 0, message: "No squat data", color: "gray" };
  }
  
  let message = "";
  let color = "";
  if (highest_angle > 24) {
    if (lowest_angle > 20) {
      // Good range of motion upwards, but not completing the movement downwards
      message = "You're extending well but not squatting deep enough. Try to lower your hips further below knee level.";
      color = "yellow";  // Caution needed, improvement required
    } else {
      // Full range of motion is achieved
      message = "Excellent squat form! You're achieving a full range of motion.";
      color = "green";  // Perfect form
    }
} else if (highest_angle >= 20 && highest_angle < 30) {
    if (lowest_angle > 20) {
      // Not achieving sufficient depth or extension
      message = "You need to improve both depth and extension. Aim to lower your hips more and rise fully.";
      color = "yellow";  // Caution, moderate improvement required
    } else {
      // Partial range of motion but not egregious
      message = "Moderate form; increase your depth for a better squat.";
      color = "yellow";  // Caution, moderate improvement required
    }
} else {
    if (lowest_angle > 20) {
      // Poor form both in terms of depth and extension
      message = "Poor form noted. Focus on deepening your squat and fully extending your legs.";
      color = "red";  // Critical issues, major improvements needed
    } else {
      // Very bad form, lacking depth
      message = "Very poor form. It's crucial to squat deeper and fully extend your legs.";
      color = "red";  // Critical issues, major improvements needed
    }
}

  return { highest_angle: highest_angle.toFixed(1), message, color };
}

/**
 * Resets squat analysis data for a new session.
 */
export function resetSquatAnalysis() {
  squatData.length = 0;
  highest_angle = -Infinity;  // Resets the highest angle
  lowest_angle = Infinity;  // Resets the lowest angle
}
function prepareDataForSubmission() {
  return JSON.stringify({
      squatData,
      highestAngle: highest_angle,
      lowestAngle: lowest_angle
  });
}
export function getPreparedData() {
  return {
      highestAngle: highest_angle,
      lowestAngle: lowest_angle,
      squatData: squatData
  };
}
export default processSquat;
