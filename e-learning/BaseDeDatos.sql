CREATE DATABASE IF NOT EXISTS e_learning;
USE e_learning;

-- Tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Tabla de cursos
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL
);

-- Tabla de contenidos por curso
CREATE TABLE course_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    content TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  course_id INT,
  chapter_completed INT,
  percentage INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

INSERT INTO courses (title, description) VALUES
("Curso de Java", "Aprende Java desde cero"),
("Curso de JavaScript", "Domina JS moderno"),
("Curso de HTML", "Fundamentos de HTML"),
("Curso de CSS", "Estiliza tus páginas web"),
("Curso de React", "Framework frontend popular"),
("Curso de Python", "Automatiza con Python"),
("Curso de SQL", "Maneja bases de datos");

ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_code VARCHAR(4);
ALTER TABLE progress 
ADD UNIQUE KEY unique_user_course (user_id, course_id),
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Crear tabla de inscripciones (opcional, para cursos específicos por usuario)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- Insertar algunos datos de ejemplo para progreso (opcional)
INSERT IGNORE INTO progress (user_id, course_id, chapter_completed, percentage) VALUES
(1, 1, 2, 40),
(1, 2, 3, 75),
(1, 3, 1, 25);

-- Insertar inscripciones de ejemplo (opcional)
INSERT IGNORE INTO enrollments (user_id, course_id, status) VALUES
(1, 1, 'active'),
(1, 2, 'active'),
(1, 3, 'active');
