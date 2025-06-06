import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Gallery from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
)
