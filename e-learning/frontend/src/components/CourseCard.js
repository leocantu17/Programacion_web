const CourseCard = ({ title, description }) => (
  <div className="card">
    <h2>{title}</h2>
    <p>{description}</p>
    <button>Ver Curso</button>
  </div>
);

export default CourseCard;
