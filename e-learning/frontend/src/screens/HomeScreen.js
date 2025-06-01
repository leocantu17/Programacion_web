import React, { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import "../styles/style.css";
import axios from "axios";

const Home = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/courses")
      .then(response => {
        setCourses(response.data);
      })
      .catch(error => {
        console.error("Error al obtener los cursos:", error);
      });
  }, []);

  return (
    <div className="home-container">
      <h1 className="home-title">Explora Nuestros Cursos</h1>
      <p className="home-subtitle">Aprende a tu ritmo con los mejores contenidos online</p>
      <div className="course-grid">
        {courses.map(course => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </div>
  );
};

export default Home;
