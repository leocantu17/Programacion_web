import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Importa componentes necesarios para el enrutamiento:
// Router es el contenedor que habilita las rutas basadas en URL,
// Routes agrupa las rutas y Route define cada ruta específica.

import Home from './screens/HomeScreen';
// Importa el componente de la pantalla principal (Home).

import Login from './screens/login';
// Importa el componente de la pantalla de login.

import Register from './screens/Register';
// Importa el componente de la pantalla de registro.

import CourseDetail from './screens/CourseDetail';
// Importa el componente para mostrar detalles de un curso específico.

import Dashboard from './screens/Dashboard';
// Importa el componente del panel del usuario.

import Navbar from './components/Nav';
// Importa el componente de la barra de navegación.

import VerifyCode from './screens/VerifyCode';
// Importa el componente para verificar un código (por ejemplo, para email o 2FA).

import "./styles/style.css"
// Importa estilos globales para la app.

function App() {
  return (
    <Router>
      {/* Contenedor principal del router para que las rutas funcionen */}
      <Navbar />
      {/* Siempre visible, la barra de navegación en todas las páginas */}

      <Routes>
        {/* Define las rutas de la aplicación */}
        <Route path="/" element={<Home />} />
        {/* Ruta raíz que muestra la pantalla Home */}

        <Route path="/login" element={<Login />} />
        {/* Ruta para la pantalla de inicio de sesión */}

        <Route path="/register" element={<Register />} />
        {/* Ruta para la pantalla de registro */}

        <Route path="/courses/:id" element={<CourseDetail />} />
        {/* Ruta dinámica para mostrar detalles de un curso según su id */}

        <Route path="/dashboard" element={<Dashboard />} />
        {/* Ruta para mostrar el panel de usuario */}

        <Route path="/verify" element={<VerifyCode />} />
        {/* Ruta para pantalla de verificación de código */}
      </Routes>
    </Router>
  );
}

export default App;
// Exporta el componente App como principal para usar en index.js o en otro lugar
