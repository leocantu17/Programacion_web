// Se importa el hook useState desde React
import { useState } from 'react';

// Se exporta el componente Chat, que recibe un prop: contact
export default function Chat({ contact }) {
  // Se declara el estado 'text' para almacenar el mensaje que escribe el usuario
  const [text, setText] = useState('');

  return (
    // Sección con clase "chat"
    <section className="chat">
      {/* Área de texto donde el usuario escribe su mensaje */}
      <textarea
        value={text}                              // El valor del área de texto es el estado 'text'
        placeholder={'Chat to ' + contact.name}   // Texto sugerido con el nombre del contacto
        onChange={e => setText(e.target.value)}   // Actualiza el estado con el texto escrito
      />
      <br />
      {/* Botón para enviar el mensaje, mostrando el correo del contacto */}
      <button>
        Send to {contact.email}
      </button>
    </section>
  );
}
