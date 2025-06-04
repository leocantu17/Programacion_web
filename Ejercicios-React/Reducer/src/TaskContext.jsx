import { createContext } from 'react'; // Importa la función createContext desde React

// Crea un contexto para compartir el estado de las tareas entre componentes
export const TasksContext = createContext(null); // Este contexto contendrá la lista de tareas

// Crea un contexto para compartir la función dispatch entre componentes
export const TasksDispatchContext = createContext(null); // Este contexto contendrá la función para actualizar las tareas
