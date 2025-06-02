import random
import smtplib
from datetime import datetime
import os
import json
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection
from dotenv import load_dotenv
from flask_jwt_extended import jwt_required
import pdfkit
from flask import render_template

load_dotenv()
app = Flask(__name__)

# Usar variables de entorno para datos sensibles
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")

# CORS configurado para permitir credenciales y sólo el frontend React
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])  # Modificado
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False  # True solo en producción con HTTPS
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # puedes activar esto si manejas CSRF tokens

jwt = JWTManager(app)

def slugify(text):
    """Convierte texto a slug"""
    text = text.lower()
    text = re.sub(r'\s+', '_', text)
    text = re.sub(r'[^\w\-]', '', text)
    return text

@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM courses")
        courses = cursor.fetchall()
        conn.close()
        return jsonify(courses)
    except Exception as e:
        return jsonify({"message": "Error al obtener cursos", "error": str(e)}), 500

@app.route('/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
        course = cursor.fetchone()
        conn.close()

        if not course:
            return jsonify({"message": "Curso no encontrado"}), 404

        filename = f"{slugify(course['title'])}.json"
        filepath = os.path.join('course_contents', filename)

        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                course['content'] = json.load(f)
        else:
            course['content'] = {}

        return jsonify(course)
    except Exception as e:
        return jsonify({"message": "Error al obtener curso", "error": str(e)}), 500

def send_verification_email(to_email, code):
    try:
        msg = MIMEText(f"Tu código de verificación es: {code}")
        msg['Subject'] = "Código de verificación - Plataforma E-learning"
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email

        smtp_server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        smtp_server.login(SMTP_EMAIL, SMTP_PASSWORD)
        smtp_server.send_message(msg)
        smtp_server.quit()
        return True
    except Exception as e:
        print(f"Error enviando email: {e}")
        return False

def send_certificate_email(to_email, name, course_title, certificate_html_path):
    """Envía el certificado por correo electrónico como archivo adjunto"""
    try:
        # Crear mensaje multipart
        msg = MIMEMultipart()
        msg['Subject'] = f"¡Felicidades! Certificado del curso: {course_title}"
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email

        # Cuerpo del mensaje
        body = f"""
        ¡Felicidades {name}!

        Has completado exitosamente el curso "{course_title}".
        
        Adjunto encontrarás tu certificado de finalización en formato HTML.
        
        ¡Sigue aprendiendo!
        
        Saludos,
        Equipo de E-learning
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        # Adjuntar el certificado HTML
        if os.path.exists(certificate_html_path):
            with open(certificate_html_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                
            encoders.encode_base64(part)
            
            filename = os.path.basename(certificate_html_path)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {filename}'
            )
            
            msg.attach(part)

        # Enviar email
        smtp_server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        smtp_server.login(SMTP_EMAIL, SMTP_PASSWORD)
        smtp_server.send_message(msg)
        smtp_server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error enviando certificado por email: {e}")
        return False

def generate_certificate_html(name, course_title, course_id):
    """Genera un certificado en formato HTML"""
    try:
        # Asegúrate de que exista la carpeta
        os.makedirs('certificates', exist_ok=True)

        filename = f"certificado_{slugify(name)}_curso_{course_id}.html"
        filepath = os.path.join('certificates', filename)
        
        current_date = datetime.now().strftime('%d de %B de %Y')
        
        # Template HTML del certificado
        certificate_html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Finalización</title>
    <style>
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
        
        # Guardar el archivo HTML
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(certificate_html)
        
        return filepath
        
    except Exception as e:
        print(f"Error generando certificado HTML: {e}")
        return None

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ('name', 'email', 'password')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
            return jsonify({"message": "Email inválido"}), 400
        
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({"message": "Correo ya registrado"}), 409

        code = str(random.randint(1000, 9999))
        
        hashed_password = generate_password_hash(data['password'])

        cursor.execute(
            "INSERT INTO users (name, email, password, is_verified, verification_code) VALUES (%s, %s, %s, %s, %s)",
            (data['name'], data['email'], hashed_password, False, code)
        )
        conn.commit()
        conn.close()

        if send_verification_email(data['email'], code):
            return jsonify({"message": "Registro exitoso. Revisa tu correo para verificar la cuenta."}), 201
        else:
            return jsonify({"message": "Registro exitoso, pero error enviando email"}), 201
            
    except Exception as e:
        return jsonify({"message": "Error en el registro", "error": str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ('email', 'code')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT verification_code FROM users WHERE email = %s", (data['email'],))
        result = cursor.fetchone()

        if not result:
            conn.close()
            return jsonify({"message": "Usuario no encontrado"}), 404

        if data['code'] == result[0]:
            cursor.execute("UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE email = %s", (data['email'],))
            conn.commit()
            conn.close()
            return jsonify({"message": "Cuenta verificada exitosamente"}), 200
        else:
            conn.close()
            return jsonify({"message": "Código incorrecto"}), 401
            
    except Exception as e:
        return jsonify({"message": "Error en la verificación", "error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ('email', 'password')):
            return jsonify({"message": "Email y contraseña requeridos"}), 400
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user['password'], data['password']):
            if not user['is_verified']:
                return jsonify({"message": "Cuenta no verificada. Revisa tu correo."}), 403
            
            access_token = create_access_token(
                identity=str(user['id']),  # ✅ Convertimos el ID a string
                additional_claims={"email": user['email']}
            )

            user_data = {k: v for k, v in user.items() if k not in ('password', 'verification_code')}

            response = make_response(jsonify({
                "message": "Login exitoso", 
                "user": user_data
                # No envías token en body para que solo esté en cookie
            }))
            
            response.set_cookie(
                "access_token_cookie",
                access_token,
                httponly=True,
                secure=False,  # Cambiar a True en producción con HTTPS
                samesite="Lax",
                max_age=60*60*2
            )
            return response
        else:
            return jsonify({"message": "Credenciales inválidas"}), 401
            
    except Exception as e:
        return jsonify({"message": "Error en el login", "error": str(e)}), 500

# Endpoint agregado para validar sesión usando cookie JWT
@app.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    return jsonify({"message": "Usuario autenticado", "user_id": user_id})

@app.route('/progress/<int:course_id>', methods=['GET'])
@jwt_required()
def get_progress(course_id):
    try:
        user_id = get_jwt_identity()
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM progress 
            WHERE user_id = %s AND course_id = %s
        """, (user_id, course_id))
        
        progress = cursor.fetchone()
        conn.close()
        
        if not progress:
            # Si no existe progreso, devolver valores por defecto
            return jsonify({
                "user_id": int(user_id),
                "course_id": course_id,
                "chapter_completed": 0,
                "percentage": 0
            }), 200
        
        return jsonify(progress), 200
        
    except Exception as e:
        return jsonify({"message": "Error al obtener progreso", "error": str(e)}), 500

