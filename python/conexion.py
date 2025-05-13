from flask import Flask, render_template, request, redirect, url_for
import mysql.connector

app = Flask(__name__)

db_config = {
    'host': '172.16.186.174',
    'port': 3306,
    'user': 'LEO',
    'password': 'Leonardo123*',
    'database': 'prueba',
}

def get_db_connection():
    conn = mysql.connector.connect(**db_config)
    return conn

@app.route('/')
def index():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT nombre, email FROM usuarios')
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('form.html', usuarios=usuarios)

@app.route('/submit', methods=['POST'])
def submit():
    nombre = request.form['nombre']
    email = request.form['email']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO usuarios (nombre, email) VALUES (%s, %s)', (nombre, email))
    conn.commit()
    cursor.close()
    conn.close()
    return redirect(url_for('index'))

# Eliminar usuario
@app.route('/delete/<email>')
def delete(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM usuarios WHERE email = %s', (email,))
    conn.commit()
    cursor.close()
    conn.close()
    return redirect(url_for('index'))

@app.route('/edit/<email>')
def edit(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Ejecuta la consulta
    cursor.execute('SELECT nombre, email FROM usuarios WHERE email = %s', (email,))
    
    # Asegúrate de consumir el resultado antes de cerrar el cursor
    usuario = cursor.fetchone()
    
    cursor.close()  # Ahora sí es seguro cerrarlo
    conn.close()
    
    return render_template('edit.html', usuario=usuario)


# Guardar cambios de edición
@app.route('/update', methods=['POST'])
def update():
    nombre = request.form['nombre']
    nuevo_email = request.form['email']
    viejo_email = request.form['viejo_email']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET nombre = %s, email = %s WHERE email = %s', (nombre, nuevo_email, viejo_email))
    conn.commit()
    cursor.close()
    conn.close()
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
