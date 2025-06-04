import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/VerifyCode.css"

/**
 * Componente VerifyCode:
 * Permite al usuario ingresar un código de verificación recibido por email
 * para validar su cuenta.
 * 
 * Estado:
 * - code: código de 4 dígitos ingresado por el usuario.
 * - error: mensaje de error para mostrar si la verificación falla.
 * 
 * Funcionalidad:
 * - Obtiene el email desde la ubicación (location.state).
 * - Al enviar el formulario, hace una petición POST a la API para verificar el código.
 * - En caso de éxito, muestra alerta y redirige a la página de login.
 * - En caso de error, muestra el mensaje correspondiente.
 */
const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Se obtiene el email enviado desde la pantalla anterior (Login o Registro)
  const email = location.state?.email;

  // Maneja el envío del formulario
  const handleSubmit = e => {
    e.preventDefault();

    axios.post("http://localhost:5000/verify", { email, code })
      .then(() => {
        alert("Cuenta verificada con éxito");
        navigate("/login");  // Redirige a login
      })
      .catch(err => {
        // Si hay error, se muestra mensaje recibido del backend o uno genérico
        setError(err.response?.data?.message || "Error al verificar");
      });
  };

  return (
    <div className="form-container">
      <h2>Verificar Cuenta</h2>
      <p>Revisa tu correo y escribe el código de verificación:</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Código de 4 dígitos"
          maxLength="4"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />
        <button type="submit">Verificar</button>
      </form>
    </div>
  );
};

export default VerifyCode;
