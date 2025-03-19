import React, { useRef, useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import { drawKeypoints, drawSkeleton } from './utilities';
import { checkExerciseForm } from './poseUtils';
import processSquat, { evaluateSquatSession } from './Squat';

function VideoUploadAnalysis({ exercise }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [feedback, setFeedback] = useState({ message: "", color: "", highest_angle: null });
  const animationFrameIdRef = useRef(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoEndedRef = useRef(false);


  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    setVideoURL(URL.createObjectURL(file));
  };

  const handleVideoEnded = () => {
    console.log("Video ended event fired");
    videoEndedRef.current = true;
    cancelAnimationFrame(animationFrameIdRef.current);
    const finalResult = evaluateSquatSession();
    console.log("Final squat evaluation:", finalResult);
    setFeedback(finalResult);
  };

  useEffect(() => {
    let net;
    const runPoseNet = async () => {
      net = await posenet.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.5,
      });
      detectPose();
    };

    
    const detectPose = async () => {
      if (videoEndedRef.current) return; // Immediately exit if video ended
    
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0
      ) {
        const video = videoRef.current;
        const pose = await net.estimateSinglePose(video);
        
        // Check again in case the video ended during the async call
        if (videoEndedRef.current) return;
        
        if (exercise === 'Squat') {
          const fb = processSquat(pose.keypoints, canvasRef.current.getContext('2d'));
          setFeedback(fb);
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(detectPose);
    };
    

    runPoseNet();
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [exercise, videoEnded]);

  return (
    <div style={{ position: 'relative', width: 640, height: 480, margin: '0 auto' }}>
{!videoURL && (
  <div className="video-upload-container">
    <div className="upload-button-group">
      <label htmlFor="video-upload" className="upload-button">
        Upload a Video
      </label>
    </div>
    <input
      id="video-upload"
      type="file"
      accept="video/*"
      onChange={handleVideoUpload}
      style={{ display: 'none' }}
    />
    

  </div>
)}



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
            onEnded={handleVideoEnded}
            style={{ position: 'absolute', zIndex: 9 }}
          />
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
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
{feedback.message} {feedback.highest_angle ? `(Deepest angle: ${feedback.highest_angle}°)` : ""}
</div>

        </>
      )}
    </div>
  );
}

export default VideoUploadAnalysis;
