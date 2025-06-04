import { useReducer } from 'react'; // Importa el hook useReducer de React
import AddTask from './AddTask.jsx'; // Importa el componente AddTask
import TaskList from './TaskList.jsx'; // Importa el componente TaskList
import { TasksContext, TasksDispatchContext } from './TasksContext.jsx'; // Importa los contextos

// Componente principal que representa la aplicación de tareas
export default function TaskApp() {
  // Define el estado de las tareas y la función dispatch usando useReducer
  const [tasks, dispatch] = useReducer(
    tasksReducer, // Función reductora que gestiona las acciones
    initialTasks  // Estado inicial de las tareas
  );

  return (
    // Provee el estado de las tareas a través del contexto
    <TasksContext value={tasks}>
      {/* Provee la función dispatch para modificar las tareas */}
      <TasksDispatchContext value={dispatch}>
        <h1>Day off in Kyoto</h1> {/* Título de la aplicación */}
        <AddTask /> {/* Componente para agregar una nueva tarea */}
        <TaskList /> {/* Componente que muestra la lista de tareas */}
      </TasksDispatchContext>
    </TasksContext>
  );
}

// Función reductora que actualiza el estado de las tareas según la acción
function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': { // Si se añade una tarea
      return [...tasks, {
        id: action.id, // ID de la nueva tarea
        text: action.text, // Texto de la tarea
        done: false // Por defecto, la tarea no está completada
      }];
    }
    case 'changed': { // Si se cambia una tarea
      return tasks.map(t => {
        if (t.id === action.task.id) {
          return action.task; // Reemplaza la tarea con la nueva versión
        } else {
          return t; // Deja la tarea sin cambios
        }
      });
    }
    case 'deleted': { // Si se elimina una tarea
      return tasks.filter(t => t.id !== action.id); // Elimina la tarea con el ID especificado
    }
    default: { // Si la acción no es reconocida
      throw Error('Unknown action: ' + action.type); // Lanza un error
    }
  }
}

// Estado inicial con una lista de tareas predefinidas
const initialTasks = [
  { id: 0, text: 'Philosopher’s Path', done: true }, // Tarea completada
  { id: 1, text: 'Visit the temple', done: false }, // Tarea no completada
  { id: 2, text: 'Drink matcha', done: false } // Tarea no completada
];
