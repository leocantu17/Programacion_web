import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import '../styles/Courses.css';

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { progress, loading: progressLoading, updateProgress } = useProgress(id);
  
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [activeSection, setActiveSection] = useState('chapter0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [examResults, setExamResults] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [examPassed, setExamPassed] = useState(false);

  // Datos derivados
  const { chapters, courseProgress, canTakeExam, totalItems, completedItems } = useMemo(() => {
    if (!course?.content) {
      return { chapters: [], courseProgress: 0, canTakeExam: false, totalItems: 0, completedItems: 0 };
    }
    
    const chapters = course.content.chapters || [];
    const hasExam = course.content.exam ? 1 : 0;
    const totalItems = chapters.length + hasExam; // Capítulos + examen
    
    // Calcular items completados
    let completedItems = completedChapters.size;
    if (examPassed) {
      completedItems += 1; // Agregar el examen si está aprobado
    }
    
    const courseProgress = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100) 
      : 0;
    
    // El examen se habilita cuando se completan todos los capítulos
    const canTakeExam = chapters.length > 0 && completedChapters.size === chapters.length;
    
    return { chapters, courseProgress, canTakeExam, totalItems, completedItems };
  }, [course, completedChapters, examPassed]);

  // Verificar sesión activa
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
      return true; // Sesión válida
    } catch (err) {
      console.error("Error de autenticación:", err);
      navigate("/login");
      return false; // Sesión inválida
    }
  };

  // Cargar curso
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/courses/${id}`, {
        credentials: "include", // Agregar credenciales para mantener la sesión
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Si el servidor responde con 401 (No autorizado)
          navigate("/login");
          return;
        }
        throw new Error('Error al cargar curso');
      }
      
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      console.error("Error al cargar curso:", err);
      setError(err.message);
      // Si hay error de autenticación, redirigir a login
      if (err.message.includes('401') || err.message.includes('autenticación')) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto principal para verificar sesión y cargar curso
  useEffect(() => {
    const initializeComponent = async () => {
      if (id) {
        // Primero verificar la sesión
        const sessionValid = await fetchUserData();
        if (sessionValid) {
          // Solo cargar el curso si la sesión es válida
          await fetchCourse();
        }
      }
    };

    initializeComponent();
  }, [id]);

  // Inicializar progreso desde el servidor
  useEffect(() => {
    if (progress && !progressLoading) {
      const chaptersFromServer = progress.chapter_completed || 0;
      const newCompletedChapters = new Set();
      
      for (let i = 0; i < chaptersFromServer; i++) {
        newCompletedChapters.add(i);
      }
      
      setCompletedChapters(newCompletedChapters);
      
      // Verificar si el examen fue aprobado desde el servidor
      // Asumiendo que el servidor envía información sobre el examen aprobado
      if (progress.exam_passed || progress.percentage === 100) {
        setExamPassed(true);
      }
    }
  }, [progress, progressLoading]);

  // Actualizar progreso en el servidor
  const syncProgressToServer = useCallback(async (newCompletedChapters, examPassedStatus = examPassed) => {
    if (!chapters.length) return;
    
    const chaptersCompleted = newCompletedChapters.size;
    const hasExam = course.content.exam ? 1 : 0;
    const totalItems = chapters.length + hasExam;
    
    // Calcular items completados totales
    let totalCompleted = chaptersCompleted;
    if (examPassedStatus) {
      totalCompleted += 1;
    }
    
    const percentage = Math.round((totalCompleted / totalItems) * 100);
    
    try {
      // Enviar información adicional sobre el examen si está disponible
      const progressData = {
        chapter_completed: chaptersCompleted,
        exam_passed: examPassedStatus,
        percentage: percentage
      };
      
      await updateProgress(chaptersCompleted, percentage, progressData);
    } catch (err) {
      console.error('Error al sincronizar progreso:', err);
      // Si hay error de autenticación en el progreso, redirigir a login
      if (err.message && (err.message.includes('401') || err.message.includes('autenticación'))) {
        navigate("/login");
      }
    }
  }, [chapters.length, course, examPassed, updateProgress, navigate]);

  const markChapterComplete = useCallback((chapterIndex) => {
    setCompletedChapters(prev => {
      const newSet = new Set([...prev, chapterIndex]);
      syncProgressToServer(newSet);
      return newSet;
    });
  }, [syncProgressToServer]);

  const markExamPassed = useCallback(() => {
    setExamPassed(true);
    syncProgressToServer(completedChapters, true);
  }, [completedChapters, syncProgressToServer]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    if (section.startsWith('chapter')) {
      const chapterIndex = parseInt(section.replace('chapter', ''), 10);
      if (!isNaN(chapterIndex)) {
        markChapterComplete(chapterIndex);
      }
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitExam = () => {
    const exam = course.content.exam;
    if (!exam || !exam.questions) return;

    let correctAnswers = 0;
    const results = exam.questions.map((question, index) => {
      const userAnswer = currentAnswers[index];
      const isCorrect = userAnswer === question.answer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });

    const score = Math.round((correctAnswers / exam.questions.length) * 100);
    const passed = score >= (exam.passingScore || 70);

    setExamResults({
      score,
      passed,
      results,
      totalQuestions: exam.questions.length,
      correctAnswers
    });

    // Si aprobó el examen, marcarlo como completado y actualizar el progreso
    if (passed) {
      markExamPassed();
    }
  };

  const retakeExam = () => {
    setExamResults(null);
    setCurrentAnswers({});
    // No cambiar el estado de examPassed aquí, permitir múltiples intentos
  };

  const renderExam = () => {
    const exam = course.content.exam;
    if (!exam) {
      return <p>No hay examen disponible para este curso.</p>;
    }

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

    if (examResults) {
      return (
        <div className="exam-results">
          <h2>Resultados del Examen</h2>
          <div className={`score-display ${examResults.passed ? 'passed' : 'failed'}`}>
            <h3>{examResults.passed ? '🎉 ¡Aprobado!' : '❌ No Aprobado'}</h3>
            <p className="score">Puntuación: {examResults.score}%</p>
            <p>Respuestas correctas: {examResults.correctAnswers} de {examResults.totalQuestions}</p>
            {examResults.passed && (
              <p className="course-completion">🎓 ¡Curso completado al 100%!</p>
            )}
          </div>

          <div className="detailed-results">
            <h4>Revisión detallada:</h4>
            {examResults.results.map((result, index) => (
              <div key={index} className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                <h5>Pregunta {index + 1}: {result.question}</h5>
                <p><strong>Tu respuesta:</strong> {result.userAnswer}</p>
                <p><strong>Respuesta correcta:</strong> {result.correctAnswer}</p>
                {result.explanation && (
                  <p className="explanation"><strong>Explicación:</strong> {result.explanation}</p>
                )}
              </div>
            ))}
          </div>

          <div className="exam-actions">
            {!examResults.passed && (
              <button onClick={retakeExam} className="retake-button">
                Volver a intentar
              </button>
            )}
            <button onClick={() => navigate('/courses')} className="back-button">
              Volver a cursos
            </button>
          </div>
        </div>
      );
    }

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

        <div className="exam-questions">
          {exam.questions.map((question, index) => (
            <div key={index} className="question">
              <h4>Pregunta {index + 1}:</h4>
              <p className="question-text">{question.question}</p>
              
              <div className="options">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="option">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={currentAnswers[index] === option}
                      onChange={() => handleAnswerChange(index, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="exam-submit">
          <button 
            onClick={submitExam}
            className="submit-exam-button"
            disabled={Object.keys(currentAnswers).length !== exam.questions.length}
          >
            Enviar Examen
          </button>
        </div>
      </div>
    );
  };

  const renderChapter = (chapter, index) => {
    if (!chapter) return <p>Capítulo no encontrado.</p>;
    
    const isCompleted = completedChapters.has(index);
    
    return (
      <div className="chapter">
        <div className="chapter-header">
          <h2>{chapter.title}</h2>
          {isCompleted && <span className="completed-badge">✅ Completado</span>}
        </div>
        
        <p className="chapter-description">{chapter.description}</p>

        {chapter.video && (
          <div className="video-wrapper">
            <iframe
              width="100%"
              height="315"
              src={chapter.video}
              title={`Video del capítulo ${index + 1}`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              onLoad={() => {
                setTimeout(() => markChapterComplete(index), 2000);
              }}
            />
          </div>
        )}

        {chapter.content && (
          <div className="chapter-content">
            <h4>Contenido:</h4>
            <div className="content-text">{chapter.content}</div>
          </div>
        )}

        {chapter.resources && chapter.resources.length > 0 && (
          <div className="resources-section">
            <h4>Recursos adicionales:</h4>
            <ul className="resources-list">
              {chapter.resources.map((resource, i) => (
                <li key={i}>
                  <a href={resource} target="_blank" rel="noopener noreferrer">
                    📎 {resource}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="chapter-actions">
          <button 
            onClick={() => markChapterComplete(index)}
            className={`complete-button ${isCompleted ? 'completed' : ''}`}
            disabled={isCompleted}
          >
            {isCompleted ? 'Completado' : 'Marcar como completado'}
          </button>
        </div>
      </div>
    );
  };

  if (loading || progressLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando curso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error">{error}</p>
        <button onClick={() => navigate('/courses')}>Volver a cursos</button>
      </div>
    );
  }

  // Si no hay usuario (sesión no válida), no renderizar nada
  // ya que se habrá redirigido a login
  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="course-container">
      <aside className="sidebar">
        <div className="course-info">
          <h3>{course.title}</h3>
          <div className="progress-indicator">
            <div className="progress-header">
              <h4>📊 Progreso del Curso</h4>
              <span className="progress-percentage">{courseProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${courseProgress}%` }}
              />
            </div>
            <div className="progress-stats">
              <p>
                ✅ Completado: {completedItems} de {totalItems} elementos
              </p>
              <p className="progress-breakdown">
                📚 Capítulos: {completedChapters.size}/{chapters.length}
                {course.content.exam && (
                  <span> | 📝 Examen: {examPassed ? '1/1' : '0/1'}</span>
                )}
              </p>
              {courseProgress === 100 && (
                <p className="course-completed">🎉 ¡Curso Completado al 100%!</p>
              )}
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <h4>📚 Contenido del Curso</h4>
          <ul className="sidebar-list">
            {chapters.map((chapter, i) => {
              const isCompleted = completedChapters.has(i);
              const isActive = activeSection === `chapter${i}`;
              
              return (
                <li
                  key={i}
                  className={`sidebar-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : 'pending'}`}
                  onClick={() => handleSectionChange(`chapter${i}`)}
                >
                  <div className="chapter-info">
                    <span className="chapter-status">
                      {isCompleted ? '✅' : '📖'}
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
            
            {course.content.exam && (
              <li className="exam-divider">
                <hr />
                <span className="divider-text">Evaluación Final</span>
              </li>
            )}
            
            {course.content.exam && (
              <li
                className={`sidebar-item exam-item ${activeSection === 'exam' ? 'active' : ''} ${!canTakeExam ? 'locked' : examPassed ? 'completed' : 'available'}`}
                onClick={() => canTakeExam && handleSectionChange('exam')}
              >
                <div className="chapter-info">
                  <span className="exam-status">
                    {!canTakeExam ? '🔒' : examPassed ? '✅' : '📝'}
                  </span>
                  <span className="exam-title">Examen Final</span>
                </div>
                <div className="chapter-meta">
                  <span className={`status-text ${!canTakeExam ? 'locked-text' : examPassed ? 'completed-text' : 'available-text'}`}>
                    {!canTakeExam ? 'Bloqueado' : examPassed ? 'Aprobado' : 'Disponible'}
                  </span>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </aside>

      <main className="content">
        <div className="content-wrapper">
          {/* Encabezado con resumen de progreso */}
          <div className="content-header">
            <h1>{course.title}</h1>
            <div className="progress-summary">
              <div className="progress-circle">
                <span className="progress-text">{courseProgress}%</span>
              </div>
              <div className="progress-details">
                <p><strong>Tu progreso en este curso:</strong></p>
                <p>✅ {completedItems} elementos completados de {totalItems}</p>
                <p className="detailed-breakdown">
                  📚 Capítulos: {completedChapters.size}/{chapters.length}
                  {course.content.exam && (
                    <span> | 📝 Examen: {examPassed ? 'Aprobado' : 'Pendiente'}</span>
                  )}
                </p>
                {courseProgress === 100 ? (
                  <p className="completion-message">🎉 ¡Felicitaciones! Has completado todo el curso al 100%</p>
                ) : (
                  <p className="remaining-message">
                    📚 Te faltan {totalItems - completedItems} elementos por completar
                    {!examPassed && canTakeExam && ' (incluyendo el examen final)'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          {activeSection === 'exam' 
            ? renderExam()
            : activeSection.startsWith('chapter') && chapters.length > 0
            ? renderChapter(chapters[parseInt(activeSection.replace('chapter', ''), 10)], parseInt(activeSection.replace('chapter', ''), 10))
            : <p className="error">Sección no encontrada.</p>
          }
        </div>
      </main>
    </div>
  );
}

export default CourseDetail;