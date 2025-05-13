# Importa las bibliotecas necesarias para Flask y MySQL
from flask import Flask, render_template, request, redirect, url_for
from flask_mysqldb import MySQL

# Crea una instancia de la aplicación Flask
app = Flask(__name__)

# Configura la conexión a la base de datos MySQL
app.config['MYSQL_HOST'] = 'localhost'  # Dirección del servidor de la base de datos
app.config['MYSQL_USER'] = 'root'       # Usuario de la base de datos
app.config['MYSQL_PASSWORD'] = 'root'   # Contraseña de la base de datos
app.config['MYSQL_DB'] = 'sistema'     # Nombre de la base de datos

# Inicializa la conexión a MySQL con Flask
mysql = MySQL(app)

# Ruta principal para mostrar el formulario de agregar empleado
@app.route('/')
def index():
    # Renderiza el archivo HTML para la página de inicio
    return render_template('empleados/index.html')

# Ruta para manejar el envío del formulario y agregar un empleado
@app.route('/agregar_empleado', methods=['POST'])
def agregar_empleado():
    if request.method == 'POST':
        # Obtiene los datos del formulario
        nombre = request.form['nombre']
        correo = request.form['correo']

        # Crea un cursor para ejecutar las consultas SQL
        cur = mysql.connection.cursor()

        # Asume una foto predeterminada si no se sube una
        foto_filename = 'default.jpg'

        # Consulta SQL para insertar los datos del nuevo empleado en la base de datos
        sql = "INSERT INTO `empleados` (`nombre`, `correo`, `foto`) VALUES (%s, %s, %s)"
        cur.execute(sql, (nombre, correo, foto_filename))  # Ejecuta la consulta

        # Confirma la transacción
        mysql.connection.commit()

        # Cierra el cursor de la base de datos
        cur.close()

        # Redirige al usuario a la página principal después de agregar el empleado
        return redirect(url_for('index'))

# Ejecuta la aplicación de Flask en modo de depuración
if __name__ == '__main__':
    app.run(debug=True)
