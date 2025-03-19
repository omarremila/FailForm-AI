
// App.jsx
import { useState } from 'react';
import Header from './header.jsx';
import VideoFormAnalysis from './VideoFormAnalysis.jsx';
import VideoUploadAnalysis from './VideoUploadAnalysis.jsx';
import './App.css'; // Contains your dark theme for the rest of the app, if any

function App() {
  const [selectedExercise, setSelectedExercise] = useState("");
  const [analysisMode, setAnalysisMode] = useState(null);

  return (
    <>
      {/* Always render the header so its styling from header.css applies */}
      <Header />

      {!selectedExercise ? (
        <div className="exercise-selection">
          <h2>Select Your Exercise</h2>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            <option value="">--Select Exercise--</option>
            <option value="Squat">Squat</option>
            <option value="RDL">RDL (Romanian Deadlift)</option>
            <option value="Push-up">Push-up</option>
            <option value="Lunge">Lunge</option>
            <option value="Deadlift">Deadlift</option>
            <option value="Plank">Plank</option>
          </select>
        </div>
      ) : !analysisMode ? (
        <div className="mode-selection">
              {/* Camera Setup Instructions */}
    
          <h2>How would you like to check your form for {selectedExercise}?</h2>
          <button className="mode-button live-button" onClick={() => setAnalysisMode('live')}>
            Live Webcam Analysis
          </button>
          <button className="mode-button upload-button" onClick={() => setAnalysisMode('upload')}>
            Upload a Video
          </button>
          <div className="camera-instructions">
                <h3>Camera Setup Instructions:</h3>
                <ul>
                  <li>Position your camera **on the side** to capture your full range of motion.</li>
                  <li>Ensure there is **no one around** to obstruct the view.</li>
                  <li>Use **good lighting** so that key body points are visible.</li>
                  <li>Try to **stay centered** in the video frame for accurate analysis.</li>
                  <li>Keep the **camera at hip height** for the best angle.</li>
                </ul>
              </div>
        </div>
      ) : (
        <>
          {analysisMode === 'live' && <VideoFormAnalysis exercise={selectedExercise} />}
          {analysisMode === 'upload' && <VideoUploadAnalysis exercise={selectedExercise} />}
        </>
      )}
    </>
  );
}

export default App;
