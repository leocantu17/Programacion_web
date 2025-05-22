# Importación de los módulos necesarios de Flask y MySQL
from flask import Flask, render_template, request, redirect, url_for
import mysql.connector

# Se crea la instancia de la aplicación Flask
app = Flask(__name__)

# Configuración de la conexión a la base de datos MySQL
db_config = {
    'host': '172.16.186.174',        # Dirección IP del servidor MySQL
    'port': 3306,                    # Puerto de conexión
    'user': 'LEO',                   # Usuario de la base de datos
    'password': 'Leonardo123*',      # Contraseña del usuario
    'database': 'prueba',            # Nombre de la base de datos
}

# Función auxiliar para obtener una conexión activa a la base de datos
def get_db_connection():
    conn = mysql.connector.connect(**db_config)
    return conn

# Ruta principal: muestra el formulario y la tabla con los usuarios registrados
@app.route('/')
def index():
    conn = get_db_connection()  # Abre la conexión
    cursor = conn.cursor(dictionary=True)  # Cursor con resultados como diccionarios
    cursor.execute('SELECT nombre, email FROM usuarios where ACTIVO=1')  # Consulta los usuarios
    usuarios = cursor.fetchall()  # Obtiene todos los resultados
    cursor.close()
    conn.close()
    # Renderiza el template form.html y pasa la lista de usuarios
    return render_template('form.html', usuarios=usuarios)

# Ruta para manejar el envío del formulario de registro
@app.route('/submit', methods=['POST'])
def submit():
    nombre = request.form['nombre']  # Captura el nombre del formulario
    email = request.form['email']    # Captura el email del formulario

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO usuarios (nombre, email) VALUES (%s, %s)', (nombre, email))  # Inserta los datos
    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('index'))  # Redirecciona a la página principal

# Ruta para eliminar un usuario según su email
@app.route('/delete/<email>')
def delete(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET ACTIVO=0 WHERE email = %s', (email,))  # Elimina el usuario
    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('index'))

# Ruta para cargar la página de edición con los datos del usuario
@app.route('/edit/<email>')
def edit(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT nombre, email FROM usuarios WHERE email = %s', (email,))  # Busca al usuario
    usuario = cursor.fetchone()  # Obtiene el primer resultado

    cursor.close()
    conn.close()

    return render_template('edit.html', usuario=usuario)  # Renderiza el formulario de edición

# Ruta para guardar los cambios tras editar al usuario
@app.route('/update', methods=['POST'])
def update():
    nombre = request.form['nombre']
    nuevo_email = request.form['email']
    viejo_email = request.form['viejo_email']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET nombre = %s, email = %s WHERE email = %s',
                   (nombre, nuevo_email, viejo_email))  # Actualiza los datos
    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('index'))

# Punto de entrada para ejecutar la app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Ejecuta el servidor accesible desde cualquier IP local
