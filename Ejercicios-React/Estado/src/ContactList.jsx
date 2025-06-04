// Se exporta el componente ContactList como función
export default function ContactList({
  selectedContact,  // El contacto actualmente seleccionado
  contacts,         // Lista de todos los contactos
  onSelect          // Función que se llama cuando el usuario selecciona un contacto
}) {
  return (
    // Sección con clase "contact-list"
    <section className="contact-list">
      <ul>
        {/* Se recorre la lista de contactos y se renderiza un <li> por cada uno */}
        {contacts.map(contact =>
          <li key={contact.email}>
            <button 
              onClick={() => {
                onSelect(contact); // Cuando se hace clic, se llama a onSelect con el contacto actual
              }}
            >
              {contact.name} // El nombre del contacto se muestra en el botón
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
