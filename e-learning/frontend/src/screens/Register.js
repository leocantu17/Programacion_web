import React, { useState } from "react";
import axios from "axios";
import "../styles/Register.css"
import { useNavigate } from "react-router-dom";


const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post("http://localhost:5000/register", form)
      .then(() => {
        navigate("/verify", { state: { email: form.email } });
      })
      .catch(err => {
        setError(err.response?.data?.message || "Error al registrar");
      });
  };

  return (
  <div className="page-container">
    <div className="form-container">
      <h2>Registro</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Nombre" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Correo" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  </div>
);

};

export default Register;
