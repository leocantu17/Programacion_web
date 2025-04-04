// Thumbnail.jsx
function Thumbnail({ video }) {
    return (
      <img
        src={`https://img.youtube.com/vi/${getYouTubeID(video.url)}/0.jpg`}
        alt={video.title}
        width="320"
      />
    );
  }
  
  // LikeButton.jsx
  function LikeButton({ video }) {
    const handleLike = () => {
      alert(`Te gustó: ${video.title}`);
    };
  
    return <button onClick={handleLike}>👍 Me gusta</button>;
  }
  
  // Función auxiliar para sacar el ID del video
  function getYouTubeID(url) {
    const match = url.match(/v=([^&]+)/);
    return match ? match[1] : '';
  }
  
  function Video({ video }) {
    return (
      <div>
        <Thumbnail video={video} />
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          <h3>{video.title}</h3>
          <p>{video.description}</p>
        </a>
        <LikeButton video={video} />
      </div>
    );
  }
  
  export default Video;
  