import ReactDOM from 'react-dom/client';
import "./header.css";
//import App from "./App"
function Header() {
  return (
    <div className = "header">
        <img src = "src/assets/Images/muscle_icon.png" alt = "Muscle Icon" width = "50" heigh = "50" />
        <h1>PeakForm</h1>
    </div>
  )
}
export default Header;