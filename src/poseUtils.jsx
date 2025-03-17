// poseUtils.jsx

export function checkExerciseForm(keypoints, exercise) {
  switch (exercise) {
    case 'Squat':
      return getSquatFeedback(keypoints);
    case 'RDL':
      return { message: "RDL feedback not implemented", color: "orange" };
    default:
      return { message: "No feedback available", color: "gray" };
  }
}

export function getSquatFeedback(keypoints) {
  const minScore = 0.6;
  
  // Check if key body parts are visible with enough confidence
  const requiredParts = ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];
  for (const part of requiredParts) {
    const kp = keypoints.find(k => k.part === part);
    if (!kp || kp.score < minScore) {
      return { message: `Unable to see ${part}`, color: "yellow" };
    }
  }
  
  // Example error: left hip higher than right
  const leftHip = keypoints.find(k => k.part === 'leftHip').position;
  const rightHip = keypoints.find(k => k.part === 'rightHip').position;
  if (leftHip.y < rightHip.y) {
    return { message: "You're doing it wrong, left hip higher than right", color: "red" };
  }
  
  // Check squat depth: average hip should be lower than average knee
  const hipAvg = avgPoint(keypoints, 'leftHip', 'rightHip');
  const kneeAvg = avgPoint(keypoints, 'leftKnee', 'rightKnee');
  if (hipAvg.y < kneeAvg.y) {
    return { message: "You're not squatting deep enough", color: "red" };
  }
  
  // If everything looks good:
  return { message: "Correct Form!!", color: "green" };
}

export function avgPoint(keypoints, partA, partB) {
  const pointA = keypoints.find(k => k.part === partA).position;
  const pointB = keypoints.find(k => k.part === partB).position;
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}
