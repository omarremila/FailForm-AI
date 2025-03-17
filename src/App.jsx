// App.jsx
import { useState } from 'react';
import Header from './header.jsx';
import VideoFormAnalysis from './VideoFormAnalysis.jsx';
import VideoUploadAnalysis from './VideoUploadAnalysis.jsx';
import './App.css'; // make sure this is imported

function App() {
  const [analysisMode, setAnalysisMode] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState("Squat");

  return (
    <>
      <Header />

      {!analysisMode && (
        <div className="mode-selection">
          <button 
            className="mode-button live-button" 
            onClick={() => setAnalysisMode('live')}
          >
            Live Webcam Analysis
          </button>
          <button 
            className="mode-button upload-button" 
            onClick={() => setAnalysisMode('upload')}
          >
            Upload a Video
          </button>
        </div>
      )}

      {analysisMode && (
        <div className="exercise-selector">
          <label htmlFor="exercise-select">Choose your exercise:</label>
          <select
            id="exercise-select"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            <option value="Squat">Squat</option>
            <option value="RDL">RDL (Romanian Deadlift)</option>
            <option value="Push-up">Push-up</option>
            <option value="Lunge">Lunge</option>
            <option value="Deadlift">Deadlift</option>
            <option value="Plank">Plank</option>
          </select>
        </div>
      )}

      {analysisMode === 'live' && (
        <VideoFormAnalysis exercise={selectedExercise} />
      )}
      {analysisMode === 'upload' && (
        <VideoUploadAnalysis exercise={selectedExercise} />
      )}
    </>
  );
}

export default App;
