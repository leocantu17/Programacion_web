# Importaciones necesarias para el funcionamiento de la aplicación
import random  # Para generar códigos de verificación aleatorios
import smtplib  # Para envío de correos electrónicos
from datetime import datetime  # Para manejar fechas y horas
import os  # Para operaciones del sistema operativo (archivos, directorios)
import json  # Para manejar datos en formato JSON
import re  # Para expresiones regulares (validación de email)
from email.mime.text import MIMEText  # Para crear emails de texto plano
from email.mime.multipart import MIMEMultipart  # Para emails con múltiples partes
from email.mime.base import MIMEBase  # Para adjuntos de email
from email import encoders  # Para codificar adjuntos de email
from flask import Flask, request, jsonify, make_response, send_from_directory  # Framework web Flask
from flask_cors import CORS  # Para habilitar CORS (Cross-Origin Resource Sharing)
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity  # Para autenticación JWT
from werkzeug.security import generate_password_hash, check_password_hash  # Para hash de contraseñas
from db import get_connection  # Módulo personalizado para conexión a base de datos
from dotenv import load_dotenv  # Para cargar variables de entorno desde archivo .env
from flask_jwt_extended import jwt_required  # Importación duplicada (se puede eliminar)
import pdfkit  # Para generar PDFs (no se usa en el código actual)
from flask import render_template  # Para renderizar plantillas HTML

# Cargar variables de entorno desde archivo .env
load_dotenv()

# Crear instancia de la aplicación Flask
app = Flask(__name__)

# Configurar clave secreta para JWT desde variable de entorno o valor por defecto
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")

# Configurar credenciales SMTP para envío de emails
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")

# Configurar CORS para permitir solicitudes desde el frontend React
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Configurar JWT para usar cookies en lugar de headers
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  # Ubicación del token JWT
app.config["JWT_COOKIE_SECURE"] = False  # False para desarrollo, True para producción con HTTPS
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"  # Nombre de la cookie JWT
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Protección CSRF desactivada

# Inicializar el gestor JWT
jwt = JWTManager(app)

def slugify(text):
    """Función para convertir texto a formato slug (URL amigable)"""
    text = text.lower()  # Convertir a minúsculas
    text = re.sub(r'\s+', '_', text)  # Reemplazar espacios con guiones bajos
    text = re.sub(r'[^\w\-]', '', text)  # Eliminar caracteres especiales
    return text  # Retornar texto slugificado

@app.route('/courses', methods=['GET'])
def get_courses():
    """Endpoint para obtener todos los cursos disponibles"""
    try:
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)  # Crear cursor que retorna diccionarios
        cursor.execute("SELECT * FROM courses")  # Ejecutar consulta SQL
        courses = cursor.fetchall()  # Obtener todos los resultados
        conn.close()  # Cerrar conexión
        return jsonify(courses)  # Retornar cursos en formato JSON
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error al obtener cursos", "error": str(e)}), 500

@app.route('/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Endpoint para obtener un curso específico por ID"""
    try:
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)  # Crear cursor que retorna diccionarios
        cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))  # Consulta con parámetro
        course = cursor.fetchone()  # Obtener un resultado
        conn.close()  # Cerrar conexión

        if not course:  # Si no se encuentra el curso
            return jsonify({"message": "Curso no encontrado"}), 404

        # Generar nombre de archivo basado en el título del curso
        filename = f"{slugify(course['title'])}.json"
        filepath = os.path.join('course_contents', filename)  # Crear ruta completa

        # Verificar si existe archivo de contenido del curso
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:  # Abrir archivo
                course['content'] = json.load(f)  # Cargar contenido JSON
        else:
            course['content'] = {}  # Contenido vacío si no existe archivo

        return jsonify(course)  # Retornar curso con contenido
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error al obtener curso", "error": str(e)}), 500

def send_verification_email(to_email, code):
    """Función para enviar email de verificación"""
    try:
        # Crear mensaje de texto con el código de verificación
        msg = MIMEText(f"Tu código de verificación es: {code}")
        msg['Subject'] = "Código de verificación - Plataforma E-learning"  # Asunto
        msg['From'] = SMTP_EMAIL  # Remitente
        msg['To'] = to_email  # Destinatario

        # Configurar servidor SMTP de Gmail
        smtp_server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        smtp_server.login(SMTP_EMAIL, SMTP_PASSWORD)  # Autenticarse
        smtp_server.send_message(msg)  # Enviar mensaje
        smtp_server.quit()  # Cerrar conexión SMTP
        return True  # Éxito
    except Exception as e:
        print(f"Error enviando email: {e}")  # Log del error
        return False  # Fallo