@app.route('/user/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    try:
        user_id = get_jwt_identity()
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
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
        
        progress_data = cursor.fetchall()
        conn.close()
        
        return jsonify(progress_data), 200
        
    except Exception as e:
        return jsonify({"message": "Error al obtener progreso del usuario", "error": str(e)}), 500

@app.route('/user/enrolled-courses', methods=['GET'])
@jwt_required()
def get_enrolled_courses():
    try:
        user_id = get_jwt_identity()
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Obtener cursos con progreso
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
        return jsonify({"message": "Error al obtener cursos inscritos", "error": str(e)}), 500

# Actualizar el endpoint de progreso existente
@app.route('/progress/update', methods=['POST'])
@jwt_required()
def update_progress():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if not all(k in data for k in ('course_id', 'chapter_completed', 'percentage')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        course_id = data['course_id']
        chapter = data['chapter_completed']
        percentage = min(100, max(0, data['percentage']))  # Validar rango 0-100

        conn = get_connection()
        cursor = conn.cursor()
        
        # Verificar si el curso existe
        cursor.execute("SELECT id FROM courses WHERE id = %s", (course_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"message": "Curso no encontrado"}), 404
        
        # Insertar o actualizar progreso
        cursor.execute("""
            INSERT INTO progress (user_id, course_id, chapter_completed, percentage)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                chapter_completed = GREATEST(chapter_completed, %s), 
                percentage = GREATEST(percentage, %s)
        """, (user_id, course_id, chapter, percentage, chapter, percentage))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "Progreso actualizado exitosamente",
            "user_id": user_id,
            "course_id": course_id,
            "chapter_completed": chapter,
            "percentage": percentage
        }), 200
        
    except Exception as e:
        return jsonify({"message": "Error actualizando progreso", "error": str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({"message": "Logout exitoso"}))
    response.set_cookie('access_token_cookie', '', expires=0)
    return response

@app.route('/session', methods=['GET'])
@jwt_required()
def check_session():
    user_id = get_jwt_identity()
    return jsonify({"message": "Sesión activa", "user_id": user_id}), 200

def get_user_course_progress(user_id, course_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT percentage FROM progress WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        result = cursor.fetchone()
        conn.close()

        if result:
            return result[0]  # porcentaje
        else:
            return 0
    except Exception as e:
        print(f"Error obteniendo progreso: {e}")
        return 0

def get_user_by_id(user_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, email FROM users WHERE id = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        conn.close()
        return user
    except Exception as e:
        print(f"Error obteniendo usuario: {e}")
        return None

def get_course_by_id(course_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, title, description FROM courses WHERE id = %s",
            (course_id,)
        )
        course = cursor.fetchone()
        conn.close()
        return course
    except Exception as e:
        print(f"Error obteniendo curso: {e}")
        return None

@app.route('/user/certificate/<int:course_id>', methods=['GET'])
@jwt_required()
def generate_certificate(course_id):
    try:
        user_id = get_jwt_identity()
        progress = get_user_course_progress(user_id, course_id)

        if progress < 100:
            return jsonify({'error': 'Curso no completado. Debes tener 100% de progreso para obtener el certificado.'}), 403

        user = get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        course = get_course_by_id(course_id)
        if not course:
            return jsonify({'error': 'Curso no encontrado'}), 404

        # Generar certificado HTML
        certificate_path = generate_certificate_html(user['name'], course['title'], course_id)
        
        if not certificate_path:
            return jsonify({'error': 'Error generando certificado'}), 500

        # Enviar certificado por email
        email_sent = send_certificate_email(user['email'], user['name'], course['title'], certificate_path)
        
        if email_sent:
            return jsonify({
                'message': 'Certificado generado y enviado exitosamente a tu correo electrónico',
                'certificate_url': f'/certificates/{os.path.basename(certificate_path)}',
                'ruta':f'{os.path.basename(certificate_path)}'
            }), 200
        else:
            return jsonify({
                'message': 'Certificado generado pero hubo un error enviando el email',
                'certificate_url': f'/certificates/{os.path.basename(certificate_path)}',
                'ruta':f'{os.path.basename(certificate_path)}'
            }), 200

    except Exception as e:
        return jsonify({'error': f'Error procesando certificado: {str(e)}'}), 500

@app.route('/certificates/<path:filename>', methods=['GET'])
def serve_certificate(filename):
    return send_from_directory('certificates', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)