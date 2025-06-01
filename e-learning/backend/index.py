import random
import smtplib
import os
import json
import re
from email.mime.text import MIMEText
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Usar variables de entorno para datos sensibles
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")

CORS(app)
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

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not all(k in data for k in ('name', 'email', 'password')):
            return jsonify({"message": "Datos incompletos"}), 400
        
        # Validar formato de email
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
            return jsonify({"message": "Email inválido"}), 400
        
        conn = get_connection()
        cursor = conn.cursor()

        # Verificar si el email ya existe
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({"message": "Correo ya registrado"}), 409

        # Generar código de 4 dígitos
        code = str(random.randint(1000, 9999))
        
        # Hash de la contraseña
        hashed_password = generate_password_hash(data['password'])

        cursor.execute(
            "INSERT INTO users (name, email, password, is_verified, verification_code) VALUES (%s, %s, %s, %s, %s)",
            (data['name'], data['email'], hashed_password, False, code)
        )
        conn.commit()
        conn.close()

        # Enviar email de verificación
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
        print(user['password'], data['password'])
        if user and check_password_hash(user['password'], data['password']):
            # Verificar si la cuenta está verificada
            if not user['is_verified']:
                return jsonify({"message": "Cuenta no verificada. Revisa tu correo."}), 403
            
            # Crear token JWT
            access_token = create_access_token(
                identity=user['id'],
                additional_claims={"email": user['email']}
            )

            # Remover datos sensibles
            user_data = {k: v for k, v in user.items() if k not in ('password', 'verification_code')}

            response = make_response(jsonify({
                "message": "Login exitoso", 
                "user": user_data,
                "access_token": access_token
            }))
            
            response.set_cookie(
                "access_token_cookie",
                access_token,
                httponly=True,
                secure=False,  # Cambiar a True en producción con HTTPS
                samesite="Lax",
                max_age=60*60*2  # 2 horas
            )
            return response
        else:
            return jsonify({"message": "Credenciales inválidas"}), 401
            
    except Exception as e:
        return jsonify({"message": "Error en el login", "error": str(e)}), 500

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
        percentage = data['percentage']

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO progress (user_id, course_id, chapter_completed, percentage)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE chapter_completed=%s, percentage=%s
        """, (user_id, course_id, chapter, percentage, chapter, percentage))
        conn.commit()
        conn.close()
        return jsonify({"message": "Progreso actualizado"}), 200
        
    except Exception as e:
        return jsonify({"message": "Error actualizando progreso", "error": str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    """Endpoint para logout"""
    response = make_response(jsonify({"message": "Logout exitoso"}))
    response.set_cookie('access_token_cookie', '', expires=0)
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)