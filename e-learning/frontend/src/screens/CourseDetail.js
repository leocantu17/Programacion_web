import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/Courses.css';

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [activeSection, setActiveSection] = useState('chapter0');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`http://localhost:5000/courses/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener el curso');
        return res.json();
      })
      .then((data) => {
        setCourse(data);
        setActiveSection('chapter0');
        setCurrentQuestion(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="loading">Cargando curso...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!course) return <p>No se encontró el curso.</p>;

  const { chapters = [], exam = {} } = course.content || {};
  const examQuestions = exam.questions || [];

  const activeIndex = activeSection.startsWith('chapter')
    ? parseInt(activeSection.replace('chapter', ''), 10)
    : -1;

  const handleAnswer = (selected) => {
    const question = examQuestions[currentQuestion];
    if (!question) return;

    if (selected === question.answer) {
      setFeedback('✅ ¡Correcto!');
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setFeedback('');
      }, 1000);
    } else {
      setFeedback('❌ Incorrecto, intenta otra vez.');
    }
  };

  const renderChapter = (chapter, index) => {
    if (!chapter) return <p>Capítulo no encontrado.</p>;
    return (
      <div className="chapter">
        <h2>{chapter.title}</h2>
        <p>{chapter.description}</p>

        {chapter.video && (
          <div className="video-wrapper" style={{ marginBottom: '20px' }}>
            <iframe
              width="100%"
              height="315"
              src={chapter.video}
              title={`Video del capítulo ${index + 1}`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {chapter.resources && chapter.resources.length > 0 && (
          <div>
            <h4>Recursos:</h4>
            <ul className="resources-list">
              {chapter.resources.map((res, i) => (
                <li key={i}>
                  <a href={res} target="_blank" rel="noopener noreferrer">
                    {res}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderExam = () => {
    if (currentQuestion >= examQuestions.length) {
      return <p className="exam-completed">🎉 ¡Has completado el examen!</p>;
    }

    const question = examQuestions[currentQuestion];
    return (
      <div className="exam">
        <h3>Examen Final</h3>
        <p className="question-text">{question.question}</p>
        <ul className="options-list">
          {question.options.map((opt, i) => (
            <li key={i}>
              <button
                onClick={() => handleAnswer(opt)}
                className="option-button"
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
        {feedback && (
          <p className={`feedback ${feedback.startsWith('✅') ? 'correct' : 'incorrect'}`}>
            {feedback}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="course-container">
      <aside className="sidebar">
        <h3>{course.title}</h3>
        <ul className="sidebar-list">
          {chapters.map((ch, i) => (
            <li
              key={i}
              className={activeSection === `chapter${i}` ? 'active' : ''}
              onClick={() => setActiveSection(`chapter${i}`)}
            >
              {ch.title}
            </li>
          ))}
          <li
            className={activeSection === 'exam' ? 'active' : ''}
            onClick={() => setActiveSection('exam')}
          >
            Examen Final
          </li>
        </ul>
      </aside>

      <main className="content">
        {activeSection.startsWith('chapter')
          ? renderChapter(chapters[activeIndex], activeIndex)
          : renderExam()}
      </main>
    </div>
  );
}

export default CourseDetail;
