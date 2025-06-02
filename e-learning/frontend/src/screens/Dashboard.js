import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchEnrolledCourses();
  }, []);
  const fetchCertificate = async (courseId) => {
  try {
    const response = await fetch(`http://localhost:5000/user/certificate/${courseId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('No se pudo generar el certificado');
    }

    const data = await response.json();
    const url = `http://localhost:5000/certificates/${data.ruta}`;
    window.open(url, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
  } catch (err) {
    alert('Error al generar el certificado');
    console.error(err);
  }
};


  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:5000/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No hay sesión activa");
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError("Error al obtener datos del usuario");
      console.error(err);
      // Redirigir al login si no hay sesión
      navigate("/login");
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/user/progress", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener cursos");
      }

      const data = await response.json();
      setEnrolledCourses(data);
    } catch (err) {
      setError("Error al cargar cursos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "#4CAF50"; // Verde
    if (percentage >= 50) return "#FF9800"; // Naranja
    return "#f44336"; // Rojo
  };

  const getProgressMessage = (percentage) => {
    if (percentage === 0) return "No iniciado";
    if (percentage < 25) return "Recién comenzado";
    if (percentage < 50) return "En progreso";
    if (percentage < 75) return "Avanzando bien";
    if (percentage < 100) return "Casi terminado";
    return "¡Completado!";
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <p className="error">{error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Bienvenido de vuelta 👋</h1>
          <p className="dashboard-subtitle">
            Continúa tu aprendizaje donde lo dejaste
          </p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Cursos Activos</h3>
            <p className="stat-number">{enrolledCourses.length}</p>
          </div>
          <div className="stat-card">
            <h3>Progreso Promedio</h3>
            <p className="stat-number">
              {enrolledCourses.length > 0
                ? Math.round(
                    enrolledCourses.reduce(
                      (acc, course) => acc + course.percentage,
                      0
                    ) / enrolledCourses.length
                  )
                : 0}
              %
            </p>
          </div>
          <div className="stat-card">
            <h3>Cursos Completados</h3>
            <p className="stat-number">
              {
                enrolledCourses.filter((course) => course.percentage === 100)
                  .length
              }
            </p>
          </div>
        </div>

        <section className="dashboard-courses">
          <h2>Tus Cursos</h2>
          {enrolledCourses.length === 0 ? (
            <div className="empty-state">
              <p>No tienes cursos en progreso</p>
              <button
                onClick={() => navigate("/courses")}
                className="browse-courses-btn"
              >
                Explorar Cursos
              </button>
            </div>
          ) : (
            <div className="dashboard-courses-grid">
              {enrolledCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="dashboard-course-card"
                  onClick={() => handleCourseClick(course.course_id)}
                >
                  <div className="course-card-header">
                    <h3>{course.course_title}</h3>
                    <span className="progress-badge">{course.percentage}%</span>
                  </div>

                  <p className="course-description">
                    {course.course_description}
                  </p>

                  <div className="progress-section">
                    <div className="progress-info">
                      <span className="progress-text">
                        {getProgressMessage(course.percentage)}
                      </span>
                      <span className="chapters-completed">
                        {course.chapters_completed} capítulos completados
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${course.percentage}%`,
                          backgroundColor: getProgressColor(course.percentage),
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="course-actions">
                    <button className="continue-btn">
                      {course.percentage === 0 ? "Comenzar" : "Continuar"}
                    </button>
                    {course.percentage === 100 && (
                      <button
                        className="certificate-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // prevenir que se active el click del card
                          fetchCertificate(course.course_id);
                        }}
                      >
                        Descargar Certificado
                      </button>
                    )}
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
