from flask import Flask, jsonify, request, g
from flask_cors import CORS
import mysql.connector
import datetime # Para manejar fechas de expiración de tokens
from datetime import timezone
import bcrypt # Para hashear y verificar contraseñas
import jwt # Para generar y verificar tokens JWT
import os # Para acceder a variables de entorno
from dotenv import load_dotenv
import re # Para expresiones regulares
import html # Para escapar HTML
import bleach # Para sanitización avanzada (pip install bleach)
from werkzeug.exceptions import BadRequest
import functools

load_dotenv() # Carga las variables del archivo .env

# Importa las funciones de db.py
from db import get_db, close_db, init_app, get_active_cart_by_user, create_cart, deactivate_cart, get_book_price, get_book_stock_by_id, add_or_update_item_in_cart_details,update_item_quantity_in_cart_details, remove_item_from_cart_details, get_cart_details_by_cart_id

app = Flask(__name__)
CORS(app, supports_credentials=True) # Habilita CORS para todas las rutas

# --- Configuración de la base de datos ---
# Es recomendable usar variables de entorno para las credenciales
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'sample') # ¡CAMBIA ESTO!
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'ecommerce_libros') # Asegúrate que este sea el nombre de tu DB

# --- Configuración de JWT ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'super_secreto_y_cambialo') # ¡CAMBIA ESTO por una cadena larga y aleatoria!
app.config['JWT_EXP_DELTA_SECONDS'] = 3600 # Token expira en 1 hora (3600 segundos)
app.config['JWT_ALGORITHM'] = 'HS256'

# Inicializa la aplicación con las funciones de DB
init_app(app)

class DataSanitizer:
    @staticmethod
    def sanitize_string(value, max_length=None, allow_html=False):
        """Sanitiza strings removiendo caracteres peligrosos"""
        if not isinstance(value, str):
            return None
        
        # Remover espacios en blanco al inicio y final
        value = value.strip()

        # Verificar longitud
        if max_length and len(value) > max_length:
            return None
        
        # Si no permitimos HTML, escaparlo
        if not allow_html:
            value = html.escape(value)
        else:
            # Si permitimos HTML, usar bleach para sanitizar
            allowed_tags = ['b', 'i', 'u', 'strong', 'em']
            value = bleach.clean(value, tags=allowed_tags, strip=True)

        return value
    
    @staticmethod
    def sanitize_email(email):
        """Valida y sanitiza direcciones de email"""
        if not isinstance(email, str):
            return None
        
        email = email.strip().lower()
        
        # Patrón básico para validar email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not re.match(email_pattern, email):
            return None
        
        # Verificar longitud máxima
        if len(email) > 254:  # RFC 5321
            return None
        
        return email
    
    @staticmethod
    def sanitize_name(name):
        """Sanitiza nombres permitiendo solo letras, espacios y algunos caracteres especiales"""
        if not isinstance(name, str):
            return None
        
        name = name.strip()

        # Solo permitir letras, espacios, guiones y apostrofes
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$", name):
            return None
        
        # Verificar longitud
        if len(name) < 2 or len(name) > 50:
            return None
        
        return name
    
    @staticmethod
    def validate_password(password):
        """Valida contraseñas (solo longitud)."""
        if not isinstance(password, str):
            return None

        if len(password) < 8:
            return False # Retorna False si no cumple la longitud mínima

        if len(password) > 128:
            return False # Retorna False si excede la longitud máxima

        return True # Retorna True si la longitud es válida

# --- Middleware para obtener la conexión a la DB en cada request ---
@app.before_request
def load_logged_in_user():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
        payload = verify_token(token)
        if 'user_id' in payload:
            g.user_id = payload['user_id']
            g.email = payload['email']
        else:
            g.user_id = None
            g.email = None
    else:
        g.user_id = None
        g.email = None


def login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if g.user_id is None:
            return jsonify({"message": "Autenticación requerida. Por favor, inicie sesión."}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Funciones de JWT ---
def generate_token(user_id, email):
    """Genera un token JWT para el usuario."""

    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.datetime.now(timezone.utc) + datetime.timedelta(seconds=app.config['JWT_EXP_DELTA_SECONDS'])
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm=app.config['JWT_ALGORITHM'])

def verify_token(token):
    """Verifica el token JWT y devuelve el payload si es válido."""
    try:  
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[app.config['JWT_ALGORITHM']])
        return payload
    except jwt.ExpiredSignatureError:
        return {'message': 'Token expirado', 'code': 401}
    except jwt.InvalidTokenError:
        return {'message': 'Token inválido', 'code': 401}



