import { useState, useRef, useEffect } from 'react'; // Importa hooks de React

// Componente que reproduce un video y controla reproducción según prop isPlaying
function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null); // Referencia al elemento <video>

  // Efecto que se ejecuta cada vez que cambia isPlaying
  useEffect(() => {
    if (isPlaying) { // Si isPlaying es true
      console.log('Calling video.play()'); // Log para depuración
      ref.current.play(); // Reproduce el video usando la referencia
    } else { // Si isPlaying es false
      console.log('Calling video.pause()'); // Log para depuración
      ref.current.pause(); // Pausa el video usando la referencia
    }
  }, [isPlaying]); // Se ejecuta cuando isPlaying cambia

  // Renderiza el elemento video con la referencia, fuente y opciones (loop, playsInline)
  return <video ref={ref} src={src} loop playsInline />;
}

// Componente principal de la app
export default function App() {
  const [isPlaying, setIsPlaying] = useState(false); // Estado para controlar si el video está reproduciéndose
  const [text, setText] = useState(''); // Estado para el texto del input

  return (
    <>
      {/* Input controlado para actualizar el texto */}
      <input value={text} onChange={e => setText(e.target.value)} />

      {/* Botón para alternar la reproducción del video */}
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'} {/* Muestra "Pause" si está reproduciendo, "Play" si no */}
      </button>

      {/* Componente VideoPlayer que recibe la fuente y el estado de reproducción */}
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
