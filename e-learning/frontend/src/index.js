import React from 'react';
// Importa React, la librería principal para construir interfaces.

import ReactDOM from 'react-dom/client';
// Importa ReactDOM para manejar el DOM, en este caso la API moderna createRoot.

import App from './App';
// Importa el componente principal de la app, que será el punto de entrada de la UI.

import reportWebVitals from './reportWebVitals';
// Importa una función para medir el rendimiento de la aplicación (opcional).

const root = ReactDOM.createRoot(document.getElementById('root'));
// Crea un "root" para React en el elemento del DOM con id 'root'.
// Este es el contenedor donde React renderizará la app.

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Renderiza el componente <App /> dentro del root,
// envolviéndolo en React.StrictMode para activar comprobaciones de desarrollo.

reportWebVitals();
// Llama a la función para medir el rendimiento (puede enviar datos a consola o a un servicio).
