import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 👇 THIS IS THE MISSING LINK. ADD IT IF IT'S GONE.
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)