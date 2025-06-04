// Importaciones de React y hooks necesarios
import React, { useEffect, useState, useCallback, useMemo } from 'react';
// Importación de hooks de React Router para navegación y parámetros de URL
import { useParams, useNavigate } from 'react-router-dom';
// Hook personalizado para manejar el progreso del curso
import { useProgress } from '../hooks/useProgress';
// Importación de estilos CSS específicos para cursos
import '../styles/Courses.css';

// Componente funcional principal para mostrar detalles del curso
function CourseDetail() {
  // Extrae el parámetro 'id' de la URL usando useParams
  const { id } = useParams();
  // Hook para navegación programática
  const navigate = useNavigate();
  // Hook personalizado que maneja el progreso del curso, recibe el ID del curso
  const { progress, loading: progressLoading, updateProgress } = useProgress(id);
  
  // Estados locales del componente
  const [user, setUser] = useState(null); // Información del usuario autenticado
  const [course, setCourse] = useState(null); // Datos del curso actual
  const [activeSection, setActiveSection] = useState('chapter0'); // Sección activa (capítulo o examen)
  const [loading, setLoading] = useState(true); // Estado de carga general
  const [error, setError] = useState(''); // Mensajes de error
  const [completedChapters, setCompletedChapters] = useState(new Set()); // Capítulos completados (usando Set para evitar duplicados)
  const [examResults, setExamResults] = useState(null); // Resultados del examen
  const [currentAnswers, setCurrentAnswers] = useState({}); // Respuestas actuales del examen
  const [examPassed, setExamPassed] = useState(false); // Estado de aprobación del examen

  // useMemo para calcular datos derivados y evitar recálculos innecesarios
  const { chapters, courseProgress, canTakeExam, totalItems, completedItems } = useMemo(() => {
    // Si no hay contenido del curso, retorna valores por defecto
    if (!course?.content) {
      return { chapters: [], courseProgress: 0, canTakeExam: false, totalItems: 0, completedItems: 0 };
    }
    
    // Extrae los capítulos del contenido del curso
    const chapters = course.content.chapters || [];
    // Verifica si hay examen (1 si existe, 0 si no)
    const hasExam = course.content.exam ? 1 : 0;
    // Calcula el total de elementos (capítulos + examen)
    const totalItems = chapters.length + hasExam;
    
    // Calcula items completados comenzando con el número de capítulos completados
    let completedItems = completedChapters.size;
    // Si el examen fue aprobado, suma 1 al total completado
    if (examPassed) {
      completedItems += 1;
    }
    
    // Calcula el porcentaje de progreso del curso
    const courseProgress = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100) 
      : 0;
    
    // El examen se habilita solo cuando todos los capítulos están completados
    const canTakeExam = chapters.length > 0 && completedChapters.size === chapters.length;
    
    // Retorna todos los valores calculados
    return { chapters, courseProgress, canTakeExam, totalItems, completedItems };
  }, [course, completedChapters, examPassed]); // Dependencias del useMemo

  // Función asíncrona para verificar la sesión del usuario
  const fetchUserData = async () => {
    try {
      // Realiza petición al endpoint /me para verificar sesión
      const response = await fetch("http://localhost:5000/me", {
        credentials: "include", // Incluye cookies de sesión
      });

      // Si la respuesta no es exitosa, lanza error
      if (!response.ok) {
        throw new Error("No hay sesión activa");
      }

      // Convierte la respuesta a JSON
      const data = await response.json();
      // Actualiza el estado del usuario
      setUser(data);
      return true; // Retorna true si la sesión es válida
    } catch (err) {
      // Manejo de errores de autenticación
      console.error("Error de autenticación:", err);
      // Redirige al login si no hay sesión válida
      navigate("/login");
      return false; // Retorna false si la sesión es inválida
    }
  };

  // Función asíncrona para cargar los datos del curso
  const fetchCourse = async () => {
    try {
      // Activa el estado de carga
      setLoading(true);
      // Realiza petición para obtener el curso específico por ID
      const response = await fetch(`http://localhost:5000/courses/${id}`, {
        credentials: "include", // Incluye credenciales para mantener la sesión
      });
      
      // Verifica si la respuesta es exitosa
      if (!response.ok) {
        // Si es error 401 (No autorizado), redirige a login
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        // Para otros errores, lanza excepción genérica
        throw new Error('Error al cargar curso');
      }
      
      // Convierte respuesta a JSON y actualiza estado del curso
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      // Manejo de errores
      console.error("Error al cargar curso:", err);
      setError(err.message);
      // Si hay error de autenticación, redirige a login
      if (err.message.includes('401') || err.message.includes('autenticación')) {
        navigate("/login");
      }
    } finally {
      // Desactiva el estado de carga sin importar el resultado
      setLoading(false);
    }
  };

  // useEffect principal para inicializar el componente
  useEffect(() => {
    // Función asíncrona para inicializar de forma secuencial
    const initializeComponent = async () => {
      // Solo procede si hay un ID de curso
      if (id) {
        // Primero verifica la sesión del usuario
        const sessionValid = await fetchUserData();
        // Solo carga el curso si la sesión es válida
        if (sessionValid) {
          await fetchCourse();
        }
      }
    };

    // Ejecuta la inicialización
    initializeComponent();
  }, [id]); // Se ejecuta cuando cambia el ID del curso

  // useEffect para inicializar el progreso desde el servidor
  useEffect(() => {
    // Solo procede si hay datos de progreso y no está cargando
    if (progress && !progressLoading) {
      // Obtiene el número de capítulos completados del servidor
      const chaptersFromServer = progress.chapter_completed || 0;
      // Crea un nuevo Set para los capítulos completados
      const newCompletedChapters = new Set();
      
      // Agrega cada capítulo completado al Set
      for (let i = 0; i < chaptersFromServer; i++) {
        newCompletedChapters.add(i);
      }
      
      // Actualiza el estado de capítulos completados
      setCompletedChapters(newCompletedChapters);
      
      // Verifica si el examen fue aprobado desde el servidor
      if (progress.exam_passed || progress.percentage === 100) {
        setExamPassed(true);
      }
    }
  }, [progress, progressLoading]); // Dependencias: progreso y estado de carga del progreso

  // useCallback para sincronizar progreso con el servidor, evita recreaciones innecesarias
  const syncProgressToServer = useCallback(async (newCompletedChapters, examPassedStatus = examPassed) => {
    // No hace nada si no hay capítulos
    if (!chapters.length) return;
    
    // Calcula el número de capítulos completados
    const chaptersCompleted = newCompletedChapters.size;
    // Verifica si hay examen
    const hasExam = course.content.exam ? 1 : 0;
    // Calcula total de elementos
    const totalItems = chapters.length + hasExam;
    
    // Calcula items completados totales
    let totalCompleted = chaptersCompleted;
    // Suma el examen si fue aprobado
    if (examPassedStatus) {
      totalCompleted += 1;
    }
    
    // Calcula el porcentaje de completación
    const percentage = Math.round((totalCompleted / totalItems) * 100);
    
    try {
      // Prepara los datos de progreso para enviar al servidor
      const progressData = {
        chapter_completed: chaptersCompleted,
        exam_passed: examPassedStatus,
        percentage: percentage
      };
      
      // Llama al hook para actualizar el progreso en el servidor
      await updateProgress(chaptersCompleted, percentage, progressData);
    } catch (err) {
      // Manejo de errores
      console.error('Error al sincronizar progreso:', err);
      // Si hay error de autenticación, redirige a login
      if (err.message && (err.message.includes('401') || err.message.includes('autenticación'))) {
        navigate("/login");
      }
    }
  }, [chapters.length, course, examPassed, updateProgress, navigate]); // Dependencias del useCallback

  // useCallback para marcar un capítulo como completado
  const markChapterComplete = useCallback((chapterIndex) => {
    // Actualiza el estado de capítulos completados
    setCompletedChapters(prev => {
      // Crea un nuevo Set con el capítulo agregado
      const newSet = new Set([...prev, chapterIndex]);
      // Sincroniza inmediatamente con el servidor
      syncProgressToServer(newSet);
      return newSet;
    });
  }, [syncProgressToServer]); // Dependencia: función de sincronización

  // useCallback para marcar el examen como aprobado
  const markExamPassed = useCallback(() => {
    // Actualiza el estado del examen
    setExamPassed(true);
    // Sincroniza con el servidor pasando true para el examen
    syncProgressToServer(completedChapters, true);
  }, [completedChapters, syncProgressToServer]); // Dependencias del useCallback

  // Función para manejar cambios de sección (capítulos o examen)
  const handleSectionChange = (section) => {
    // Actualiza la sección activa
    setActiveSection(section);
    
    // Si la sección es un capítulo
    if (section.startsWith('chapter')) {
      // Extrae el índice del capítulo del nombre de la sección
      const chapterIndex = parseInt(section.replace('chapter', ''), 10);
      // Si el índice es válido, marca el capítulo como completado
      if (!isNaN(chapterIndex)) {
        markChapterComplete(chapterIndex);
      }
    }
  };

  // Función para manejar cambios en las respuestas del examen
  const handleAnswerChange = (questionIndex, answer) => {
    // Actualiza las respuestas actuales del examen
    setCurrentAnswers(prev => ({
      ...prev, // Mantiene respuestas anteriores
      [questionIndex]: answer // Actualiza la respuesta específica
    }));
  };

  // Función para enviar y calificar el examen
  const submitExam = () => {
    // Obtiene los datos del examen del curso
    const exam = course.content.exam;
    // Si no hay examen o preguntas, no hace nada
    if (!exam || !exam.questions) return;

    // Inicializa contador de respuestas correctas
    let correctAnswers = 0;
    // Evalúa cada pregunta y genera resultados
    const results = exam.questions.map((question, index) => {
      // Obtiene la respuesta del usuario para esta pregunta
      const userAnswer = currentAnswers[index];
      // Verifica si la respuesta es correcta
      const isCorrect = userAnswer === question.answer;
      // Incrementa contador si es correcta
      if (isCorrect) correctAnswers++;
      
      // Retorna objeto con detalles de la respuesta
      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });

    // Calcula la puntuación como porcentaje
    const score = Math.round((correctAnswers / exam.questions.length) * 100);
    // Determina si aprobó basado en la puntuación mínima (70% por defecto)
    const passed = score >= (exam.passingScore || 70);

    // Actualiza el estado con los resultados del examen
    setExamResults({
      score,
      passed,
      results,
      totalQuestions: exam.questions.length,
      correctAnswers
    });

    // Si aprobó el examen, lo marca como completado
    if (passed) {
      markExamPassed();
    }
  };

  // Función para permitir reintentar el examen
  const retakeExam = () => {
    // Limpia los resultados del examen
    setExamResults(null);
    // Limpia las respuestas actuales
    setCurrentAnswers({});
    // Nota: No cambia examPassed, permite múltiples intentos sin perder el progreso
  };

  // Función para renderizar la sección del examen
  const renderExam = () => {
    // Obtiene los datos del examen
    const exam = course.content.exam;
    // Si no hay examen, muestra mensaje
    if (!exam) {
      return <p>No hay examen disponible para este curso.</p>;
    }

    // Si no puede tomar el examen (capítulos incompletos)
    if (!canTakeExam) {
      return (
        <div className="exam-locked">
          <h2>🔒 Examen Final</h2>
          <p>Completa todos los capítulos para desbloquear el examen.</p>
          <div className="progress-info">
            <p>Progreso: {completedChapters.size} de {chapters.length} capítulos completados</p>
          </div>
        </div>
      );
    }

    // Si ya hay resultados del examen, los muestra
    if (examResults) {
      return (
        <div className="exam-results">
          <h2>Resultados del Examen</h2>
          {/* Muestra puntuación general con clase CSS condicional */}
          <div className={`score-display ${examResults.passed ? 'passed' : 'failed'}`}>
            <h3>{examResults.passed ? '🎉 ¡Aprobado!' : '❌ No Aprobado'}</h3>
            <p className="score">Puntuación: {examResults.score}%</p>
            <p>Respuestas correctas: {examResults.correctAnswers} de {examResults.totalQuestions}</p>
            {/* Mensaje especial si completó el curso */}
            {examResults.passed && (
              <p className="course-completion">🎓 ¡Curso completado al 100%!</p>
            )}
          </div>

          {/* Revisión detallada de cada pregunta */}
          <div className="detailed-results">
            <h4>Revisión detallada:</h4>
            {examResults.results.map((result, index) => (
              // Cada resultado con clase CSS condicional según si es correcta
              <div key={index} className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <h5>Pregunta {index + 1}: {result.question}</h5>
                <p><strong>Tu respuesta:</strong> {result.userAnswer}</p>
                <p><strong>Respuesta correcta:</strong> {result.correctAnswer}</p>
                {/* Muestra explicación si está disponible */}
                {result.explanation && (
                  <p className="explanation"><strong>Explicación:</strong> {result.explanation}</p>
                )}
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="exam-actions">
            {/* Botón de reintento solo si no aprobó */}
            {!examResults.passed && (
              <button onClick={retakeExam} className="retake-button">
                Volver a intentar
              </button>
            )}
            {/* Botón para volver a la lista de cursos */}
            <button onClick={() => navigate('/courses')} className="back-button">
              Volver a cursos
            </button>
          </div>
        </div>
      );
    }

    // Renderiza el formulario del examen si no hay resultados
    return (
      <div className="exam-section">
        <h2>📝 Examen Final</h2>
        <p className="exam-description">{exam.description}</p>
        <p className="exam-info">
          Puntuación mínima para aprobar: {exam.passingScore || 70}%
        </p>
        <div className="exam-progress-note">
          <p><strong>Nota:</strong> Aprobar este examen completará el curso al 100%</p>
        </div>

        {/* Renderiza todas las preguntas del examen */}
        <div className="exam-questions">
          {exam.questions.map((question, index) => (
            <div key={index} className="question">
              <h4>Pregunta {index + 1}:</h4>
              <p className="question-text">{question.question}</p>
              
              {/* Opciones de respuesta como radio buttons */}
              <div className="options">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="option">
                    <input
                      type="radio"
                      name={`question-${index}`} // Nombre único por pregunta
                      value={option}
                      checked={currentAnswers[index] === option} // Verifica si está seleccionada
                      onChange={() => handleAnswerChange(index, option)} // Maneja el cambio
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Botón para enviar el examen */}
        <div className="exam-submit">
          <button 
            onClick={submitExam}
            className="submit-exam-button"
            // Deshabilita el botón si no se han respondido todas las preguntas
            disabled={Object.keys(currentAnswers).length !== exam.questions.length}
          >
            Enviar Examen
          </button>
        </div>
      </div>
    );
  };

  // Función para renderizar un capítulo específico
  const renderChapter = (chapter, index) => {
    // Si no hay capítulo, muestra mensaje de error
    if (!chapter) return <p>Capítulo no encontrado.</p>;
    
    // Verifica si el capítulo está completado
    const isCompleted = completedChapters.has(index);
    
    return (
      <div className="chapter">
        {/* Encabezado del capítulo */}
        <div className="chapter-header">
          <h2>{chapter.title}</h2>
          {/* Badge de completado si aplica */}
          {isCompleted && <span className="completed-badge">✅ Completado</span>}
        </div>
        
        {/* Descripción del capítulo */}
        <p className="chapter-description">{chapter.description}</p>

        {/* Video del capítulo si existe */}
        {chapter.video && (
          <div className="video-wrapper">
            <iframe
              width="100%"
              height="315"
              src={chapter.video}
              title={`Video del capítulo ${index + 1}`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              // Marca automáticamente el capítulo como completado después de 2 segundos
              onLoad={() => {
                setTimeout(() => markChapterComplete(index), 2000);
              }}
            />
          </div>
        )}

        {/* Contenido textual del capítulo si existe */}
        {chapter.content && (
          <div className="chapter-content">
            <h4>Contenido:</h4>
            <div className="content-text">{chapter.content}</div>
          </div>
        )}

        {/* Recursos adicionales si existen */}
        {chapter.resources && chapter.resources.length > 0 && (
          <div className="resources-section">
            <h4>Recursos adicionales:</h4>
            <ul className="resources-list">
              {chapter.resources.map((resource, i) => (
                <li key={i}>
                  {/* Enlaces a recursos externos */}
                  <a href={resource} target="_blank" rel="noopener noreferrer">
                    📎 {resource}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón para marcar manualmente como completado */}
        <div className="chapter-actions">
          <button 
            onClick={() => markChapterComplete(index)}
            className={`complete-button ${isCompleted ? 'completed' : ''}`} // Clase condicional
            disabled={isCompleted} // Deshabilitado si ya está completado
          >
            {isCompleted ? 'Completado' : 'Marcar como completado'}
          </button>
        </div>
      </div>
    );
  };

  // Renderizado condicional: muestra spinner mientras carga
  if (loading || progressLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando curso...</p>
      </div>
    );
  }

  // Renderizado condicional: muestra error si lo hay
  if (error) {
    return (
      <div className="error-container">
        <p className="error">{error}</p>
        <button onClick={() => navigate('/courses')}>Volver a cursos</button>
      </div>
    );
  }

  // Renderizado condicional: muestra spinner si no hay usuario (verificando sesión)
  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  // Renderizado principal del componente
  return (
    <div className="course-container">
      {/* Barra lateral con navegación y progreso */}
      <aside className="sidebar">
        {/* Información general del curso */}
        <div className="course-info">
          <h3>{course.title}</h3>
          <div className="progress-indicator">
            <div className="progress-header">
              <h4>📊 Progreso del Curso</h4>
              <span className="progress-percentage">{courseProgress}%</span>
            </div>
            {/* Barra de progreso visual */}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${courseProgress}%` }} // Ancho dinámico basado en progreso
              />
            </div>
            {/* Estadísticas detalladas del progreso */}
            <div className="progress-stats">
              <p>
                ✅ Completado: {completedItems} de {totalItems} elementos
              </p>
              <p className="progress-breakdown">
                📚 Capítulos: {completedChapters.size}/{chapters.length}
                {/* Muestra información del examen si existe */}
                {course.content.exam && (
                  <span> | 📝 Examen: {examPassed ? '1/1' : '0/1'}</span>
                )}
              </p>
              {/* Mensaje especial cuando se completa el curso */}
              {courseProgress === 100 && (
                <p className="course-completed">🎉 ¡Curso Completado al 100%!</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Navegación por capítulos */}
        <nav className="sidebar-nav">
          <h4>📚 Contenido del Curso</h4>
          <ul className="sidebar-list">
            {/* Lista de capítulos */}
            {chapters.map((chapter, i) => {
              // Estado del capítulo
              const isCompleted = completedChapters.has(i);
              const isActive = activeSection === `chapter${i}`;
              
              return (
                <li
                  key={i}
                  // Clases CSS múltiples basadas en estado
                  className={`sidebar-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : 'pending'}`}
                  onClick={() => handleSectionChange(`chapter${i}`)} // Cambia de sección al hacer clic
                >
                  <div className="chapter-info">
                    <span className="chapter-status">
                      {isCompleted ? '✅' : '📖'} {/* Icono condicional */}
                    </span>
                    <span className="chapter-title">{chapter.title}</span>
                  </div>
                  <div className="chapter-meta">
                    <span className={`status-text ${isCompleted ? 'completed-text' : 'pending-text'}`}>
                      {isCompleted ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                </li>
              );
            })}
            
            {/* Divisor visual si hay examen */}
            {course.content.exam && (
              <li className="exam-divider">
                <hr />
                <span className="divider-text">Evaluación Final</span>
              </li>
            )}
            
            {/* Item del examen si existe */}
            {course.content.exam && (
              <li
                // Clases CSS múltiples basadas en estado del examen
                className={`sidebar-item exam-item ${activeSection === 'exam' ? 'active' : ''} ${!canTakeExam ? 'locked' : examPassed ? 'completed' : 'available'}`}
                // Solo permite clic si puede tomar el examen
                onClick={() => canTakeExam && handleSectionChange('exam')}
              >
                <div className="chapter-info">
                  <span className="exam-status">
                    {/* Icono condicional basado en estado */}
                    {!canTakeExam ? '🔒' : examPassed ? '✅' : '📝'}
                  </span>
                  <span className="exam-title">Examen Final</span>
                </div>
                <div className="chapter-meta">
                  <span className={`status-text ${!canTakeExam ? 'locked-text' : examPassed ? 'completed-text' : 'available-text'}`}>
                    {/* Texto condicional basado en estado */}
                    {!canTakeExam ? 'Bloqueado' : examPassed ? 'Aprobado' : 'Disponible'}
                  </span>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="content">
        <div className="content-wrapper">
          {/* Encabezado con resumen de progreso */}
          <div className="content-header">
            <h1>{course.title}</h1>
            <div className="progress-summary">
              {/* Círculo de progreso */}
              <div className="progress-circle">
                <span className="progress-text">{courseProgress}%</span>
              </div>
              {/* Detalles del progreso */}
              <div className="progress-details">
                <p><strong>Tu progreso en este curso:</strong></p>
                <p>✅ {completedItems} elementos completados de {totalItems}</p>
                <p className="detailed-breakdown">
                  📚 Capítulos: {completedChapters.size}/{chapters.length}
                  {/* Información del examen si existe */}
                  {course.content.exam && (
                    <span> | 📝 Examen: {examPassed ? 'Aprobado' : 'Pendiente'}</span>
                  )}
                </p>
                {/* Mensaje condicional basado en progreso */}
                {courseProgress === 100 ? (
                  <p className="completion-message">🎉 ¡Felicitaciones! Has completado todo el curso al 100%</p>
                ) : (
                  <p className="remaining-message">
                    📚 Te faltan {totalItems - completedItems} elementos por completar
                    {/* Nota adicional sobre el examen */}
                    {!examPassed && canTakeExam && ' (incluyendo el examen final)'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Renderizado condicional del contenido principal */}
          {activeSection === 'exam' 
            ? renderExam() // Renderiza examen si la sección activa es 'exam'
            : activeSection.startsWith('chapter') && chapters.length > 0
            ? renderChapter(chapters[parseInt(activeSection.replace('chapter', ''), 10)], parseInt(activeSection.replace('chapter', ''), 10)) // Renderiza capítulo específico
            : <p className="error">Sección no encontrada.</p> // Mensaje de error si no encuentra la sección
          }
        </div>
      </main>
    </div>
  );
}

// Exporta el componente como default
export default CourseDetail;