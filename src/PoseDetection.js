import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { drawKeypoints, drawSkeletonLines } from './utilities';



function PoseDetection() {
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Added container reference
  const [model, setModel] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [drawSkeleton, setDrawSkeleton] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [frameRate, setFrameRate] = useState(0);
  const [keypointsData, setKeypointsData] = useState([]);

  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const drawIndicatorLight = (allLandmarksVisible) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(30, 30, 15, 0, 2 * Math.PI); // Draw a circle at the top-left corner of the canvas
    ctx.fillStyle = allLandmarksVisible ? 'green' : 'red'; // Use green if all landmarks are visible, otherwise red
    ctx.fill();
  };



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

  const drawFixedTriangleCorners = useCallback(() => {
    const ctx = canvasRef.current.getContext("2d");
  const { width, height } = ctx.canvas;

  // Set common style for the shapes
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red with 50% transparency for stroke
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Red with 50% transparency for fill
  ctx.lineWidth = 1;

  // Calculate head's center and radius for the circle
  const headCenterX = width / 2;
  const headCenterY = height * 0.1;
  const headRadius = 20; // Radius of the circle

  // Draw a full circle for the head with half transparency
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, headRadius, 0, 2 * Math.PI, false); // Full circle
  ctx.fill(); // Fill the circle with the semi-transparent red color set by fillStyle
  ctx.stroke(); // Outline the circle

  // Calculate the vertical distance from the head's bottom to the ankle marks
  const distanceFromHeadToAnkle = height * 0.93 - (headCenterY + headRadius);
  
  // Calculate separation between the ankles based on the desired proportion of the height
  const ankleSeparation = distanceFromHeadToAnkle / 2.5;

  // Calculate the new X positions for the left and right legs based on the ankle separation
  // This places the ankle markers at the desired separation
  const leftLegX = (width / 2) - (ankleSeparation / 2);
  const rightLegX = (width / 2) + (ankleSeparation / 2);

  // Draw L with a curved corner on the left side, adjusted for new positions
  ctx.beginPath();
  ctx.moveTo(leftLegX, height * 0.8);
  ctx.arcTo(leftLegX, height * 0.94, leftLegX + 20, height * 0.94, 20);
  ctx.lineTo(leftLegX + 30, height * 0.94); // Adjust as needed
  ctx.stroke();

  // Draw mirrored L on the right side, adjusted for new positions
  ctx.beginPath();
  ctx.moveTo(rightLegX, height * 0.8);
  ctx.arcTo(rightLegX, height * 0.94, rightLegX - 20, height * 0.94, 20);
  ctx.lineTo(rightLegX - 30, height * 0.94); // Adjust as needed
  ctx.stroke();
}, []);

const drawResults = useCallback((poses) => {
  const ctx = canvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = "10px Arial";

  let allLandmarksVisible = true; // Assume initially that all landmarks are visible

  poses.forEach(pose => {
    if (drawSkeleton) {
      drawKeypoints(pose.keypoints, 0.5, ctx);
      drawSkeletonLines(pose.keypoints, 0.5, ctx);
    }
    // Check visibility for each keypoint
    pose.keypoints.forEach(kp => {
      if (kp.score < 0.3) { // Assuming 0.5 as the threshold for visibility
        allLandmarksVisible = false;
      }
    });
  });

  drawIndicatorLight(allLandmarksVisible); // Call the function to draw the indicator light

}, [drawSkeleton]);
  
  // Pose detection function - Memoize with useCallback
  const detectPose = useCallback(async () => {
    if (webcamRef.current && model) {
      const now = performance.now();
      const elapsed = now - lastFrameTimeRef.current;
  
      // Frame rate calculation logic
      if (elapsed >= 1000) {
        setFrameRate(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      } else {
        frameCountRef.current += 1;
      }
  
      const video = webcamRef.current.video;
      const poses = await model.estimatePoses(video, { flipHorizontal: false });
      let allLandmarksVisible = true; // Assume all landmarks are visible initially
  
      // Check visibility for each keypoint in each pose
      for (const pose of poses) {
        for (const kp of pose.keypoints) {
          if (kp.score < 0.3) { // Adjust this threshold based on your needs
            allLandmarksVisible = false;
            break; // Exit the loop early if any landmark is not visible
          }
        }
        if (!allLandmarksVisible) break; // Exit the outer loop early as well
      }
  
      // Conditional keypoints data update based on landmarks visibility
      if (allLandmarksVisible) {
        const timestamp = Date.now(); // Get the current timestamp
        const newKeypointsData = poses.map(pose => pose.keypoints.map(kp => ({
          name: kp.name,
          x: kp.x,
          y: kp.y,
          score: kp.score,
          timestamp // Add the timestamp to each keypoint data
        })));
        setKeypointsData(prevData => [...prevData, ...newKeypointsData.flat()]);
      }
  
      drawResults(poses, allLandmarksVisible); // Updated to pass visibility status
      drawFixedTriangleCorners(); // This remains unchanged
    }
  }, [model, drawResults, drawFixedTriangleCorners]);
  
  
  const videoConstraints = {
    width: 640, // You can specify width
    height: 360, // And height, or leave them to be automatically selected based on the aspectRatio
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

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Include Timestamp in the header
    csvContent += "Name,X,Y,Score,Timestamp\n";
  
    keypointsData.forEach((keypoint) => {
      const row = `${keypoint.name},${keypoint.x},${keypoint.y},${keypoint.score},${keypoint.timestamp}\n`;
      csvContent += row;
    });
  
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "keypoints_data.csv");
    document.body.appendChild(link); // Required for FF
  
    link.click(); // This will download the data file named "keypoints_data.csv".
  };
  
  
  





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
    <div className="PoseDetection">
      <header className="PoseDetection-header">
        {isLoadingModel && <p>Loading model, please wait...</p>}
        <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '1280px', height: 'auto' }}>
          {isCameraActive && <Webcam ref={webcamRef} style={{ width: '100%', height: 'auto' }} videoConstraints={videoConstraints} />}
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        </div>
        <button onClick={toggleCamera}>{isCameraActive ? "Stop Camera" : "Start Camera"}</button>
        <button onClick={downloadCSV}>Download KeyPoints CSV</button>

        <button onClick={toggleSkeletonDrawing}>{drawSkeleton ? "Hide Skeleton" : "Show Skeleton"}</button>
        <button onClick={toggleFullscreen}>Toggle Fullscreen</button>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        <p>Frame Rate: {frameRate} fps</p>
        <video ref={videoRef} style={{ display: 'none' }} onLoadedMetadata={drawVideoOnCanvas}></video>
      </header>
    </div>
  );
}

export default PoseDetection;