// Se define un componente funcional llamado Profile
function Profile() {
  return (
    // Devuelve una imagen con una URL específica y un texto alternativo
    <img
      src="https://i.imgur.com/MK3eW3As.jpg" // URL de la imagen de Katherine Johnson
      alt="Katherine Johnson"              // Texto alternativo que describe la imagen
    />
  );
}

// Se exporta por defecto un componente funcional llamado Gallery
export default function Gallery() {
  return (
    // Devuelve una sección HTML que contiene un título y tres componentes Profile
    <section>
      <h1>Amazing scientists</h1>  // Título de la galería
      <Profile />  {/* Se renderiza la imagen de Katherine Johnson */}
      <Profile />  {/* Se vuelve a renderizar la misma imagen */}
      <Profile />  {/* Se vuelve a renderizar la misma imagen una vez más */}
    </section>
  );
}
