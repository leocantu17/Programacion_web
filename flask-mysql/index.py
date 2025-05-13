# Importación de las librerías necesarias
from flask import Flask, render_template, request
from flask_mysqldb import MySQL

# Creación de la instancia de la aplicación Flask
app = Flask(__name__)

# Configuración de los parámetros de conexión a la base de datos MySQL
app.config['MYSQL_HOST'] = 'localhost'  # Dirección del servidor de base de datos
app.config['MYSQL_USER'] = 'root'  # Nombre de usuario de la base de datos
app.config['MYSQL_PASSWORD'] = 'root'  # Contraseña del usuario de la base de datos
app.config['MYSQL_DB'] = 'flask'  # Nombre de la base de datos a utilizar

# Creación de la instancia de MySQL asociada a la aplicación Flask
mysql = MySQL(app)

# Ruta para mostrar el formulario HTML
@app.route('/form')
def form():
    # Renderiza la plantilla HTML 'form.html' cuando el usuario accede a '/form'
    return render_template('form.html')

# Ruta para manejar el login y la inserción de datos en la base de datos
@app.route('/login', methods = ['POST', 'GET'])
def login():
    # Si el método de la solicitud es GET, se muestra un mensaje informando que se debe usar el formulario
    if request.method == 'GET':
        return "Login via the login Form"

    # Si el método de la solicitud es POST, se procesan los datos enviados desde el formulario
    if request.method == 'POST':
        # Obtención de los valores enviados en el formulario (nombre y edad)
        name = request.form['name']
        age = request.form['age']
        
        # Creación de un cursor para ejecutar consultas SQL
        cursor = mysql.connection.cursor()
        
        # Inserción de los valores obtenidos del formulario en la tabla 'info_table'
        cursor.execute(''' INSERT INTO info_table VALUES(%s,%s)''', (name, age))
        
        # Commit para confirmar los cambios en la base de datos
        mysql.connection.commit()
        
        # Cierre del cursor para liberar recursos
        cursor.close()
        
        # Mensaje de confirmación que indica que la inserción fue exitosa
        return f"Done!!"

# Ejecuta la aplicación en el servidor local en el puerto 5000
app.run(host='localhost', port=5000)
