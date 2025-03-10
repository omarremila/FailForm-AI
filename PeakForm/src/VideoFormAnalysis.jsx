import React, { useRef, useState } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

function VideoFormAnalysis() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState('squat'); // default workout

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      videoRef.current.src = videoURL;
    }
  };

  const analyzeVideo = async () => {
    setProcessing(true);
    setFeedback('');
    setAnalysisSummary('');
    
    // Wait for tf to be ready and set backend
    await tf.ready();
    await tf.setBackend('webgl');

    // Create the MoveNet detector using pose-detection
    const detectorConfig = {
      modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    const detector = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet,
      detectorConfig
    );
    console.log('Detector loaded:', detector);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Local variables to accumulate analysis data
    let goodCount = 0;
    let badCount = 0;
    let frameCount = 0;

    // Process each frame of the video
    const processFrame = async () => {
      if (video.ended) {
        setProcessing(false);
        // Create a summary message after video ends
        const summary = `Analysis complete! Processed ${frameCount} frames. Good form detected in ${goodCount} frame(s), and adjustments needed in ${badCount} frame(s).`;
        setAnalysisSummary(summary);
        return;
      }

      const poses = await detector.estimatePoses(video);
      frameCount++;

      const pose = poses[0]; // Assuming one person in the frame

      // Clear the canvas for the current frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pose && pose.keypoints) {
        // Draw keypoints for visual feedback
        ctx.fillStyle = 'red'; // Ensure keypoints are visible
        pose.keypoints.forEach((keypoint) => {
          if (keypoint.score > 0.5) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fill();
          }
        });

        // Conditional analysis based on the selected workout
        if (selectedWorkout === 'squat') {
          const leftKnee = pose.keypoints.find(
            (kp) => kp.name === 'left_knee' || kp.part === 'leftKnee'
          );
          const rightKnee = pose.keypoints.find(
            (kp) => kp.name === 'right_knee' || kp.part === 'rightKnee'
          );
          if (leftKnee && rightKnee && leftKnee.y > rightKnee.y) {
            goodCount++;
            setFeedback('Good squat depth!');
          } else {
            badCount++;
            setFeedback('Try squatting lower!');
          }
        } else if (selectedWorkout === 'benchpress') {
          const leftElbow = pose.keypoints.find(
            (kp) => kp.name === 'left_elbow' || kp.part === 'leftElbow'
          );
          const rightElbow = pose.keypoints.find(
            (kp) => kp.name === 'right_elbow' || kp.part === 'rightElbow'
          );
          if (leftElbow && rightElbow && leftElbow.y < video.videoHeight * 0.5) {
            goodCount++;
            setFeedback('Elbows are in a good position!');
          } else {
            badCount++;
            setFeedback('Adjust your elbow position!');
          }
        } else if (selectedWorkout === 'deadlift') {
          const nose = pose.keypoints.find(
            (kp) => kp.name === 'nose' || kp.part === 'nose'
          );
          const leftHip = pose.keypoints.find(
            (kp) => kp.name === 'left_hip' || kp.part === 'leftHip'
          );
          if (nose && leftHip && Math.abs(nose.x - leftHip.x) < 100) {
            goodCount++;
            setFeedback('Good deadlift form!');
          } else {
            badCount++;
            setFeedback('Keep your back straight!');
          }
        } else if (selectedWorkout === 'cableshrugs') {
          const leftShoulder = pose.keypoints.find(
            (kp) => kp.name === 'left_shoulder' || kp.part === 'leftShoulder'
          );
          const rightShoulder = pose.keypoints.find(
            (kp) => kp.name === 'right_shoulder' || kp.part === 'rightShoulder'
          );
          if (leftShoulder && rightShoulder) {
            const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
            if (avgShoulderY < video.videoHeight * 0.4) {
              goodCount++;
              setFeedback('Good cable shrug form!');
            } else {
              badCount++;
              setFeedback('Raise your shoulders higher!');
            }
          }
        }
      }
      requestAnimationFrame(processFrame);
    };

    // Also listen for the video "ended" event as a backup
    video.onended = () => {
      setProcessing(false);
      const summary = `Analysis complete! Processed ${frameCount} frames. Good form detected in ${goodCount} frame(s), and adjustments needed in ${badCount} frame(s).`;
      setAnalysisSummary(summary);
    };

    processFrame();
  };

  return (
    <div className="video-form-analysis">
      <h2 className="header-title">Upload Video for Form Analysis</h2>
      <div className="workout-selection">
        <label htmlFor="workout-select">Select Workout: </label>
        <select
          id="workout-select"
          className="workout-dropdown"
          value={selectedWorkout}
          onChange={(e) => setSelectedWorkout(e.target.value)}
        >
          <option value="squat">Squat</option>
          <option value="benchpress">Bench Press</option>
          <option value="deadlift">Deadlift</option>
          <option value="cableshrugs">Cable Shrugs</option>
        </select>
      </div>
      <input
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="video-upload"
      />
      <video
        ref={videoRef}
        width="600"
        height="400"
        controls
        className="video-player"
      />
      <button onClick={analyzeVideo} disabled={processing} className="analyze-button">
        Analyze
      </button>
      <canvas
        ref={canvasRef}
        className="analysis-canvas"
        style={{ display: 'block', marginTop: '10px' }}
      />
      <p className="feedback-message">{feedback}</p>
      {analysisSummary ? <div className="summary-result">{analysisSummary}</div>
      :"NOTHING TO DISPLAY"}
    </div>
  );
}

export default VideoFormAnalysis;
