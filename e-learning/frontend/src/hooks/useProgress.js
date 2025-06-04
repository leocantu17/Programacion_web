import { useState, useEffect, useCallback } from 'react'; 
// Importa hooks de React: useState para estado, useEffect para efectos secundarios y useCallback para memorizar funciones

export const useProgress = (courseId) => {
  // Define el custom hook que recibe el id del curso para gestionar el progreso

  const [progress, setProgress] = useState({
    chapter_completed: 0,
    percentage: 0
  }); 
  // Estado para almacenar el progreso actual: capítulos completados y porcentaje completado

  const [loading, setLoading] = useState(true); 
  // Estado para saber si está cargando datos

  const [error, setError] = useState(null); 
  // Estado para almacenar posibles errores

  const fetchProgress = useCallback(async () => {
    // Función para obtener el progreso desde el backend, memoriza la función para que no se redefina innecesariamente
    if (!courseId) return; // Si no hay courseId, no hace nada

    try {
      setLoading(true); // Indica que comienza la carga
      setError(null);   // Limpia errores previos

      const response = await fetch(`http://localhost:5000/progress/${courseId}`, {
        credentials: 'include', // Enviar cookies de sesión
        headers: {
          'Content-Type': 'application/json' // Indicar que esperamos JSON
        }
      });

      if (!response.ok) {
        // Si la respuesta no es exitosa, lanza un error
        throw new Error('Error al obtener progreso');
      }

      const data = await response.json(); // Parsear respuesta JSON
      setProgress(data); // Actualiza el estado con el progreso recibido
    } catch (err) {
      setError(err.message); // Guarda el mensaje de error
      console.error('Error al obtener progreso:', err); // Log para debugging
    } finally {
      setLoading(false); // Finaliza la carga
    }
  }, [courseId]); // Solo cambia si cambia courseId

  const updateProgress = useCallback(async (chapterCompleted, percentage) => {
    // Función para actualizar el progreso en backend, también memorizada para no recrearse innecesariamente
    if (!courseId) return;

    try {
      const response = await fetch('http://localhost:5000/progress/update', {
        method: 'POST', // Método POST para enviar datos
        credentials: 'include', // Enviar cookies de sesión
        headers: {
          'Content-Type': 'application/json' // Tipo de contenido JSON
        },
        body: JSON.stringify({
          course_id: parseInt(courseId), // id del curso (asegura número)
          chapter_completed: chapterCompleted, // capítulos completados actualizados
          percentage: Math.round(percentage) // porcentaje redondeado
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar progreso'); // Error si no responde bien
      }

      const data = await response.json(); // Parsear respuesta (aunque no se usa explícitamente después)

      // Actualiza el estado local del progreso con los nuevos datos
      setProgress(prev => ({
        ...prev,
        chapter_completed: chapterCompleted,
        percentage: percentage
      }));

      return data; // Retorna la data para quien llame a esta función
    } catch (err) {
      setError(err.message); // Guarda error si hay
      console.error('Error al actualizar progreso:', err); // Log para debug
      throw err; // Re-lanza error para manejo externo
    }
  }, [courseId]);

  useEffect(() => {
    fetchProgress(); // Al montar el hook o cambiar courseId, obtiene el progreso actual
  }, [fetchProgress]); // Dependencia para refrescar si cambia la función

  return {
    progress,    // Datos del progreso actual
    loading,     // Estado de carga
    error,       // Error si hay
    updateProgress, // Función para actualizar el progreso
    refetch: fetchProgress // Función para volver a traer el progreso desde backend
  };
};
