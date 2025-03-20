import React, { useRef, useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import { drawKeypoints, drawSkeleton } from './utilities';
import { checkExerciseForm } from './poseUtils';
import { HfInference } from "@huggingface/inference";

import { processSquat, evaluateSquatSession, resetSquatAnalysis, getPreparedDataSummary } from './Squat';

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
const SYSTEM_PROMPT = `
You are a virtual fitness assistant providing feedback on squat form. Analyze the detailed squat session data provided and generate feedback focused on aspects like joint angles, squat depth, balance, and execution speed. Your feedback should be formatted in HTML, specifically using div, span, and p elements without including any document structure tags like <html>, <head>, or <body>. Ensure the HTML is clean and suitable for direct injection into a React component. Include practical tips for improvement and highlight any corrections needed, ensuring the format is visually clear and suitable for web rendering. Make it colorful and engaging to keep the user's attention. 
Provide a comprehensive analysis that covers both positive aspects and areas for improvement. Add some comedic output to it too. do not change the background color and follow these specs           width: 640,
          margin: '200px auto',
          padding: '20px',
          textAlign: 'left',
          borderRadius: '5px',`;



/*

async function sendSquatData() {
  const data = getPreparedDataSummary();
  const prompt = `You are a fitness assistant providing squat form feedback. Analyze this squat session data and provide feedback:\n\n${JSON.stringify(data)}`;
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/EleutherAI/gpt-neo-125m",
		{
			headers: {
				Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(prompt),
		}
	);
	const result = await response.json();
	return result;
}
  sendSquatData({ inputs: "Can you please let us know more details about your " }).then((response) => {
    console.log(JSON.stringify(response));
});

*/


export async function getSquatFromMistral(ingredientsArr) {
  const data = getPreparedDataSummary();
  const prompt =JSON.stringify(data);
    try {
        const response = await hf.chatCompletion({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ],
            max_tokens: 1024,
        })
        return response.choices[0].message.content
    } catch (err) {
        console.error(err.message)
    }
}
function RenderHtmlFeedback({ htmlContent }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}

function VideoUploadAnalysis({ exercise }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [feedback, setFeedback] = useState({ message: "", color: "", highest_angle: null });
  const [key, setKey] = useState(0);  // Add a key state for the video element
  const [aiMessage, setAiMessage] = useState("");


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
        const externalFeedback = await getSquatFromMistral();

        if (externalFeedback) {
          console.log("Feedback from AI:", externalFeedback);
          setAiMessage(externalFeedback); // Set the AI message to state
            hasSentFeedback = true; // Prevent multiple requests
        } else {
            console.log("No feedback received from AI.");
        }
    } catch (error) {
        console.error("Error handling AI response:", error);
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
    <div>
      {/* Video Container */}
      <div style={{ position: 'relative', width: 640, height: 480, margin: '0 auto' }}>
        {!videoURL && (
          <div className="video-upload-container">
            <div className="upload-button-group">
              <label htmlFor="video-upload" className="upload-button">
                Upload a Video
              </label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
              />
            </div>
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
              width={640}
              height={480}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
            />
            {/* Feedback Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: feedback.color,
                color: 'black',
                padding: '5px 10px',
                borderRadius: '5px',
                fontWeight: 'bold',
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
      {/* Separate Container for AI Feedback Text */}
      <div
        style={{
          width: 640,
          margin: '200px auto',
          padding: '20px',
          textAlign: 'left',
          borderRadius: '5px',
        }}
      >
        {aiMessage && (
          <>
            <h3>AI Feedback</h3>
            <RenderHtmlFeedback htmlContent={aiMessage} />

          </>
        ) }
      </div>
    </div>
  );
  
}


export default VideoUploadAnalysis;
