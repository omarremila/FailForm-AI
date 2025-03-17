// VideoUploadAnalysis.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import { drawKeypoints, drawSkeleton } from './utilities';
import { checkExerciseForm } from './poseUtils';

function VideoUploadAnalysis({ exercise }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [feedback, setFeedback] = useState({ message: "", color: "" });

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    setVideoURL(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!videoURL) return;
    let intervalId;
  
    const runPoseNet = async () => {
      const net = await posenet.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.5,
      });
  
      const videoElement = videoRef.current;
  
      const startDetection = () => {
        intervalId = setInterval(async () => {
          // Check that the video element is ready and has dimensions
          if (
            videoElement.readyState === 4 &&
            videoElement.videoWidth > 0 &&
            videoElement.videoHeight > 0
          ) {
            const pose = await net.estimateSinglePose(videoElement);
            console.log('Pose:', pose);
  
            // IMPORTANT: pass pose.keypoints to your feedback function
            const fb = checkExerciseForm(pose.keypoints, exercise);
            setFeedback(fb);
  
            drawCanvas(pose, videoElement);
          }
        }, 100);
      };
  
      // If the video is already ready, start detection immediately.
      if (videoElement.readyState >= 3) {
        videoElement.play();
        startDetection();
      } else {
        // Otherwise, attach an event listener
        videoElement.addEventListener('loadeddata', () => {
          videoElement.play();
          startDetection();
        });
      }
    };
  
    runPoseNet();
    return () => clearInterval(intervalId);
  }, [videoURL, exercise]);
  
 

  const drawCanvas = (pose, video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKeypoints(pose.keypoints, 0.6, ctx);
    drawSkeleton(pose.keypoints, 0.6, ctx);
  };

  return (
    <div style={{ position: 'relative', width: 640, height: 480, margin: '0 auto' }}>
      {!videoURL && <input type="file" accept="video/*" onChange={handleVideoUpload} />}
      {videoURL && (
        <>
          <video
            ref={videoRef}
            src={videoURL}
            width={640}
            height={480}
            controls
            autoPlay
            muted
            loop
            style={{ position: 'absolute', zIndex: 9 }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
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
        </>
      )}
    </div>
  );
}

export default VideoUploadAnalysis;
