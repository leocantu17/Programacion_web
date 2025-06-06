import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>{/**Envuelve el componente App con AuthProvider */}
      <App />
    </AuthProvider>
  </StrictMode>,
)
