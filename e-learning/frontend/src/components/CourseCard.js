import React from "react";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ id, title, description }) => {
  const navigate = useNavigate();

  // Navega al detalle del curso
  const handleClick = () => {
    navigate(`/courses/${id}`);
  };

  return (
    <div className="course-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="course-button" onClick={handleClick}>
        Ver curso
      </button>
    </div>
  );
};

export default CourseCard;