# --- Consultas a la Base de dato ---
def get_matching_book_ids(query_term):
    """Obtiene IDs de libros que coinciden con el término de búsqueda"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        sql = """
            SELECT DISTINCT l.id_libro
            FROM libros l
            LEFT JOIN libros_autores la ON l.id_libro = la.id_libro
            LEFT JOIN autores a ON la.id_autor = a.id_autor
            WHERE l.activo = 1
        """
        params = []
        if query_term:
            search_pattern = f"%{query_term}%"
            sql += " AND (l.titulo LIKE %s OR l.isbn LIKE %s OR a.nombre LIKE %s)"
            params.extend([search_pattern, search_pattern, search_pattern])
    
        cursor.execute(sql, params)
        return [row['id_libro'] for row in cursor.fetchall()]
    finally:
        cursor.close()

def collect_filter_data(book_ids):
    """Recolecta datos para generar filtros dinámicos - CORREGIDO para ONLY_FULL_GROUP_BY"""
    if not book_ids:
        return []
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    placeholders = ', '.join(['%s'] * len(book_ids))

    try:
        # Primero obtenemos los datos básicos de los libros
        sql_books = f"""
            SELECT
                l.id_libro,
                l.titulo,
                l.precio,
                l.idioma,
                e.nombre AS editorial_nombre
            FROM libros l
            JOIN editoriales e ON l.id_editorial = e.id_editorial
            WHERE l.id_libro IN ({placeholders}) AND l.activo = 1
        """

        cursor.execute(sql_books, book_ids)
        books_data = cursor.fetchall()

        # Luego obtenemos los autores por separado
        sql_authors = f"""
            SELECT
                la.id_libro,
                GROUP_CONCAT(DISTINCT a.nombre ORDER BY a.nombre SEPARATOR '|||') AS autores_concat
            FROM libros_autores la
            JOIN autores a ON la.id_autor = a.id_autor
            WHERE la.id_libro IN ({placeholders})
            GROUP BY la.id_libro
        """
        cursor.execute(sql_authors, book_ids)
        authors_data = {row['id_libro']: row['autores_concat'] for row in cursor.fetchall()}

        # Combinamos los datos
        result = []
        for book in books_data:
            book_with_authors = dict(book)
            book_with_authors['autores_concat'] = authors_data.get(book['id_libro'], '')
            result.append(book_with_authors)
        
        return result
    finally:
        cursor.close()

def apply_filters(books, authors, publishers, languages, min_price, max_price):
    """Aplica filtros a la lista de libros"""
    filtered_books = []
    
    for book in books:
        book_authors = []
        if book['autores_concat']:
            book_authors = [s.strip() for s in book['autores_concat'].split('|||') if s.strip()]
        
        # Aplicar filtros usando negación para simplificar
        if authors:
            selected_authors = [a.strip() for a in authors.split(',') if a.strip()]
            if not any(auth in book_authors for auth in selected_authors):
                continue
        
        if publishers:
            selected_publishers = [p.strip() for p in publishers.split(',') if p.strip()]
            if book['editorial_nombre'] not in selected_publishers:
                continue
        
        if languages:
            selected_languages = [lang.strip() for lang in languages.split(',') if lang.strip()]
            if book['idioma'] not in selected_languages:
                continue
        
        if min_price is not None and book['precio'] < min_price:
            continue
        
        if max_price is not None and book['precio'] > max_price:
            continue
        
        filtered_books.append(book)
    
    return filtered_books

def generate_available_filters(books):
    """Genera filtros disponibles basados en los libros"""
    all_authors = set()
    all_publishers = set()
    all_languages = set()
    prices = []
    
    for book in books:
        if book['autores_concat']:
            book_authors = [s.strip() for s in book['autores_concat'].split('|||') if s.strip()]
            all_authors.update(book_authors)
        
        all_publishers.add(book['editorial_nombre'])
        all_languages.add(book['idioma'])
        prices.append(float(book['precio']))
    
    return {
        "authors": sorted(list(all_authors)),
        "publishers": sorted(list(all_publishers)),
        "languages": sorted(list(all_languages)),
        "price_range": [min(prices), max(prices)] if prices else [0.0, 0.0]
    }

def get_paginated_books(query_term, authors, publishers, languages, min_price, max_price, page, per_page):
    """Obtiene libros paginados con filtros aplicados - CORREGIDO para ONLY_FULL_GROUP_BY"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    offset = (page - 1) * per_page
    
    try:
        sql = """
            SELECT
                l.id_libro AS idLibro,
                l.titulo AS title,
                l.precio AS price,
                l.portada_url AS imageUrl
            FROM libros l
            JOIN editoriales e ON l.id_editorial = e.id_editorial
        """
        
        params = []
        conditions = ["l.activo = 1"]
        join_authors = False
        
        if query_term:
            search_pattern = f"%{query_term}%"
            # Para búsqueda por autores necesitamos el JOIN
            conditions.append("(l.titulo LIKE %s OR l.isbn LIKE %s OR EXISTS (SELECT 1 FROM libros_autores la JOIN autores a ON la.id_autor = a.id_autor WHERE la.id_libro = l.id_libro AND a.nombre LIKE %s))")
            params.extend([search_pattern, search_pattern, search_pattern])
        
        if authors:
            author_list = [a.strip() for a in authors.split(',') if a.strip()]
            if author_list:
                placeholders = ', '.join(['%s'] * len(author_list))
                conditions.append(f"EXISTS (SELECT 1 FROM libros_autores la JOIN autores a ON la.id_autor = a.id_autor WHERE la.id_libro = l.id_libro AND a.nombre IN ({placeholders}))")
                params.extend(author_list)
        
        if publishers:
            publisher_list = [p.strip() for p in publishers.split(',') if p.strip()]
            if publisher_list:
                placeholders = ', '.join(['%s'] * len(publisher_list))
                conditions.append(f"e.nombre IN ({placeholders})")
                params.extend(publisher_list)
        
        if languages:
            language_list = [lang.strip() for lang in languages.split(',') if lang.strip()]
            if language_list:
                placeholders = ', '.join(['%s'] * len(language_list))
                conditions.append(f"l.idioma IN ({placeholders})")
                params.extend(language_list)
        
        if min_price is not None:
            conditions.append("l.precio >= %s")
            params.append(min_price)
        
        if max_price is not None:
            conditions.append("l.precio <= %s")
            params.append(max_price)
        
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        
        sql += " ORDER BY l.titulo LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(sql, params)
        return cursor.fetchall()
    finally:
        cursor.close()



