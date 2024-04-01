import React, { useState, useEffect, useRef } from 'react';

const FlexibilityRings = ({ initialPosition, onPushAway }) => {
  const canvasRef = useRef(null);
  const [ringPosition, setRingPosition] = useState(initialPosition);

  useEffect(() => {
    drawRings(canvasRef.current, ringPosition);
  }, [ringPosition]);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Example interaction logic: Move the ring further based on click position
    // This can be replaced with more complex logic depending on how you determine flexibility
    const newRingPosition = { ...ringPosition, x: mouseX, y: mouseY };
    setRingPosition(newRingPosition);

    // Callback to inform parent components of the push action
    if (onPushAway) onPushAway(newRingPosition);
  };

  return (
    <canvas ref={canvasRef} width="300" height="300" onClick={handleCanvasClick} style={{ cursor: 'pointer' }}></canvas>
  );
};

const drawRings = (canvas, position) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Draw a ring at the specified position
  ctx.beginPath();
  ctx.arc(position.x, position.y, 20, 0, 2 * Math.PI); // Adjust size as needed
  ctx.strokeStyle = 'blue';
  ctx.stroke();

  // Additional rings or visual enhancements can be added here
};

export default FlexibilityRings;
