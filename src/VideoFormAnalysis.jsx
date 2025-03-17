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

  useEffect(() => {
    let intervalId;

    const runPoseNet = async () => {
      const net = await posenet.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.5,
      });

      intervalId = setInterval(async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4 &&
          webcamRef.current.video.videoWidth > 0 &&
          webcamRef.current.video.videoHeight > 0
        ) {
          const video = webcamRef.current.video;
          const pose = await net.estimateSinglePose(video);
          console.log('Pose:', pose);

          // Get feedback as an object with message and color.
          const fb = checkExerciseForm(pose.keypoints, exercise);
          setFeedback(fb);

          drawCanvas(pose, video);
        }
      }, 100);
    };

    runPoseNet();
    return () => clearInterval(intervalId);
  }, [exercise]);

  const drawCanvas = (pose, video) => {
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawKeypoints(pose.keypoints, 0.6, ctx);
    drawSkeleton(pose.keypoints, 0.6, ctx);
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
