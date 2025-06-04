import { useState, useContext } from 'react'; // Importa useState y useContext desde React
import { TasksContext, TasksDispatchContext } from './TasksContext.js'; // Importa los contextos para tareas y dispatch

// Componente que muestra la lista completa de tareas
export default function TaskList() {
  const tasks = useContext(TasksContext); // Obtiene la lista de tareas desde el contexto

  return (
    <ul>
      {tasks.map(task => ( // Itera sobre cada tarea para mostrarla
        <li key={task.id}>
          <Task task={task} /> {/* Renderiza el componente Task para cada tarea */}
        </li>
      ))}
    </ul>
  );
}

// Componente que representa una tarea individual
function Task({ task }) {
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar si se está editando la tarea
  const dispatch = useContext(TasksDispatchContext); // Obtiene la función dispatch desde el contexto

  let taskContent; // Variable para almacenar el contenido de la tarea según el modo (editar o ver)

  if (isEditing) { // Si está en modo edición
    taskContent = (
      <>
        <input
          value={task.text} // Valor actual del texto de la tarea
          onChange={e => { // Al cambiar el texto del input
            dispatch({ // Envía una acción para actualizar la tarea con el nuevo texto
              type: 'changed',
              task: {
                ...task, // Copia la tarea actual
                text: e.target.value // Actualiza el texto con el nuevo valor
              }
            });
          }}
        />
        <button onClick={() => setIsEditing(false)}> {/* Botón para salir del modo edición */}
          Save
        </button>
      </>
    );
  } else { // Si NO está en modo edición, solo muestra el texto y un botón para editar
    taskContent = (
      <>
        {task.text} {/* Muestra el texto de la tarea */}
        <button onClick={() => setIsEditing(true)}> {/* Botón para activar el modo edición */}
          Edit
        </button>
      </>
    );
  }

  return (
    <label>
      <input
        type="checkbox" // Checkbox para marcar la tarea como hecha o no
        checked={task.done} // Marca el checkbox según el estado de la tarea
        onChange={e => { // Cuando cambia el checkbox
          dispatch({ // Envía una acción para cambiar el estado "done" de la tarea
            type: 'changed',
            task: {
              ...task, // Copia la tarea actual
              done: e.target.checked // Actualiza el estado según el checkbox
            }
          });
        }}
      />
      {taskContent} {/* Muestra el contenido de la tarea (texto o input de edición) */}
      <button onClick={() => { // Botón para eliminar la tarea
        dispatch({
          type: 'deleted',
          id: task.id // Indica qué tarea borrar por su id
        });
      }}>
        Delete
      </button>
    </label>
  );
}
