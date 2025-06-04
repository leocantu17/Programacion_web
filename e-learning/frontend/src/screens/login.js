import React, { useState } from 'react'; // Importa React y useState para manejar estados
import "../styles/login.css" // Importa estilos específicos para el login
import { useNavigate } from 'react-router-dom'; // Importa hook para navegación programática

function Login() {
  // Estado para almacenar el email ingresado por el usuario
  const [email, setEmail] = useState('');
  // Estado para almacenar la contraseña ingresada
  const [password, setPassword] = useState('');
  // Estado para almacenar mensajes de error (por ejemplo, credenciales inválidas)
  const [error, setError] = useState('');
  // Hook para cambiar rutas dentro de la app sin recargar la página
  const navigate = useNavigate();

  // Función que se ejecuta al enviar el formulario de login
  const handleLogin = async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    // Realiza una petición POST al backend con email y contraseña
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST', // Método HTTP para enviar datos
      headers: { 'Content-Type': 'application/json' }, // Indicamos que enviamos JSON
      body: JSON.stringify({ email, password }), // Convertimos los datos a JSON
      credentials: 'include',  // Incluye cookies para sesión cross-origin (importante)
    });

    // Obtenemos la respuesta como JSON
    const data = await response.json();

    if (response.ok) {
      // Si el login fue exitoso, guardamos el token en localStorage
      localStorage.setItem('token', data.token);
      // Redirigimos al usuario al dashboard o home
      navigate("/")
    } else {
      // Si hay error, mostramos mensaje al usuario
      setError(data.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      {/* Formulario para iniciar sesión */}
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="login-title">Iniciar Sesión</h2>

        <label>Email</label>
        {/* Input controlado para el email */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Actualiza estado al cambiar texto
          required
        />

        <label>Contraseña</label>
        {/* Input controlado para la contraseña */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Actualiza estado al cambiar texto
          required
        />

        {/* Muestra mensaje de error solo si existe */}
        {error && <p className="login-error">{error}</p>}

        {/* Botón para enviar formulario */}
        <button type="submit" className="login-button">Entrar</button>
      </form>
    </div>
  );
}

export default Login; 
