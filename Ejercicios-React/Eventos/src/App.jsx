// Componente Button que recibe dos props: onClick y children (contenido del botón)
function Button({ onClick, children }) {
  return (
    <button onClick={e => {
      e.stopPropagation();  // Detiene la propagación del evento para que no afecte al contenedor padre
      onClick();            // Llama a la función proporcionada al hacer clic
    }}>
      {children} // Muestra el contenido del botón (por ejemplo: "Play Movie")
    </button>
  );
}

// Componente principal Toolbar exportado por defecto
export default function Toolbar() {
  return (
    // Un <div> con clase "Toolbar" que muestra una alerta si se hace clic fuera de los botones
    <div className="Toolbar" onClick={() => {
      alert('You clicked on the toolbar!');
    }}>
      {/* Botón para reproducir una película */}
      <Button onClick={() => alert('Playing!')}>
        Play Movie
      </Button>

      {/* Botón para subir una imagen */}
      <Button onClick={() => alert('Uploading!')}>
        Upload Image
      </Button>
    </div>
  );
}
