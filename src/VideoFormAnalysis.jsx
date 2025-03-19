// VideoFormAnalysis.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import Webcam from 'react-webcam';
import { drawKeypoints, drawSkeleton } from './utilities';
import { checkExerciseForm } from './poseUtils';

function VideoFormAnalysis({ exercise }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState({ message: "", color: "" });

// Within VideoFormAnalysis.jsx (similarly for VideoUploadAnalysis.jsx)
useEffect(() => {
  let animationFrameId;
  let net;

  const runPoseNet = async () => {
    net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.5,
    });
    detectPose();
  };

  const detectPose = async () => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4 &&
      webcamRef.current.video.videoWidth > 0 &&
      webcamRef.current.video.videoHeight > 0
    ) {
      const video = webcamRef.current.video;
      const pose = await net.estimateSinglePose(video);
      const fb = checkExerciseForm(pose.keypoints, exercise);
      setFeedback(fb);
      drawCanvas(pose, video);
    }
    animationFrameId = requestAnimationFrame(detectPose);
  };

  runPoseNet();

  return () => cancelAnimationFrame(animationFrameId);
}, [exercise]);


  const drawCanvas = (pose, video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    if (exercise === 'Squat') {
      // Get the keypoints for shoulders and hips
      const leftShoulder = pose.keypoints.find(k => k.part === 'leftShoulder');
      const rightShoulder = pose.keypoints.find(k => k.part === 'rightShoulder');
      const leftHip = pose.keypoints.find(k => k.part === 'leftHip');
      const rightHip = pose.keypoints.find(k => k.part === 'rightHip');
  
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        // Compute midpoints for shoulders and hips
        const midShoulder = {
          x: (leftShoulder.position.x + rightShoulder.position.x) / 2,
          y: (leftShoulder.position.y + rightShoulder.position.y) / 2
        };
        const midHip = {
          x: (leftHip.position.x + rightHip.position.x) / 2,
          y: (leftHip.position.y + rightHip.position.y) / 2
        };
  
        // Draw a line representing the back (from midShoulder to midHip)
        ctx.beginPath();
        ctx.moveTo(midShoulder.x, midShoulder.y);
        ctx.lineTo(midHip.x, midHip.y);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
  
        // Calculate the vector representing the back
        const dx = midHip.x - midShoulder.x;
        const dy = midHip.y - midShoulder.y;
        // Calculate the angle between the back and the vertical (0, 1)
        // Note: using Math.atan2(dx, dy) because vertical vector is (0, 1)
        const angleRad = Math.atan2(dx, dy);
        const angleDeg = Math.abs(angleRad * (180 / Math.PI));
  
        // Draw the angle measurement on the canvas
        ctx.font = "20px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(`${angleDeg.toFixed(1)}°`, midShoulder.x + 10, midShoulder.y);
      }
    } else {
      // For other exercises, you can draw the keypoints and skeleton as usual:
      drawKeypoints(pose.keypoints, 0.6, ctx);
      drawSkeleton(pose.keypoints, 0.6, ctx);
    }
  };
  
  return (
    <div style={{ position: 'relative', width: 640, height: 480, margin: 'auto' }}>
      <Webcam
        ref={webcamRef}
        width={640}
        height={480}
        style={{ position: 'absolute', zIndex: 9 }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: 'absolute', zIndex: 10 }}
      />
      {/* Feedback Overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          backgroundColor: feedback.color,
          color: "black",
          padding: "5px 10px",
          borderRadius: "5px",
          fontWeight: "bold",
          zIndex: 20,
        }}
      >
        {feedback.message}
      </div>
    </div>
  );
}

export default VideoFormAnalysis;
