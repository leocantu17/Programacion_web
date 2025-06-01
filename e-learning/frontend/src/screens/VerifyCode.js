import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/VerifyCode.css"

const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const handleSubmit = e => {
    e.preventDefault();
    axios.post("http://localhost:5000/verify", { email, code })
      .then(() => {
        alert("Cuenta verificada con éxito");
        navigate("/login");
      })
      .catch(err => {
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