# --- Rutas / Endpoint de Autenticación ---
@app.route('/api/register', methods=['POST'])
def register():
    db = get_db()
    cursor = db.cursor()
    try:
        data = request.get_json()

        # Obtener y sanitizar datos
        email = DataSanitizer.sanitize_email(data.get('email'))
        password = data.get('password')
        nombre = DataSanitizer.sanitize_name(data.get('nombre'))
        apellido = DataSanitizer.sanitize_name(data.get('apellido'))

        if not email:
            return jsonify({"message": "Formato de correo electrónico inválido o ausente"}), 400
        if not nombre:
            return jsonify({"message": "Nombre inválido o ausente (solo letras, espacios, guiones, apostrofes, 2-100 caracteres)"}), 400
        if not apellido:
            return jsonify({"message": "Apellido inválido o ausente (solo letras, espacios, guiones, apostrofes, 2-100 caracteres)"}), 400
        if not DataSanitizer.validate_password(password):
            return jsonify({"message": "Contraseña inválida (mínimo 8 caracteres, máximo 128)"}), 400

        # Verificar si el email ya existe
        cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "El correo ingresado ya está registrado"}), 409
        
        # Hashear la contraseña
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insertar nuevo usuario
        query = """
        INSERT INTO usuario (nombre, apellido, email, password_hash)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (nombre, apellido, email, hashed_password))
        db.commit() # Confirmar la transacción

        user_id = cursor.lastrowid
        # Generar token de sesión para el nuevo usuario
        token = generate_token(user_id, email)

        return jsonify({
            "message": "Registro exitoso",
            "user": {"id_usuario": user_id, "nombre": nombre, "email": email},
            "token": token
        }), 201

    except BadRequest as e:
        return jsonify({"message": str(e)}), 400
    except mysql.connector.Error as err:
        db.rollback() # Revertir la transacción en caso de error 
        return jsonify({"message": f"Error de base de datos: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado: {e}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    db = get_db()
    cursor =db.cursor(dictionary=True)
    try:
        data = request.get_json()

        # Sanitizar datos de entrada
        email = DataSanitizer.sanitize_email(data.get('email'))
        password = data.get('password')  # No sanitizamos la contraseña para login, solo validamos

        if not email or not password:
            return jsonify({"message": "Email o contraseña inválidos"}), 400
        
        # Verificar longitud de contraseña para evitar ataques
        if len(password) > 128:
            return jsonify({"message": "Email o contraseña incorrectos"}), 401

        # Buscar usuario por email
        cursor.execute("SELECT id_usuario, nombre, email, password_hash, activo FROM usuario WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if user is None:
            return jsonify({"message": "Email o contraseña incorrectos"}), 401
        
        if not user['activo']:
            return jsonify({"message": "Tu cuenta está inactiva. Contacta al soporte."}), 403

        # Verificar contraseña hasheada
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({"message": "Email o contraseña incorrectos"}), 401

        # Generar token de sesión
        token = generate_token(user['id_usuario'], user['email'])

        return jsonify({
            "message": "Inicio de sesión exitoso",
            "user": {"id_usuario": user['id_usuario'], "nombre": user['nombre'], "email": user['email']},
            "token": token
        }), 200
    except BadRequest as e:
        return jsonify({"message": str(e)}), 400
    except mysql.connector.Error as err:
        return jsonify({"message": f"Error de base de datos: {err}"}), 500        
    except Exception as e:
        return jsonify({"message": f"Error inesperado: {e}"}), 500
    finally: cursor.close()



# --- Endpoint para Busqueda y Filtrado de Libros
@app.route('/api/books/search', methods=['GET'])
def search_books():
    try:
        # Obtener parámetros de consulta
        query_term = request.args.get('q', '').strip()
        authors = request.args.get('authors', '')
        publishers = request.args.get('publishers', '')
        languages = request.args.get('languages', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)

        # Limitar per_page para evitar sobrecarga
        per_page = min(per_page, 100)

        # Paso 1: Obtener IDs de libros que coinciden con la búsqueda
        matching_book_ids = get_matching_book_ids(query_term)

        # Si no hay coincidencias con los terminos de busqueda
        if not matching_book_ids:
            return jsonify({
                "books": [],
                "total_results": 0,
                "page": page,
                "per_page": per_page,
                "available_filters": {
                    "authors": [],
                    "publishers": [],
                    "languages": [],
                    "price_range": [0.0, 0.0]
                }
            }), 200
        
        # Paso 2: Recolectar datos para filtros
        all_books_details = collect_filter_data(matching_book_ids)

        # Paso 3: Aplicar filtros
        filtered_books = apply_filters(all_books_details, authors, publishers, languages, min_price, max_price)

        total_results = len(filtered_books)

        # Paso 4: Generar filtros disponibles
        available_filters = generate_available_filters(filtered_books)

        # Paso 5: Obtener libros paginados
        books = get_paginated_books(query_term, authors, publishers, languages, min_price, max_price, page, per_page)

        return jsonify({
            "books": books,
            "total_results": total_results,
            "page": page,
            "per_page": per_page,
            "available_filters": available_filters
        }), 200
    
    except mysql.connector.Error as err:
        #logger.error(f"Database error in search_books: {err}")
        return jsonify({"message": "Error en la búsqueda"}), 500
    except Exception as e:
        #logger.error(f"Unexpected error in search_books: {e}")
        return jsonify({"message": "Error interno del servidor"}), 500

# --- Endpoint de Detalles del Libro ---
@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book_details(book_id): 
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Consulta principal para obtener detalles del libro
        sql = """
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
                e.nombre AS editorial
            FROM libros l
            JOIN editoriales e ON l.id_editorial = e.id_editorial
            WHERE l.id_libro = %s AND l.activo = 1
        """
        
        cursor.execute(sql, (book_id,))
        book = cursor.fetchone()
        
        if not book:
            return jsonify({"message": "Libro no encontrado"}), 404
        
        # Obtener autores del libro
        sql_authors = """
            SELECT a.nombre
            FROM autores a
            JOIN libros_autores la ON a.id_autor = la.id_autor
            WHERE la.id_libro = %s
        """
        
        cursor.execute(sql_authors, (book_id,))
        authors_result = cursor.fetchall()
        authors = [row['nombre'] for row in authors_result]
        
        # Obtener categorías del libro
        sql_categories = """
            SELECT c.nombre
            FROM categorias c
            JOIN libros_categorias lc ON c.id_categoria = lc.id_categoria
            WHERE lc.id_libro = %s
        """
        
        cursor.execute(sql_categories, (book_id,))
        categories_result = cursor.fetchall()
        categories = [row['nombre'] for row in categories_result]
        
        # Manejar fecha_publicacion de forma segura
        fecha_pub = None
        if book['fecha_publicacion']:
            try:
                if hasattr(book['fecha_publicacion'], 'isoformat'):
                    fecha_pub = book['fecha_publicacion'].isoformat()
                else:
                    fecha_pub = str(book['fecha_publicacion'])
            except Exception:
                fecha_pub = None
        
        # Construir respuesta
        book_details = {
            "id_libro": book['id_libro'],
            "titulo": book['titulo'],
            "autores": authors,
            "editorial": book['editorial'],
            "categorias": categories,
            "isbn": book['isbn'],
            "precio": float(book['precio']) if book['precio'] is not None else 0.0,
            "sinopsis": book['sinopsis'],
            "fecha_publicacion": fecha_pub,
            "numero_paginas": book['numero_paginas'],
            "idioma": book['idioma'],
            "portada_url": book['portada_url']
        }
        
        return jsonify(book_details), 200
        
    except mysql.connector.Error as err:
        # logger.error(f"Database error in get_book_details: {err}")
        return jsonify({"message": "Error al obtener detalles del libro"}), 500
    except Exception as e:
        # logger.error(f"Unexpected error in get_book_details: {e}")
        return jsonify({"message": "Error interno del servidor"}), 500
    finally:
        cursor.close


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """
    Returns a list of all categories in the database.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        sql = "SELECT id_categoria, nombre, FROM categorias ORDER BY nombre"
        cursor.execute(sql)
        categories = cursor.fetchall()
        
        return jsonify(categories), 200
    except mysql.connector.Error as err:
        return jsonify({"message": f"Error de base de datos al obtener categorías: {err}"}), 500
    except Exception as e:
        return jsonify({"message": f"Error inesperado al obtener categorías: {e}"}), 500
    finally:
        cursor.close()


