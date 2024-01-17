// Define the colors
export const colors = {
    skeletonColor: "rgb(30, 185, 128)",
    keypointColor: "rgb(30, 185, 128)",
    keypointOutlineColor: "rgb(255, 104, 89)",
};

export const drawKeypoints = (keypoints, minConfidence, ctx, positionScale = 1, sizeScale = 1) => {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];

        if (keypoint.score > minConfidence) {
            const { y, x } = keypoint;
            ctx.beginPath();
            ctx.arc(x * positionScale, y * positionScale, 4 * sizeScale, 0, 2 * Math.PI);
            ctx.fillStyle = colors.keypointColor;
            ctx.fill();

            ctx.strokeStyle = colors.keypointOutlineColor;
            ctx.lineWidth = 2 * sizeScale;
            ctx.stroke();
        }
    }
};

const connectedParts = [
    // Face
    [0, 1], // Nose Left eye 
    [0, 2], // Nose to right eye
    [1, 3], // Left eye to left ear
    [2, 4], // Right eye to right ear

    // Upper Body
    [5, 6], // Left shoulder to right shoulder
    [5, 7], // Left shoulder to left elbow
    [7, 9], // Left elbow to left wrist
    [6, 8], // Right shoulder to right elbow
    [8, 10], // Right elbow to right wrist
    [0, 5], // Nose to left shoulder
    [0, 6], // Nose to right shoulder

    // Lower Body
    [11, 12], // Left hip to right hip
    [11, 13], // Left hip to left knee
    [13, 15], // Left knee to left ankle
    [12, 14], // Right hip to right knee
    [14, 16], // Right knee to right ankle

    // Body
    [5, 11], // Left shoulder to left hip
    [6, 12], // Right shoulder to right hip
];


export const drawSkeletonLines = (keypoints, minConfidence, ctx, positionScale = 1, sizeScale = 1) => {
    connectedParts.forEach(([i, j]) => {
        const keypoint1 = keypoints[i];
        const keypoint2 = keypoints[j];

        if (keypoint1.score > minConfidence && keypoint2.score > minConfidence) {
            ctx.beginPath();
            ctx.moveTo(keypoint1.x * positionScale, keypoint1.y * positionScale);
            ctx.lineTo(keypoint2.x * positionScale, keypoint2.y * positionScale);
            ctx.lineWidth = 2 * sizeScale;
            ctx.strokeStyle = colors.skeletonColor;
            ctx.stroke();
        }
    });
};
