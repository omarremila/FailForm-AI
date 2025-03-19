import React, { useRef, useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import { drawKeypoints, drawSkeleton } from './utilities';
import { checkExerciseForm } from './poseUtils';
import { processSquat, evaluateSquatSession, resetSquatAnalysis, getPreparedData } from './Squat';

async function sendSquatData() {
  const data = getPreparedData();

  const payload = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
          { role: "system", content: "You are a fitness assistant providing squat form feedback." },
          { role: "user", content: `Analyze this squat session data and provide feedback:\n\n${JSON.stringify(data)}` }
      ],
      max_tokens: 100
  });

  try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log("Payload:", payload);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
          },
          body: payload
      });

      if (response.ok) {
          const jsonResponse = await response.json();
          console.log("OpenAI Response:", jsonResponse);
          return jsonResponse.choices[0].message.content;
      } else if (response.status === 429) {
          console.warn("Rate limit exceeded. Retrying in 10 seconds...");
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          return sendSquatData(); // Retry request
      } else {
          const errorText = await response.text();
          console.error('API request failed:', response.status, response.statusText, errorText);
          return null;
      }
  } catch (error) {
      console.error('Failed to send data:', error);
      return null;
  }
}


function VideoUploadAnalysis({ exercise }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [feedback, setFeedback] = useState({ message: "", color: "", highest_angle: null });
  const [key, setKey] = useState(0);  // Add a key state for the video element

  const animationFrameIdRef = useRef(null);
  const videoEndedRef = useRef(false);


  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    setVideoURL(URL.createObjectURL(file));
    resetVideoAndAnalysis();  // Reset everything on new upload
};

const replayVideo = () => {
  setKey(prev => prev + 1);  // Increment a key to force rerender
  resetVideoAndAnalysis();  // Reset everything on replay
};

let hasSentFeedback = false; // Global variable to track API request status

const handleVideoEnded = async () => {
    if (hasSentFeedback) {
        console.log("Feedback already sent, skipping API call.");
        return;
    }

    videoEndedRef.current = true;
    cancelAnimationFrame(animationFrameIdRef.current);
    const finalResult = evaluateSquatSession();
    console.log("Final squat evaluation:", finalResult);
    setFeedback(finalResult);

    try {
        const externalFeedback = await sendSquatData();
        if (externalFeedback) {
            console.log("Feedback from OpenAI:", externalFeedback);
            setFeedback(prev => ({ ...prev, message: externalFeedback }));
            hasSentFeedback = true; // Prevent multiple requests
        } else {
            console.log("No feedback received from OpenAI.");
        }
    } catch (error) {
        console.error("Error handling OpenAI response:", error);
    }
};

  function resetVideoAndAnalysis() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
          // Reset video
          video.currentTime = 0;
          video.play();
          
          // Clear canvas
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
  
          // Reset analysis data
          resetSquatAnalysis();  // Assuming this function resets all necessary data
  
          // Reset feedback and any other states related to the analysis
          setFeedback({ message: "", color: "", highest_angle: null });
  
          // Optionally reset video source to force reload (uncomment if needed)
          // let currentSrc = video.src;
          // video.src = ''; // Force a brief reload
          // video.src = currentSrc;
  
          // Reset the flag indicating the video has ended
          videoEndedRef.current = false;
      }
  }
  useEffect(() => {
    let isActive = true;  // Flag to control async flow
  
    const runPoseNet = async () => {
      const net = await posenet.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.5,
      });
      detectPose(net);
    };
  
    const detectPose = async (net) => {
      if (!isActive || videoEndedRef.current) return;
  
      const video = videoRef.current;
      if (video && video.readyState === 4) {
        const pose = await net.estimateSinglePose(video);
        if (!isActive || videoEndedRef.current) return;
        //console.log("Pose:", pose);
        const fb = processSquat(pose.keypoints, canvasRef.current.getContext('2d'));
        setFeedback(fb);
      }
      animationFrameIdRef.current = requestAnimationFrame(() => detectPose(net));
    };
  
    if (!videoEndedRef.current) {
      runPoseNet();
    }
  
    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [exercise, key]);  // Add 'key' or similar dependency that changes on replay
  


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
{videoEndedRef && (
            <button
              onClick={replayVideo}
              style={{
                position: 'absolute',
                top: '120%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 21,
                padding: '10px 20px',
                fontSize: '16px',
                color: 'black',
                //backgroundColor: 'blue',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Replay Video
            </button>
          )}

        </>
      )}
    </div>
  );
}

export default VideoUploadAnalysis;
