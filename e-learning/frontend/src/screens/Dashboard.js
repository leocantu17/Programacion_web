import React from "react";
import "../styles/Dashboard.css";

const Dashboard = () => {
  // Simulación de usuario logueado
  const user = {
    name: "Juan Pérez",
    enrolledCourses: [
      { id: 1, title: "Curso de Java", progress: 40 },
      { id: 2, title: "Curso de React", progress: 75 },
    ],
  };

  return (
    <div className="dashboard-container">

      <main className="dashboard-main">
        <h1>Bienvenido, {user.name} 👋</h1>

        <section className="dashboard-courses">
          <h2>Tus Cursos</h2>
          {user.enrolledCourses.length === 0 ? (
            <p>No estás inscrito en ningún curso.</p>
          ) : (
            <div className="dashboard-courses-grid">
              {user.enrolledCourses.map(course => (
                <div key={course.id} className="dashboard-course-card">
                  <h3>{course.title}</h3>
                  <p>Progreso: {course.progress}%</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
