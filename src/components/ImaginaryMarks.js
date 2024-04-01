import React, { useEffect, useRef } from 'react';

const ImaginaryMarks = ({ width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const drawFixedTriangleCorners = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.lineWidth = 1;

      const headCenterX = width / 2;
      const headCenterY = height * 0.1;
      const headRadius = 20;

      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY, headRadius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();

      const distanceFromHeadToAnkle = height * 0.93 - (headCenterY + headRadius);
      const ankleSeparation = distanceFromHeadToAnkle / 2.5;
      const leftLegX = (width / 2) - (ankleSeparation / 2);
      const rightLegX = (width / 2) + (ankleSeparation / 2);

      ctx.beginPath();
      ctx.moveTo(leftLegX, height * 0.8);
      ctx.arcTo(leftLegX, height * 0.94, leftLegX + 20, height * 0.94, 20);
      ctx.lineTo(leftLegX + 30, height * 0.94);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightLegX, height * 0.8);
      ctx.arcTo(rightLegX, height * 0.94, rightLegX - 20, height * 0.94, 20);
      ctx.lineTo(rightLegX - 30, height * 0.94);
      ctx.stroke();
    };

    drawFixedTriangleCorners();
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, width: '100%', height: '100%' }} />;
};

export default ImaginaryMarks;