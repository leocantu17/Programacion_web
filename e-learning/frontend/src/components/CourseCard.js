import React from "react"; 
// Importa React para poder usar JSX y crear componentes funcionales

import { useNavigate } from "react-router-dom"; 
// Importa el hook useNavigate para navegar programáticamente entre rutas

const CourseCard = ({ id, title, description }) => { 
  // Define el componente funcional CourseCard que recibe props: id, title y description

  const navigate = useNavigate(); 
  // Inicializa el hook useNavigate para poder usarlo dentro del componente

  // Función que se ejecuta al hacer click en el botón para navegar al detalle del curso
  const handleClick = () => {
    navigate(`/courses/${id}`); 
    // Redirige a la ruta /courses/ seguido del id del curso
  };

  return (
    <div className="course-card"> 
      {/* Contenedor principal de la tarjeta con clase CSS para estilos */}

      <h3>{title}</h3> 
      {/* Muestra el título del curso */}

      <p>{description}</p> 
      {/* Muestra la descripción del curso */}

      <button className="course-button" onClick={handleClick}> 
        {/* Botón con clase CSS, al hacer click llama a handleClick */}
        Ver curso
      </button>
    </div>
  );
};

export default CourseCard; 
// Exporta el componente para que pueda ser usado en otros archivos
