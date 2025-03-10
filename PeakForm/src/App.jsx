import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from "./header.jsx"
import VideoFormAnalysis from "./VideoFormAnalysis.jsx"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Header/>   
    <VideoFormAnalysis/>
    </>
  )
}

export default App
