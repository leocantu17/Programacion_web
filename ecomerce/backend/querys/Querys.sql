-- Querys generales.
SELECT * FROM direcciones_envio;
SHOW TABLES

SELECT * FROM libros;

SELECT * FROM autores;

SELECT * FROM editoriales;

SELECT * FROM libros_categorias

SELECT * FROM usuario;

SELECT l.titulo, au.nombre, e.nombre FROM libros_autores la JOIN autores au ON la.id_autor = au.id_autor JOIN libros l ON l.id_libro = la.id_libro JOIN editoriales e ON e.id_editorial = l.id_editorial;

SELECT l.id_libro, l.titulo, l.portada_url, e.id_editorial, e.nombre FROM editoriales e INNER JOIN libros l ON e.id_editorial = l.id_editorial ORDER BY id_libro;

SELECT * FROM libros_categorias;

SELECT * FROM categorias

SELECT * FROM libros WHERE id_editorial = 10;

SELECT * FROM libros JOIN editoriales USING (id_editorial);

SELECT DISTINCT idioma FROM libros;

SELECT * FROM libros WHERE id_editorial = 7;

SELECT id_libro,titulo,idioma FROM libros WHERE titulo LIKE "%DxD%" AND id_editorial = 12;

UPDATE libros SET idioma = "Español" WHERE idioma = "es";

-- COMPROBACION DE INTEGRIDAD DE QUERYS OF CLAUDE

-- 1. Verificar si existe el libro con ID 28
SELECT * FROM libros WHERE id_libro = 28;

-- 2. Verificar si el libro está activo
SELECT id_libro, titulo, activo FROM libros WHERE id_libro = 28;

-- 3. Verificar la estructura de la tabla libros
DESCRIBE libros;

SHOW TABLES;

DESCRIBE usuario;

DESCRIBE direcciones_envio;

-- 4. Verificar si existen las tablas relacionadas
SELECT COUNT(*) as total_editoriales FROM editoriales;
SELECT COUNT(*) as total_categorias FROM categorias;
SELECT COUNT(*) as total_autores FROM autores;

-- 5. Probar la consulta completa manualmente
SELECT 
    l.id_libro,
    l.titulo,
    l.isbn,
    l.precio,
    l.sinopsis,
    l.fecha_publicacion,
    l.numero_paginas,
    l.idioma,
    l.portada_url,
    e.nombre AS editorial,
    c.nombre AS categoria
FROM libros l
JOIN editoriales e ON l.id_editorial = e.id_editorial
LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
WHERE l.id_libro = 28 AND l.activo = 1;

-- 6. Verificar autores del libro 28
SELECT a.nombre
FROM autores a
JOIN libros_autores la ON a.id_autor = la.id_autor
WHERE la.id_libro = 28;

SELECT * FROM carrito;

SELECT id_carrito, id_usuario, fecha_creacion, fecha_ultima_actualizacion, activo
            FROM carrito
            WHERE id_usuario = 1 AND activo = TRUE
            ORDER BY fecha_creacion DESC
            LIMIT 1

SELECT
                cd.id_libro,
                l.titulo,
                l.portada_url,
                cd.cantidad,
                cd.precio_momento_adicion,
                l.precio AS current_price -- Incluir el precio actual del libro
            FROM carrito_detalles cd
            JOIN libros l ON cd.id_libro = l.id_libro
            WHERE cd.id_carrito = 1

SHOW TABLES;

SELECT * FROM carrito_detalles;