def send_certificate_email(to_email, name, course_title, certificate_html_path):
    """Función para enviar certificado por email como archivo adjunto"""
    try:
        # Crear mensaje multipart para adjuntos
        msg = MIMEMultipart()
        msg['Subject'] = f"¡Felicidades! Certificado del curso: {course_title}"
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email

        # Cuerpo del mensaje de felicitación
        body = f"""
        ¡Felicidades {name}!

        Has completado exitosamente el curso "{course_title}".
        
        Adjunto encontrarás tu certificado de finalización en formato HTML.
        
        ¡Sigue aprendiendo!
        
        Saludos,
        Equipo de E-learning
        """
        
        # Adjuntar cuerpo del mensaje
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        # Verificar si existe el archivo del certificado
        if os.path.exists(certificate_html_path):
            with open(certificate_html_path, 'rb') as attachment:  # Abrir en modo binario
                part = MIMEBase('application', 'octet-stream')  # Crear parte del adjunto
                part.set_payload(attachment.read())  # Establecer contenido
                
            encoders.encode_base64(part)  # Codificar en base64
            
            filename = os.path.basename(certificate_html_path)  # Obtener nombre de archivo
            # Establecer headers del adjunto
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {filename}'
            )
            
            msg.attach(part)  # Adjuntar al mensaje

        # Enviar email usando SMTP
        smtp_server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        smtp_server.login(SMTP_EMAIL, SMTP_PASSWORD)
        smtp_server.send_message(msg)
        smtp_server.quit()
        
        return True  # Éxito
        
    except Exception as e:
        print(f"Error enviando certificado por email: {e}")  # Log del error
        return False  # Fallo

