import mysql.connector
# Importa el módulo mysql.connector para conectar con bases de datos MySQL

def get_connection():
    # Define una función que crea y devuelve una conexión a la base de datos MySQL

    return mysql.connector.connect(
        host="localhost",     # Dirección del servidor de la base de datos (aquí es local)
        user="root",          # Usuario para autenticar la conexión (root)
        password="root",      # Contraseña del usuario root
        database="e_learning" # Nombre de la base de datos a la que se conecta
    )