# --- Nuevo Endpoint para Direcciones de Envío del Usuario ---
@app.route('/api/addresses', methods=['GET'])
def get_addresses():
    if not g.user_id:
        return jsonify({"message": "No autenticado"}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT
                id_direccion_envio AS id,
                nombre_destinatario AS recipientName,
                calle AS street,
                colonia AS neighborhood,
                ciudad AS city,
                estado AS state,
                codigo_postal AS zipCode,
                pais AS country,
                telefono_contacto AS contactPhone
            FROM direcciones_envio
            WHERE id_usuario = %s
            ORDER BY id_direccion_envio
        """
        cursor.execute(query, (g.user_id,))
        addresses = cursor.fetchall()
        return jsonify(addresses), 200
    except mysql.connector.Error as err:
        return jsonify({"message": f"Error de base de datos al obtener direcciones: {err}"}), 500
    except Exception as e:
        return jsonify({"message": f"Error inesperado al obtener direcciones: {e}"}), 500
    finally:
        cursor.close()

@app.route('/api/addresses/<int:address_id>', methods=['PUT'])
def update_address(address_id):
    if not g.user_id:
        return jsonify({"message": "No autenticado"}), 401

    db = get_db()
    cursor = db.cursor()
    try:
        data = request.get_json()
        # Sanitizar todas las entradas de texto usando DataSanitizer
        calle = DataSanitizer.sanitize_string(data.get('calle'), max_length=255)
        colonia = DataSanitizer.sanitize_string(data.get('colonia'), max_length=255)
        ciudad = DataSanitizer.sanitize_string(data.get('ciudad'), max_length=255)
        estado = DataSanitizer.sanitize_string(data.get('estado'), max_length=255)
        codigo_postal = DataSanitizer.sanitize_string(data.get('codigo_postal'), max_length=10)
        pais = DataSanitizer.sanitize_string(data.get('pais'), max_length=100)
        telefono_contacto = DataSanitizer.sanitize_string(data.get('telefono_contacto'), max_length=20)

        if not all([calle, colonia, ciudad, estado, codigo_postal, pais, telefono_contacto]):
            return jsonify({"message": "Todos los campos de dirección son requeridos y válidos"}), 400

        update_query = """
            UPDATE direcciones_envio
            SET calle = %s, colonia = %s, ciudad = %s, estado = %s, codigo_postal = %s, pais = %s, telefono_contacto = %s
            WHERE id_direccion = %s AND id_usuario = %s
        """
        cursor.execute(update_query, (calle, colonia, ciudad, estado, codigo_postal, pais, telefono_contacto, address_id, g.user_id))
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Dirección no encontrada o no pertenece al usuario"}), 404
        return jsonify({"message": "Dirección actualizada exitosamente"}), 200
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos al actualizar dirección: {err}"}), 500
    except BadRequest:
        return jsonify({"message": "Solicitud JSON inválida"}), 400
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado al actualizar dirección: {e}"}), 500
    finally:
        cursor.close()

@app.route('/api/addresses/<int:address_id>', methods=['DELETE'])
def delete_address(address_id):
    if not g.user_id:
        return jsonify({"message": "No autenticado"}), 401

    db = get_db()
    cursor = db.cursor()
    try:
        delete_query = "DELETE FROM direcciones_envio WHERE id_direccion_envio = %s AND id_usuario = %s"
        cursor.execute(delete_query, (address_id, g.user_id))
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Dirección no encontrada o no pertenece al usuario"}), 404
        return jsonify({"message": "Dirección eliminada exitosamente"}), 200
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos al eliminar dirección: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado al eliminar dirección: {e}"}), 500
    finally:
        cursor.close()

@app.route('/api/users/<int:user_id>/addresses/<int:address_id>', methods=['DELETE'])
def delete_user_address(user_id, address_id):
    """
    Elimina una dirección de envío específica de un usuario.
    Requiere autenticación y autorización (el user_id del token debe coincidir con el user_id solicitado).
    """
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({"message": "Token de autenticación requerido"}), 401

    token = token.split(' ')[1]  # Remove 'Bearer '
    payload = verify_token(token)

    if 'code' in payload and payload['code'] == 401:
        return jsonify({"message": payload['message']}), 401

    # Authorization check: Ensure the token belongs to the user whose address is being deleted
    if payload['user_id'] != user_id:
        return jsonify({"message": "No autorizado para eliminar esta dirección"}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Verify that the address belongs to the user before deleting
        cursor.execute("SELECT id_direccion_envio FROM direcciones_envio WHERE id_direccion_envio = %s AND id_usuario = %s", (address_id, user_id))
        address_to_delete = cursor.fetchone()

        if not address_to_delete:
            return jsonify({"message": "Dirección no encontrada para este usuario"}), 404

        sql = "DELETE FROM direcciones_envio WHERE id_direccion_envio = %s AND id_usuario = %s"
        cursor.execute(sql, (address_id, user_id))
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "No se pudo eliminar la dirección"}), 404 # Should ideally not happen if address_to_delete found it
        
        return jsonify({"message": "Dirección eliminada exitosamente"}), 200
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos al eliminar dirección: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado al eliminar dirección: {e}"}), 500
    finally:
        cursor.close()


# app.py

# ... (existing code for login, register, search, etc.) ...

# --- Endpoints de Carrito de Compras ---

@app.route('/api/cart', methods=['GET'])
#@login_required
def get_cart():
    """
    Obtiene el carrito activo del usuario autenticado, incluyendo sus detalles.
    """
    user_id = g.user_id
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cart_data = get_active_cart_by_user(user_id)
        
        if cart_data:
            cart_id = cart_data['id_carrito']
            cart_items_data = get_cart_details_by_cart_id(cart_id)
            
            # Formatear los ítems del carrito
            items_formatted = []
            for item in cart_items_data:
                items_formatted.append({
                    "book_id": item['id_libro'],
                    "title": item['titulo'],
                    "quantity": item['cantidad'],
                    "price_at_addition": float(item['precio_momento_adicion']),
                    "current_price": float(item['current_price']), # Add current price for display
                    "image_url": item['portada_url']
                })
            
            return jsonify({
                "message": "Carrito recuperado exitosamente",
                "cart": {
                    "id_carrito": cart_data['id_carrito'],
                    "fecha_creacion": cart_data['fecha_creacion'].isoformat(),
                    "fecha_ultima_actualizacion": cart_data['fecha_ultima_actualizacion'].isoformat(),
                    "activo": cart_data['activo'],
                    "items": items_formatted
                }
            }), 200
        else:
            return jsonify({"message": "No hay un carrito activo para este usuario", "cart": None}), 200
    except mysql.connector.Error as err:
        return jsonify({"message": f"Error de base de datos al obtener carrito: {err}"}), 500
    except Exception as e:
        return jsonify({"message": f"Error inesperado al obtener carrito: {e}"}), 500
    finally:
        cursor.close()


@app.route('/api/cart/items', methods=['POST'])
#@login_required
def add_item_to_cart():
    """
    Añade un libro al carrito o actualiza su cantidad si ya existe.
    Crea un carrito si el usuario no tiene uno activo.
    """
    data = request.get_json()
    user_id = g.user_id
    book_id = data.get('book_id')
    quantity = data.get('quantity')

    if not book_id or quantity <= 0:
        return jsonify({"message": "ID de libro y cantidad (mayor a 0) son requeridos."}), 400

    db = get_db()
    
    try:
        # Verificar si el libro existe y está activo, y obtener su precio
        book_price = get_book_price(book_id)
        if book_price is None:
            return jsonify({"message": "Libro no encontrado o inactivo."}), 404

        # Verificar stock disponible
        current_stock = get_book_stock_by_id(book_id)
        if current_stock is None:
            return jsonify({"message": "Error al verificar el stock del libro."}), 500
        
        # Obtener el carrito activo del usuario
        active_cart = get_active_cart_by_user(user_id)
        
        # Si no hay carrito activo, crear uno
        if not active_cart:
            cart_id = create_cart(user_id)
            if not cart_id:
                return jsonify({"message": "Error al crear el carrito."}), 500
        else:
            cart_id = active_cart['id_carrito']

        # Obtener la cantidad actual del libro en el carrito para verificar stock
        current_item_quantity_in_cart = 0
        cart_items = get_cart_details_by_cart_id(cart_id)
        for item in cart_items:
            if item['id_libro'] == book_id:
                current_item_quantity_in_cart = item['cantidad']
                break
        
        total_quantity_after_add = current_item_quantity_in_cart + quantity

        if total_quantity_after_add > current_stock:
            return jsonify({"message": f"No hay suficiente stock para añadir {quantity} unidades. Stock disponible: {current_stock - current_item_quantity_in_cart}"}), 400

        # Añadir o actualizar el ítem en el carrito
        success = add_or_update_item_in_cart_details(cart_id, book_id, quantity, book_price)
        
        if success:
            # Obtener el carrito actualizado para la respuesta
            updated_cart_data = get_active_cart_by_user(user_id)
            updated_cart_items = get_cart_details_by_cart_id(updated_cart_data['id_carrito'])
            
            items_formatted = []
            for item in updated_cart_items:
                items_formatted.append({
                    "book_id": item['id_libro'],
                    "title": item['titulo'],
                    "quantity": item['cantidad'],
                    "price_at_addition": float(item['precio_momento_adicion']),
                    "current_price": float(item['current_price']),
                    "image_url": item['portada_url']
                })

            return jsonify({
                "message": "Libro añadido/actualizado en el carrito",
                "cart": {
                    "id_carrito": updated_cart_data['id_carrito'],
                    "fecha_creacion": updated_cart_data['fecha_creacion'].isoformat(),
                    "fecha_ultima_actualizacion": updated_cart_data['fecha_ultima_actualizacion'].isoformat(),
                    "activo": updated_cart_data['activo'],
                    "items": items_formatted
                }
            }), 200 # 200 OK because it might be an update
        else:
            return jsonify({"message": "Error al añadir/actualizar libro en el carrito."}), 500
    except BadRequest:
        return jsonify({"message": "Datos JSON inválidos."}), 400
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado: {e}"}), 500


@app.route('/api/cart/items/<int:book_id>', methods=['PUT'])
#@login_required
def update_item_in_cart(book_id):
    """
    Actualiza la cantidad de un libro específico en el carrito del usuario.
    Si la cantidad es 0, el libro se elimina.
    """
    user_id = g.user_id
    data = request.get_json()
    new_quantity = data.get('quantity', type=int)

    if new_quantity is None or new_quantity < 0:
        return jsonify({"message": "Cantidad inválida. Debe ser un número entero no negativo."}), 400

    db = get_db()

    try:
        active_cart = get_active_cart_by_user(user_id)
        if not active_cart:
            return jsonify({"message": "No hay un carrito activo para este usuario."}), 404

        cart_id = active_cart['id_carrito']

        # Verificar stock si la cantidad es mayor a 0
        if new_quantity > 0:
            current_stock = get_book_stock_by_id(book_id)
            if current_stock is None:
                return jsonify({"message": "Error al verificar el stock del libro."}), 500
            
            if new_quantity > current_stock:
                return jsonify({"message": f"No hay suficiente stock disponible para la cantidad solicitada. Stock actual: {current_stock}"}), 400

        success = update_item_quantity_in_cart_details(cart_id, book_id, new_quantity)

        if success:
            updated_cart_data = get_active_cart_by_user(user_id)
            updated_cart_items = get_cart_details_by_cart_id(updated_cart_data['id_carrito'])
            
            items_formatted = []
            for item in updated_cart_items:
                items_formatted.append({
                    "book_id": item['id_libro'],
                    "title": item['titulo'],
                    "quantity": item['cantidad'],
                    "price_at_addition": float(item['precio_momento_adicion']),
                    "current_price": float(item['current_price']),
                    "image_url": item['portada_url']
                })
            
            return jsonify({
                "message": "Cantidad de libro actualizada en el carrito.",
                "cart": {
                    "id_carrito": updated_cart_data['id_carrito'],
                    "fecha_creacion": updated_cart_data['fecha_creacion'].isoformat(),
                    "fecha_ultima_actualizacion": updated_cart_data['fecha_ultima_actualizacion'].isoformat(),
                    "activo": updated_cart_data['activo'],
                    "items": items_formatted
                }
            }), 200
        else:
            return jsonify({"message": "Libro no encontrado en el carrito o cantidad no pudo ser actualizada."}), 404
    except BadRequest:
        return jsonify({"message": "Datos JSON inválidos."}), 400
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado: {e}"}), 500


@app.route('/api/cart/items/<int:book_id>', methods=['DELETE'])
#@login_required
def remove_item_from_cart(book_id):
    """
    Elimina un libro específico del carrito del usuario.
    """
    user_id = g.user_id
    db = get_db()
    
    try:
        active_cart = get_active_cart_by_user(user_id)
        if not active_cart:
            return jsonify({"message": "No hay un carrito activo para este usuario."}), 404
        
        cart_id = active_cart['id_carrito']
        
        success = remove_item_from_cart_details(cart_id, book_id)
        
        if success:
            # Obtener el carrito actualizado para la respuesta
            updated_cart_data = get_active_cart_by_user(user_id)
            updated_cart_items = get_cart_details_by_cart_id(updated_cart_data['id_carrito']) if updated_cart_data else []
            
            items_formatted = []
            for item in updated_cart_items:
                items_formatted.append({
                    "book_id": item['id_libro'],
                    "title": item['titulo'],
                    "quantity": item['cantidad'],
                    "price_at_addition": float(item['precio_momento_adicion']),
                    "current_price": float(item['current_price']),
                    "image_url": item['portada_url']
                })

            return jsonify({
                "message": "Libro eliminado del carrito.",
                "cart": {
                    "id_carrito": updated_cart_data['id_carrito'] if updated_cart_data else None,
                    "fecha_creacion": updated_cart_data['fecha_creacion'].isoformat() if updated_cart_data else None,
                    "fecha_ultima_actualizacion": updated_cart_data['fecha_ultima_actualizacion'].isoformat() if updated_cart_data else None,
                    "activo": updated_cart_data['activo'] if updated_cart_data else False,
                    "items": items_formatted
                }
            }), 200
        else:
            return jsonify({"message": "Libro no encontrado en el carrito."}), 404
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado: {e}"}), 500


@app.route('/api/cart', methods=['DELETE'])
#@login_required
def clear_user_cart():
    """
    Desactiva el carrito activo del usuario, esencialmente "vaciándolo"
    para futuras operaciones de compra (un nuevo carrito será creado).
    """
    user_id = g.user_id
    db = get_db()

    try:
        active_cart = get_active_cart_by_user(user_id)
        if not active_cart:
            return jsonify({"message": "No hay un carrito activo para este usuario."}), 200 # Nothing to clear

        cart_id = active_cart['id_carrito']
        
        success = deactivate_cart(cart_id)

        if success:
            return jsonify({"message": "Carrito vaciado exitosamente (desactivado)."}), 200
        else:
            return jsonify({"message": "No se pudo vaciar el carrito."}), 500
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"message": f"Error de base de datos: {err}"}), 500
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Error inesperado: {e}"}), 500


# --- Ruta protegida de ejemplo (requiere autenticación) ---

@app.route('/api/me', methods=['GET'])
def get_current_user():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({"message": "Token de autenticación requerido"}), 401

    token = token.split(' ')[1] # Remover 'Bearer '
    payload = verify_token(token)

    if 'code' in payload and payload['code'] == 401:
        return jsonify({"message": payload['message']}), 401

    # Aquí podrías obtener más datos del usuario desde la DB si fuera necesario,
    # pero para este ejemplo, los datos del token son suficientes.

    return jsonify({
        "message": "Datos de usuario autenticado",
        "user_id": payload['user_id'],
        "email": payload['email']
    }), 200

@app.route('/')
def home():
    return "¡Bienvenido a la API de tu E-commerce de Libros!"

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "La API de Flask está funcionando correctamente."})

if __name__ == '__main__':
    app.run(debug=True, port=5000) # Se ejecuta en el puerto 5000 por defecto