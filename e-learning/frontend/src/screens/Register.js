import React, { useState } from "react";
import axios from "axios";
import "../styles/Register.css";
import { useNavigate } from "react-router-dom";

/**
 * Componente Register:
 * Formulario para registrar un nuevo usuario con nombre, email y contraseña.
 * - Guarda los datos en estado local.
 * - Envía los datos al backend para crear la cuenta.
 * - Si tiene éxito, navega a la pantalla de verificación enviando el email.
 * - Muestra mensajes de error en caso de fallo.
 */
const Register = () => {
  // Estado para almacenar los valores del formulario (name, email, password)
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  // Estado para almacenar y mostrar mensajes de error
  const [error, setError] = useState("");
  // Hook para redireccionar a otras rutas
  const navigate = useNavigate();

  // Actualiza el estado form cuando el usuario escribe en un input
  const handleChange = e => {
    setForm({ 
      ...form,              // Copia el estado actual
      [e.target.name]: e.target.value  // Actualiza el campo que cambió
    });
  };

  // Envía el formulario al backend al hacer submit
  const handleSubmit = e => {
    e.preventDefault(); // Previene recarga de página
    axios.post("http://localhost:5000/register", form)
      .then(() => {
        // Si registro OK, navega a pantalla de verificación con email en state
        navigate("/verify", { state: { email: form.email } });
      })
      .catch(err => {
        // Si hay error, muestra mensaje recibido o uno genérico
        setError(err.response?.data?.message || "Error al registrar");
      });
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h2>Registro</h2>
        {/* Muestra mensaje de error si existe */}
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          {/* Campos controlados por handleChange */}
          <input 
            type="text" 
            name="name" 
            placeholder="Nombre" 
            onChange={handleChange} 
            required 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Correo" 
            onChange={handleChange} 
            required 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Contraseña" 
            onChange={handleChange} 
            required 
          />
          <button type="submit">Registrarse</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
