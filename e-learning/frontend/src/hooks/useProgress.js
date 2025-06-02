import { useState, useEffect, useCallback } from 'react';

export const useProgress = (courseId) => {
  const [progress, setProgress] = useState({
    chapter_completed: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/progress/${courseId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener progreso');
      }

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      setError(err.message);
      console.error('Error al obtener progreso:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const updateProgress = useCallback(async (chapterCompleted, percentage) => {
    if (!courseId) return;
    
    try {
      const response = await fetch('http://localhost:5000/progress/update', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          course_id: parseInt(courseId),
          chapter_completed: chapterCompleted,
          percentage: Math.round(percentage)
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar progreso');
      }

      const data = await response.json();
      
      setProgress(prev => ({
        ...prev,
        chapter_completed: chapterCompleted,
        percentage: percentage
      }));

      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error al actualizar progreso:', err);
      throw err;
    }
  }, [courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    refetch: fetchProgress
  };
};