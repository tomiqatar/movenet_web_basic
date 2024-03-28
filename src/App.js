import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { drawKeypoints, drawSkeletonLines } from './utilities';

function App() {
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Added container reference
  const [model, setModel] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [drawSkeleton, setDrawSkeleton] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);


  useEffect(() => {
    const loadModel = async () => {
      setIsLoadingModel(true);
      await tf.setBackend('webgl');
      await tf.ready();
      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
      setModel(detector);
      setIsLoadingModel(false);
    };
    loadModel();
  }, []);


  const drawResults = useCallback((poses) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "40px Roboto Condensed";

    poses.forEach(pose => {
      if (drawSkeleton) {
        drawKeypoints(pose.keypoints, 0.5, ctx);
        drawSkeletonLines(pose.keypoints, 0.5, ctx);
      }
    });
  }, [drawSkeleton]);
  // Pose detection function - Memoize with useCallback
  const detectPose = useCallback(async () => {
    if (webcamRef.current && model) {
      const video = webcamRef.current.video;
      const poses = await model.estimatePoses(video, { flipHorizontal: false });
      drawResults(poses);
    }
  }, [model, drawResults]);

  const videoConstraints = {
    width: 1280, // You can specify width
    height: 720, // And height, or leave them to be automatically selected based on the aspectRatio
    aspectRatio: 16 / 9
  };


  // Function to clear the canvas
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Toggle camera feed
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);

    if (isCameraActive) {
      // If turning off the camera, clear the canvas
      clearCanvas();
    }
  };

  // Toggle skeleton drawing
  const toggleSkeletonDrawing = () => {
    setDrawSkeleton(!drawSkeleton);
  };

  // Run pose detection only when camera is active
  useEffect(() => {
    if (!isCameraActive) return;

    const video = webcamRef.current && webcamRef.current.video;
    if (video && video.readyState === 4) {
      // Video is ready, set canvas size and start pose detection
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      const interval = setInterval(() => {
        detectPose();
      }, 10);
      return () => clearInterval(interval);
    }
  }, [isCameraActive, detectPose]);

  // Handle video upload and play it on the canvas
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.play();
    }
  };

  const drawVideoOnCanvas = useCallback(() => {
    const ctx = canvasRef.current.getContext('2d');
    const video = videoRef.current;

    const renderFrame = async () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // If model exists, perform pose detection
        if (model) {
          const poses = await model.estimatePoses(video); // Assuming the model expects a video element
          poses.forEach((pose) => {
            // Assuming drawKeypoints and drawSkeletonLines are correctly defined to draw on the canvas
            drawKeypoints(pose.keypoints, 0.5, ctx);
            drawSkeletonLines(pose.keypoints, 0.5, ctx);
          });
        }

        requestAnimationFrame(renderFrame);
      }
    };

    video.addEventListener('play', renderFrame);

    // Cleanup function
    return () => video.removeEventListener('play', renderFrame);
  }, [model]);
  useEffect(() => {
    if (videoRef.current) {
      drawVideoOnCanvas();
    }
  }, [drawVideoOnCanvas]);





  // Toggle fullscreen function
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {isLoadingModel && <p>Loading model, please wait...</p>}
        <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '1280px', height: 'auto' }}>
          {isCameraActive && <Webcam ref={webcamRef} style={{ width: '100%', height: 'auto' }} videoConstraints={videoConstraints} />}
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        </div>
        <button onClick={toggleCamera}>{isCameraActive ? "Stop Camera" : "Start Camera"}</button>
        <button onClick={toggleSkeletonDrawing}>{drawSkeleton ? "Hide Skeleton" : "Show Skeleton"}</button>
        <button onClick={toggleFullscreen}>Toggle Fullscreen</button>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        <video ref={videoRef} style={{ display: 'none' }} onLoadedMetadata={drawVideoOnCanvas}></video>
      </header>
    </div>
  );
}

export default App;