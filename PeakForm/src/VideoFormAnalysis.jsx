import React, { useEffect, useRef } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import WebCam from 'react-webcam';
import { drawKeypoints, drawSkeleton } from './utilities';
function VideoFormAnalysis() {
    const webcamRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    /*
    - define a function runPostNet that loads the MoveNet model and made 
     async to wait for the model to load
    - the function uses the load method to load the MoveNet model
    */
    const runPostNet = async () => {
        const net = await posenet.load({
          
            inputResolution: { width: 640, height: 500 },
            scale: 0.5
        });
        
        // run the detect function every 100ms
        setInterval(() => {
            detect(net);
        }, 100);

    }
    const detect = async (net) => { 
        if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4
          ) {
            const video = webcamRef.current.video;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
      
            // Set video dimensions (if needed)
            video.width = videoWidth;
            video.height = videoHeight;
      
            // Make Detections
            const pose = await net.estimateSinglePose(video);
            console.log(pose);  
            drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
        }
    }
    const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
        const ctx = canvas.current.getContext("2d");
        canvas.current.width = videoWidth;
        canvas.current.height = videoHeight;
      
        drawKeypoints(pose.keypoints, 0.6, ctx);
        drawSkeleton(pose.keypoints, 0.6, ctx);
      }
     // Run runPostNet once after the component mounts
        useEffect(() => {
            runPostNet();
        }, []);

  return (
    <div>
      <WebCam
        ref={webcamRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 640,
          height: 480
        }}
      />
      <canvas
      ref={canvasRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 640,
          height: 480
        }}
      />
    </div>
  );
}

export default VideoFormAnalysis;