def generate_certificate_html(name, course_title, course_id):
    """Función para generar un certificado en formato HTML"""
    try:
        # Crear directorio de certificados si no existe
        os.makedirs('certificates', exist_ok=True)

        # Generar nombre único para el archivo del certificado
        filename = f"certificado_{slugify(name)}_curso_{course_id}.html"
        filepath = os.path.join('certificates', filename)
        
        # Obtener fecha actual formateada
        current_date = datetime.now().strftime('%d de %B de %Y')
        
        # Template HTML completo del certificado con estilos CSS
        certificate_html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Finalización</title>
    <style>
        /* Estilos CSS para el certificado */
        body {{
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .certificate {{
            background: white;
            width: 800px;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            border: 8px solid #f8f9fa;
            position: relative;
        }}
        
        .certificate::before {{
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #667eea;
            border-radius: 15px;
        }}
        
        .header {{
            margin-bottom: 40px;
        }}
        
        .title {{
            font-size: 48px;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }}
        
        .subtitle {{
            font-size: 24px;
            color: #7f8c8d;
            margin-bottom: 40px;
        }}
        
        .recipient {{
            font-size: 32px;
            color: #667eea;
            margin: 30px 0;
            font-weight: bold;
        }}
        
        .course-name {{
            font-size: 28px;
            color: #2c3e50;
            margin: 30px 0;
            font-style: italic;
        }}
        
        .completion-text {{
            font-size: 20px;
            color: #34495e;
            line-height: 1.6;
            margin: 30px 0;
        }}
        
        .date {{
            font-size: 18px;
            color: #7f8c8d;
            margin-top: 40px;
        }}
        
        .signature-section {{
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
        }}
        
        .signature {{
            text-align: center;
        }}
        
        .signature-line {{
            width: 200px;
            height: 2px;
            background: #bdc3c7;
            margin: 20px auto 10px;
        }}
        
        .signature-title {{
            font-size: 14px;
            color: #7f8c8d;
        }}
        
        .decoration {{
            font-size: 60px;
            color: #f39c12;
            margin: 20px 0;
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            .certificate {{
                box-shadow: none;
                border: 2px solid #333;
            }}
        }}
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="decoration">🏆</div>
            <h1 class="title">CERTIFICADO</h1>
            <p class="subtitle">de Finalización</p>
        </div>
        
        <div class="content">
            <p class="completion-text">Por la presente se certifica que</p>
            
            <h2 class="recipient">{name}</h2>
            
            <p class="completion-text">ha completado satisfactoriamente el curso</p>
            
            <h3 class="course-name">"{course_title}"</h3>
            
            <p class="completion-text">
                demostrando dedicación, esfuerzo y conocimiento en la materia estudiada.
                Este certificado reconoce el logro académico y el compromiso con el aprendizaje continuo.
            </p>
            
            <p class="date">Expedido el {current_date}</p>
        </div>
        
        <div class="signature-section">
            <div class="signature">
                <div class="signature-line"></div>
                <p class="signature-title">Director Académico</p>
            </div>
            <div class="signature">
                <div class="signature-line"></div>
                <p class="signature-title">Plataforma E-learning</p>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        # Guardar el archivo HTML del certificado
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(certificate_html)
        
        return filepath  # Retornar ruta del archivo generado
        
    except Exception as e:
        print(f"Error generando certificado HTML: {e}")  # Log del error
        return None  # Retornar None en caso de error

@app.route('/register', methods=['POST'])
def register():
    """Endpoint para registrar nuevos usuarios"""
    try:
        data = request.get_json()  # Obtener datos JSON de la solicitud
        
        # Validar que todos los campos requeridos estén presentes
        if not all(k in data for k in ('name', 'email', 'password')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        # Validar formato de email usando expresión regular
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
            return jsonify({"message": "Email inválido"}), 400
        
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor()

        # Verificar si el email ya está registrado
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():  # Si ya existe
            conn.close()
            return jsonify({"message": "Correo ya registrado"}), 409

        # Generar código de verificación aleatorio de 4 dígitos
        code = str(random.randint(1000, 9999))
        
        # Encriptar la contraseña
        hashed_password = generate_password_hash(data['password'])

        # Insertar nuevo usuario en la base de datos
        cursor.execute(
            "INSERT INTO users (name, email, password, is_verified, verification_code) VALUES (%s, %s, %s, %s, %s)",
            (data['name'], data['email'], hashed_password, False, code)
        )
        conn.commit()  # Confirmar transacción
        conn.close()  # Cerrar conexión

        # Intentar enviar email de verificación
        if send_verification_email(data['email'], code):
            return jsonify({"message": "Registro exitoso. Revisa tu correo para verificar la cuenta."}), 201
        else:
            return jsonify({"message": "Registro exitoso, pero error enviando email"}), 201
            
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error en el registro", "error": str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    """Endpoint para verificar cuenta de usuario"""
    try:
        data = request.get_json()  # Obtener datos JSON
        
        # Validar campos requeridos
        if not all(k in data for k in ('email', 'code')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor()

        # Obtener código de verificación del usuario
        cursor.execute("SELECT verification_code FROM users WHERE email = %s", (data['email'],))
        result = cursor.fetchone()

        if not result:  # Si no se encuentra el usuario
            conn.close()
            return jsonify({"message": "Usuario no encontrado"}), 404

        # Verificar si el código coincide
        if data['code'] == result[0]:
            # Actualizar usuario como verificado
            cursor.execute("UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE email = %s", (data['email'],))
            conn.commit()
            conn.close()
            return jsonify({"message": "Cuenta verificada exitosamente"}), 200
        else:
            conn.close()
            return jsonify({"message": "Código incorrecto"}), 401
            
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error en la verificación", "error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    """Endpoint para iniciar sesión de usuario"""
    try:
        data = request.get_json()  # Obtener datos JSON
        
        # Validar campos requeridos
        if not all(k in data for k in ('email', 'password')):
            return jsonify({"message": "Email y contraseña requeridos"}), 400
        
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)

        # Buscar usuario por email
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cursor.fetchone()
        conn.close()

        # Verificar usuario y contraseña
        if user and check_password_hash(user['password'], data['password']):
            # Verificar si la cuenta está verificada
            if not user['is_verified']:
                return jsonify({"message": "Cuenta no verificada. Revisa tu correo."}), 403
            
            # Crear token de acceso JWT
            access_token = create_access_token(
                identity=str(user['id']),  # Convertir ID a string
                additional_claims={"email": user['email']}  # Claims adicionales
            )

            # Preparar datos del usuario (sin contraseña ni código de verificación)
            user_data = {k: v for k, v in user.items() if k not in ('password', 'verification_code')}

            # Crear respuesta con datos del usuario
            response = make_response(jsonify({
                "message": "Login exitoso", 
                "user": user_data
                # Token no se envía en el body, solo en cookie
            }))
            
            # Establecer cookie con el token JWT
            response.set_cookie(
                "access_token_cookie",  # Nombre de la cookie
                access_token,  # Valor del token
                httponly=True,  # Cookie solo accesible por HTTP (no JavaScript)
                secure=False,  # False para desarrollo, True para producción HTTPS
                samesite="Lax",  # Política de cookies
                max_age=60*60*2  # Expiración en 2 horas
            )
            return response
        else:
            return jsonify({"message": "Credenciales inválidas"}), 401
            
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error en el login", "error": str(e)}), 500

@app.route('/me', methods=['GET'])
@jwt_required()  # Decorador que requiere autenticación JWT
def me():
    """Endpoint para validar sesión usando cookie JWT"""
    user_id = get_jwt_identity()  # Obtener ID del usuario del token
    return jsonify({"message": "Usuario autenticado", "user_id": user_id})

@app.route('/progress/<int:course_id>', methods=['GET'])
@jwt_required()  # Requiere autenticación
def get_progress(course_id):
    """Endpoint para obtener progreso de un curso específico"""
    try:
        user_id = get_jwt_identity()  # Obtener ID del usuario del token
        
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)
        
        # Buscar progreso del usuario en el curso específico
        cursor.execute("""
            SELECT * FROM progress 
            WHERE user_id = %s AND course_id = %s
        """, (user_id, course_id))
        
        progress = cursor.fetchone()
        conn.close()
        
        if not progress:  # Si no existe progreso previo
            # Retornar valores por defecto
            return jsonify({
                "user_id": int(user_id),
                "course_id": course_id,
                "chapter_completed": 0,
                "percentage": 0
            }), 200
        
        return jsonify(progress), 200  # Retornar progreso existente
        
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error al obtener progreso", "error": str(e)}), 500

@app.route('/user/progress', methods=['GET'])
@jwt_required()  # Requiere autenticación
def get_user_progress():
    """Endpoint para obtener todo el progreso del usuario"""
    try:
        user_id = get_jwt_identity()  # Obtener ID del usuario
        
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)
        
        # Consulta JOIN para obtener progreso con información de cursos
        cursor.execute("""
            SELECT 
                p.course_id,
                p.chapter_completed,
                p.percentage,
                c.title as course_title,
                c.description as course_description
            FROM progress p
            JOIN courses c ON p.course_id = c.id
            WHERE p.user_id = %s
            ORDER BY p.percentage DESC
        """, (user_id,))
        
        progress_data = cursor.fetchall()  # Obtener todos los resultados
        conn.close()
        
        return jsonify(progress_data), 200
        
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error al obtener progreso del usuario", "error": str(e)}), 500

@app.route('/user/enrolled-courses', methods=['GET'])
@jwt_required()  # Requiere autenticación
def get_enrolled_courses():
    """Endpoint para obtener cursos inscritos del usuario"""
    try:
        user_id = get_jwt_identity()  # Obtener ID del usuario
        
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)
        
        # Consulta LEFT JOIN para obtener cursos con progreso (incluye cursos sin progreso)
        cursor.execute("""
            SELECT 
                c.id,
                c.title,
                c.description,
                COALESCE(p.percentage, 0) as progress,
                COALESCE(p.chapter_completed, 0) as chapters_completed
            FROM courses c
            LEFT JOIN progress p ON c.id = p.course_id AND p.user_id = %s
            WHERE p.user_id = %s OR p.user_id IS NULL
            ORDER BY COALESCE(p.percentage, 0) DESC
        """, (user_id, user_id))
        
        courses = cursor.fetchall()
        conn.close()
        
        return jsonify(courses), 200
        
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error al obtener cursos inscritos", "error": str(e)}), 500

@app.route('/progress/update', methods=['POST'])
@jwt_required()  # Requiere autenticación
def update_progress():
    """Endpoint para actualizar progreso del usuario en un curso"""
    try:
        data = request.get_json()  # Obtener datos JSON
        user_id = get_jwt_identity()  # Obtener ID del usuario
        
        # Validar campos requeridos
        if not all(k in data for k in ('course_id', 'chapter_completed', 'percentage')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        course_id = data['course_id']
        chapter = data['chapter_completed']
        percentage = min(100, max(0, data['percentage']))  # Validar rango 0-100

        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor()
        
        # Verificar que el curso existe
        cursor.execute("SELECT id FROM courses WHERE id = %s", (course_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"message": "Curso no encontrado"}), 404
        
        # Insertar o actualizar progreso usando ON DUPLICATE KEY UPDATE
        cursor.execute("""
            INSERT INTO progress (user_id, course_id, chapter_completed, percentage)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                chapter_completed = GREATEST(chapter_completed, %s), 
                percentage = GREATEST(percentage, %s)
        """, (user_id, course_id, chapter, percentage, chapter, percentage))
        
        conn.commit()  # Confirmar transacción
        conn.close()
        
        # Retornar confirmación con datos actualizados
        return jsonify({
            "message": "Progreso actualizado exitosamente",
            "user_id": user_id,
            "course_id": course_id,
            "chapter_completed": chapter,
            "percentage": percentage
        }), 200
        
    except Exception as e:
        # Manejo de errores
        return jsonify({"message": "Error actualizando progreso", "error": str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    """Endpoint para cerrar sesión del usuario"""
    # Crear respuesta de logout exitoso
    response = make_response(jsonify({"message": "Logout exitoso"}))
    # Eliminar cookie estableciendo expiración a 0
    response.set_cookie('access_token_cookie', '', expires=0)
    return response

@app.route('/session', methods=['GET'])
@jwt_required()  # Requiere autenticación
def check_session():
    """Endpoint para verificar si la sesión está activa"""
    user_id = get_jwt_identity()  # Obtener ID del usuario del token
    return jsonify({"message": "Sesión activa", "user_id": user_id}), 200

def get_user_course_progress(user_id, course_id):
    """Función auxiliar para obtener el porcentaje de progreso de un usuario en un curso"""
    try:
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor()
        # Consultar porcentaje de progreso
        cursor.execute(
            "SELECT percentage FROM progress WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        result = cursor.fetchone()
        conn.close()

        if result:
            return result[0]  # Retornar porcentaje
        else:
            return 0  # Retornar 0 si no hay progreso
    except Exception as e:
        print(f"Error obteniendo progreso: {e}")  # Log del error
        return 0

def get_user_by_id(user_id):
    """Función auxiliar para obtener datos del usuario por ID"""
    try:
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)
        # Consultar datos básicos del usuario
        cursor.execute(
            "SELECT id, name, email FROM users WHERE id = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        conn.close()
        return user
    except Exception as e:
        print(f"Error obteniendo usuario: {e}")  # Log del error
        return None

def get_course_by_id(course_id):
    """Función auxiliar para obtener datos del curso por ID"""
    try:
        conn = get_connection()  # Obtener conexión a base de datos
        cursor = conn.cursor(dictionary=True)
        # Consultar datos básicos del curso
        cursor.execute(
            "SELECT id, title, description FROM courses WHERE id = %s",
            (course_id,)
        )
        course = cursor.fetchone()
        conn.close()
        return course
    except Exception as e:
        print(f"Error obteniendo curso: {e}")  # Log del error
        return None

@app.route('/user/certificate/<int:course_id>', methods=['GET'])
@jwt_required()  # Requiere autenticación
def generate_certificate(course_id):
    """Endpoint para generar y enviar certificado de finalización"""
    try:
        user_id = get_jwt_identity()  # Obtener ID del usuario
        progress = get_user_course_progress(user_id, course_id)  # Obtener progreso del usuario

        # Verificar que el curso esté 100% completado
        if progress < 100:
            return jsonify({'error': 'Curso no completado. Debes tener 100% de progreso para obtener el certificado.'}), 403

        # Obtener datos del usuario
        user = get_user_by_id(user_id)
        if not user:  # Verificar que el usuario existe
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Obtener datos del curso
        course = get_course_by_id(course_id)
        if not course:  # Verificar que el curso existe
            return jsonify({'error': 'Curso no encontrado'}), 404

        # Generar certificado HTML
        certificate_path = generate_certificate_html(user['name'], course['title'], course_id)
        
        if not certificate_path:  # Verificar que se generó correctamente
            return jsonify({'error': 'Error generando certificado'}), 500

        # Enviar certificado por email
        email_sent = send_certificate_email(user['email'], user['name'], course['title'], certificate_path)
        
        if email_sent:  # Si el email se envió correctamente
            return jsonify({
                'message': 'Certificado generado y enviado exitosamente a tu correo electrónico',
                'certificate_url': f'/certificates/{os.path.basename(certificate_path)}',  # URL para descargar
                'ruta': f'{os.path.basename(certificate_path)}'  # Nombre del archivo
            }), 200
        else:  # Si hubo error enviando el email
            return jsonify({
                'message': 'Certificado generado pero hubo un error enviando el email',
                'certificate_url': f'/certificates/{os.path.basename(certificate_path)}',  # URL para descargar
                'ruta': f'{os.path.basename(certificate_path)}'  # Nombre del archivo
            }), 200

    except Exception as e:
        # Manejo de errores
        return jsonify({'error': f'Error procesando certificado: {str(e)}'}), 500

@app.route('/certificates/<path:filename>', methods=['GET'])
def serve_certificate(filename):
    """Endpoint para servir archivos de certificados"""
    # Servir archivo desde el directorio de certificados
    return send_from_directory('certificates', filename)

# Punto de entrada principal de la aplicación
if __name__ == '__main__':
    # Ejecutar la aplicación Flask en modo debug en el puerto 5000
    app.run(debug=True, port=5000)