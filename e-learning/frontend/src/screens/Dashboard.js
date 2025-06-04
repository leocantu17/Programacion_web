// Importamos React y hooks para estado y ciclo de vida
import React, { useState, useEffect } from "react";
// Importamos hook para navegación programática con React Router
import { useNavigate } from "react-router-dom";
// Importamos estilos específicos para el dashboard
import "../styles/Dashboard.css";

const Dashboard = () => {
  // Estado para almacenar datos del usuario (objeto o null inicialmente)
  const [user, setUser] = useState(null);
  // Estado para almacenar los cursos en los que el usuario está inscrito
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  // Estado para manejar si la página está cargando
  const [loading, setLoading] = useState(true);
  // Estado para mostrar mensajes de error
  const [error, setError] = useState("");
  // Hook para navegar programáticamente entre rutas
  const navigate = useNavigate();

  // useEffect que se ejecuta una sola vez cuando el componente monta
  useEffect(() => {
    // Llamamos a la función para obtener datos del usuario
    fetchUserData();
    // Llamamos a la función para obtener los cursos en progreso
    fetchEnrolledCourses();
  }, []);

  // Función para obtener el certificado de un curso por su ID
  const fetchCertificate = async (courseId) => {
    try {
      // Petición al backend para generar el certificado
      const response = await fetch(`http://localhost:5000/user/certificate/${courseId}`, {
        credentials: 'include', // incluir cookies (para sesión)
      });

      // Si la respuesta no es correcta, lanzamos error
      if (!response.ok) {
        throw new Error('No se pudo generar el certificado');
      }

      // Obtenemos datos en formato JSON
      const data = await response.json();
      // Construimos la URL donde está el certificado
      const url = `http://localhost:5000/certificates/${data.ruta}`;
      // Abrimos una nueva ventana/pestaña con el certificado, tamaño y opciones específicas
      window.open(url, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    } catch (err) {
      // Si ocurre error mostramos alerta y registramos en consola
      alert('Error al generar el certificado');
      console.error(err);
    }
  };

  // Función para obtener los datos del usuario actual (con sesión activa)
  const fetchUserData = async () => {
    try {
      // Petición al backend para obtener info del usuario
      const response = await fetch("http://localhost:5000/me", {
        credentials: "include", // incluir cookies
      });

      // Si no hay sesión activa lanzamos error
      if (!response.ok) {
        throw new Error("No hay sesión activa");
      }

      // Parseamos JSON con info del usuario
      const data = await response.json();
      // Guardamos los datos en el estado user
      setUser(data);
    } catch (err) {
      // Si hay error guardamos mensaje y redirigimos al login
      setError("Error al obtener datos del usuario");
      console.error(err);
      navigate("/login");
    }
  };

  // Función para obtener los cursos donde el usuario está inscrito y su progreso
  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true); // Indicamos que estamos cargando
      // Petición al backend para obtener progreso de cursos del usuario
      const response = await fetch("http://localhost:5000/user/progress", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener cursos");
      }

      const data = await response.json();
      setEnrolledCourses(data); // Guardamos los cursos y progreso
    } catch (err) {
      setError("Error al cargar cursos");
      console.error(err);
    } finally {
      setLoading(false); // Finaliza la carga aunque haya error o no
    }
  };

  // Función que maneja clic en un curso: navega a la página del curso
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // Función para determinar el color de la barra de progreso según porcentaje
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "#4CAF50"; // Verde para alto progreso
    if (percentage >= 50) return "#FF9800"; // Naranja para progreso medio
    return "#f44336"; // Rojo para progreso bajo
  };

  // Función para obtener un texto descriptivo según el porcentaje de progreso
  const getProgressMessage = (percentage) => {
    if (percentage === 0) return "No iniciado";
    if (percentage < 25) return "Recién comenzado";
    if (percentage < 50) return "En progreso";
    if (percentage < 75) return "Avanzando bien";
    if (percentage < 100) return "Casi terminado";
    return "¡Completado!";
  };

  // Mostrar pantalla de carga mientras se obtienen datos
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

  // Mostrar error si ocurrió alguno durante la carga
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

  // Renderizado principal del dashboard con la info del usuario y cursos
  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        {/* Cabecera de bienvenida */}
        <div className="dashboard-header">
          <h1>Bienvenido de vuelta 👋</h1>
          <p className="dashboard-subtitle">
            Continúa tu aprendizaje donde lo dejaste
          </p>
        </div>

        {/* Estadísticas generales */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Cursos Activos</h3>
            {/* Cantidad de cursos inscritos */}
            <p className="stat-number">{enrolledCourses.length}</p>
          </div>
          <div className="stat-card">
            <h3>Progreso Promedio</h3>
            <p className="stat-number">
              {/* Calcula promedio redondeado de porcentaje de todos los cursos */}
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
              {/* Cuenta cursos con porcentaje 100 */}
              {
                enrolledCourses.filter((course) => course.percentage === 100)
                  .length
              }
            </p>
          </div>
        </div>

        {/* Sección con lista de cursos */}
        <section className="dashboard-courses">
          <h2>Tus Cursos</h2>

          {/* Si no hay cursos, mostrar estado vacío */}
          {enrolledCourses.length === 0 ? (
            <div className="empty-state">
              <p>No tienes cursos en progreso</p>
              {/* Botón para navegar a explorar cursos */}
              <button
                onClick={() => navigate("/courses")}
                className="browse-courses-btn"
              >
                Explorar Cursos
              </button>
            </div>
          ) : (
            // Si hay cursos, mostrar grid con cards
            <div className="dashboard-courses-grid">
              {enrolledCourses.map((course) => (
                // Card individual para cada curso
                <div
                  key={course.course_id}
                  className="dashboard-course-card"
                  onClick={() => handleCourseClick(course.course_id)} // Navega al curso
                >
                  {/* Encabezado del card: título y progreso */}
                  <div className="course-card-header">
                    <h3>{course.course_title}</h3>
                    <span className="progress-badge">{course.percentage}%</span>
                  </div>

                  {/* Descripción del curso */}
                  <p className="course-description">
                    {course.course_description}
                  </p>

                  {/* Sección de progreso */}
                  <div className="progress-section">
                    <div className="progress-info">
                      <span className="progress-text">
                        {getProgressMessage(course.percentage)} {/* Texto descriptivo */}
                      </span>
                      <span className="chapters-completed">
                        {course.chapters_completed} capítulos completados
                      </span>
                    </div>

                    {/* Barra visual del progreso */}
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${course.percentage}%`, // Ancho dinámico según porcentaje
                          backgroundColor: getProgressColor(course.percentage), // Color dinámico
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Acciones posibles para el curso */}
                  <div className="course-actions">
                    {/* Botón para comenzar o continuar */}
                    <button className="continue-btn">
                      {course.percentage === 0 ? "Comenzar" : "Continuar"}
                    </button>

                    {/* Botón para descargar certificado solo si está completado */}
                    {course.percentage === 100 && (
                      <button
                        className="certificate-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar que al clickear aquí se active el click del card
                          fetchCertificate(course.course_id); // Descargar certificado
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

// Exportamos el componente para usarlo en la app
export default Dashboard;
