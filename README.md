# VideoFormAnalysis - Pose Detection for Gym Workouts

This project implements a React component that uses TensorFlow.js with MoveNet pose detection to analyze gym workout form from an uploaded video. It provides real-time feedback and a summary of analysis results after the video ends.

## Features

- **Video Upload:** Users can upload a video file for analysis.
- **Pose Detection:** Frame-by-frame pose estimation using the MoveNet detector from TensorFlow.js.
- **Workout Analysis:** Conditional logic to analyze different workouts:
  - Squat
  - Bench Press
  - Deadlift
  - Cable Shrugs
- **Summary Reporting:** Accumulates results across frames and displays a final summary after video completion.
- **Real-time Feedback:** Displays immediate feedback on the video analysis.

## Installation

```bash
# Clone the repository
$ git clone <repository_url>

# Navigate to the project directory
$ cd <repository_directory>

# Install project dependencies
$ npm install
```
