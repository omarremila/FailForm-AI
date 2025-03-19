// poseUtils.jsx
import getSquatFeedback from './Squat'; // if your squat feedback function is exported from Squat.jsx

export function checkExerciseForm(keypoints, exercise) {
  switch (exercise) {
    case 'Squat':
      // Now, we don't do any drawing here.
      // Instead, we just return the squat feedback (which could be used if needed)
      return getSquatFeedback(keypoints);
    case 'RDL':
      return { message: "RDL feedback not implemented", color: "orange" };
    default:
      return { message: "No feedback available", color: "gray" };
  }
}

export function avgPoint(keypoints, partA, partB) {
  const pointA = keypoints.find(k => k.part === partA).position;
  const pointB = keypoints.find(k => k.part === partB).position;
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}
