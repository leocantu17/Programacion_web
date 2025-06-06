-- Active: 1742582930529@@localhost@3306@ecommerce_libros
USE ecommerce_libros;

SELECT * FROM usuario;

TRUNCATE TABLE autores;
CREATE TABLE autores (
    id_autor INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL
);

TRUNCATE TABLE categorias;
CREATE TABLE categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL
);

TRUNCATE TABLE editoriales;
CREATE TABLE editoriales (
    id_editorial INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    direccion VARCHAR(255) NULL,
    telefono VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    sitio_web VARCHAR(255) NULL
);

DROP TABLE IF EXISTS libros;
TRUNCATE TABLE libros;
CREATE TABLE libros (
    id_libro INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    id_editorial INT NOT NULL,
    isbn VARCHAR(13) UNIQUE NULL,
    sinopsis TEXT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    fecha_publicacion DATE NULL,
    numero_paginas SMALLINT NULL,
    idioma VARCHAR(50) NULL,
    portada_url VARCHAR(255) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_editorial) REFERENCES editoriales(id_editorial)
);

DROP TABLE IF EXISTS libros_autores;
TRUNCATE TABLE libros_autores;
CREATE TABLE libros_autores (
    id_libro INT NOT NULL,
    id_autor INT NOT NULL,
    PRIMARY KEY (id_libro, id_autor),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    FOREIGN KEY (id_autor) REFERENCES autores(id_autor)
);

DROP TABLE IF EXISTS libros_categorias;
TRUNCATE TABLE libros_categorias;
CREATE TABLE libros_categorias (
    id_libro INT NOT NULL,
    id_categoria INT NOT NULL,
    PRIMARY KEY (id_libro, id_categoria),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

TRUNCATE TABLE direcciones_envio;
DROP TABLE IF EXISTS direcciones_envio;
CREATE TABLE direcciones_envio (
    id_direccion_envio INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    nombre_destinatario VARCHAR(100) NOT NULL,
    calle VARCHAR(255) NOT NULL,
    colonia VARCHAR(100) NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    pais VARCHAR(100) NOT NULL DEFAULT 'México',
    telefono_contacto VARCHAR(20) NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

ALTER TABLE direcciones_envio ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;


DROP TABLE IF EXISTS carrito;
CREATE TABLE carrito (
    id_carrito INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE, -- Campo modificado a BOOLEAN
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

INSERT INTO carrito (id_usuario) VALUES (1);

CREATE TABLE carrito_detalles (
    id_detalle_carrito INT PRIMARY KEY AUTO_INCREMENT,
    id_carrito INT NOT NULL,
    id_libro INT NOT NULL,
    cantidad SMALLINT NOT NULL,
    precio_momento_adicion DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);

INSERT INTO direcciones_envio (id_usuario, nombre_destinatario, calle, colonia, ciudad, estado, codigo_postal, pais, telefono_contacto) 
VALUES
(1, 'Juan Pérez', 'Av. Reforma 123', 'Centro', 'Ciudad de México', 'CDMX', '06000', 'México', '5551234567'),
(1, 'María López', 'Calle Juárez 456', 'Las Lomas', 'Guadalajara', 'Jalisco', '44100', 'México', '3327654321'),
(1, 'Carlos Rodríguez', 'Carrera 7 #89', 'Chapultepec', 'Monterrey', 'Nuevo León', '64000', 'México', '8119876543'),
(1, 'Ana Torres', 'Paseo del Río 22', 'San Ángel', 'Puebla', 'Puebla', '72000', 'México', '2226549873');

