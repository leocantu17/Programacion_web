// Importamos React y hooks necesarios
import React, { useEffect, useState } from "react";
// Importamos el componente CourseCard para mostrar cada curso
import CourseCard from "../components/CourseCard";
// Importamos estilos generales
import "../styles/style.css";
// Importamos axios para hacer peticiones HTTP
import axios from "axios";

// Componente funcional Home
const Home = () => {
  // Declaramos el estado "courses" para almacenar la lista de cursos, inicialmente vacío
  const [courses, setCourses] = useState([]);

  // useEffect para ejecutar código cuando el componente se monta (similar a componentDidMount)
  useEffect(() => {
    // Hacemos una petición GET al endpoint /courses en localhost puerto 5000
    axios.get("http://localhost:5000/courses")
      .then(response => {
        // Cuando la petición responde correctamente, guardamos los datos recibidos en el estado
        setCourses(response.data);
      })
      .catch(error => {
        // Si hay un error al obtener los cursos, lo mostramos en consola
        console.error("Error al obtener los cursos:", error);
      });
  }, []); // Array vacío para que se ejecute solo una vez al montar el componente

  // Renderizamos el componente
  return (
    // Contenedor principal con clase para estilos
    <div className="home-container">
      {/* Título principal */}
      <h1 className="home-title">Explora Nuestros Cursos</h1>
      {/* Subtítulo explicativo */}
      <p className="home-subtitle">Aprende a tu ritmo con los mejores contenidos online</p>
      {/* Grid que contendrá las tarjetas de los cursos */}
      <div className="course-grid">
        {/* Iteramos sobre el array courses y por cada curso renderizamos un CourseCard */}
        {courses.map(course => (
          // Pasamos el id como key para ayudar a React con el rendimiento
          // Pasamos todas las propiedades del curso como props usando spread operator
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </div>
  );
};

// Exportamos el componente para usarlo en otras partes de la app
export default Home;
