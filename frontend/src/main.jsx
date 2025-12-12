import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Configure Axios for production (Vercel) vs Development
// locally this will be undefined/empty, so Vite proxy works.
// On Vercel, this must be set in Environment Variables.
axios.defaults.baseURL = import.meta.env.VITE_API_PROXY_TARGET || "";
axios.defaults.withCredentials = true; // Important for session cookies


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
