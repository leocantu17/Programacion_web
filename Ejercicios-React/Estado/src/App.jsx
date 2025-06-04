// Se importa el hook useState de React
import { useState } from 'react';

// Se importan los componentes Chat y ContactList desde archivos separados
import Chat from './Chat.jsx';
import ContactList from './ContactList.jsx';

// Componente principal Messenger
export default function Messenger() {
  // Se define el estado 'to' que representa el contacto seleccionado inicialmente (por defecto, el primero de la lista)
  const [to, setTo] = useState(contacts[0]);

  return (
    <div>
      {/* Componente de lista de contactos */}
      <ContactList
        contacts={contacts}             // Se pasa la lista completa de contactos
        selectedContact={to}            // Se indica cuál contacto está seleccionado actualmente
        onSelect={contact => setTo(contact)}  // Función que actualiza el contacto seleccionado
      />

      {/* Componente de chat que muestra la conversación con el contacto seleccionado */}
      <Chat contact={to} />
    </div>
  );
}

// Lista de contactos disponibles en la app
const contacts = [
  { name: 'Taylor', email: 'taylor@mail.com' },
  { name: 'Alice', email: 'alice@mail.com' },
  { name: 'Bob', email: 'bob@mail.com' }
];
