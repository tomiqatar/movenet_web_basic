import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const LandmarkChart = ({ coordinate }) => {
  const [dataPoints, setDataPoints] = useState([]);

  useEffect(() => {
    // Add the new coordinate to the data points array
    setDataPoints((prevDataPoints) => [...prevDataPoints, coordinate]);

    // Optionally, you can limit the number of data points to keep the chart manageable
    if (dataPoints.length > 50) {
      setDataPoints((prevDataPoints) => prevDataPoints.slice(1));
    }
  }, [coordinate, dataPoints.length]);

  const data = {
    labels: dataPoints.map((_, index) => index.toString()),
    datasets: [
      {
        label: 'X Coordinate of First Landmark',
        data: dataPoints,
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  return <Line data={data} />;
};

export default LandmarkChart;
