import React from "react";
import CourseCard from "../components/CourseCard";

const Home = () => {
  const courses = [
    { id: 1, title: "Curso de Java", description: "Aprende Java desde cero" },
    { id: 2, title: "Curso de JavaScript", description: "Domina JS moderno" },
    { id: 3, title: "Curso de HTML", description: "Fundamentos de HTML" },
    { id: 4, title: "Curso de CSS", description: "Estiliza tus páginas web" },
    { id: 5, title: "Curso de React", description: "Framework frontend popular" },
    { id: 6, title: "Curso de Python", description: "Automatiza con Python" },
    { id: 7, title: "Curso de SQL", description: "Maneja bases de datos" },
  ];

  return (
    <div className="home-container">
      <h1>Cursos Disponibles</h1>
      <div className="course-grid">
        {courses.map(course => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </div>
  );
};

export default Home;