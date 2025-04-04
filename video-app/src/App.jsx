import Video from './Video.jsx';

function App() {
  const videoData = {
    url: "https://www.youtube.com/watch?v=wGxDfSWC4Ww",
    title: "Aprende React en 15 minutos",
    description: "Curso rápido de React"
  };

  return (
    <div>
      <h1>Video destacado</h1>
      <Video video={videoData} />
    </div>
  );
}

export default App;
