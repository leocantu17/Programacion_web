# backend/db.py
import mysql.connector
from flask import current_app, g
from datetime import datetime

def get_db():
    """
    Establece una conexión a la base de datos si no existe y la almacena en 'g'.
    """
    if 'db' not in g:
        g.db = mysql.connector.connect(
            host=current_app.config['MYSQL_HOST'],
            user=current_app.config['MYSQL_USER'],
            password=current_app.config['MYSQL_PASSWORD'],
            database=current_app.config['MYSQL_DB']
        )
    return g.db

def close_db(e=None):
    """
    Cierra la conexión a la base de datos si existe.
    """
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_app(app):
    """
    Registra las funciones de cierre de DB con la aplicación Flask.
    """
    app.teardown_appcontext(close_db)


# --- Funciones de Base de Datos para el Carrito ---

def get_active_cart_by_user(user_id):
    """
    Obtiene el carrito activo (activo = TRUE) más reciente de un usuario.
    Retorna los datos del carrito o None si no hay uno activo.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT id_carrito, id_usuario, fecha_creacion, fecha_ultima_actualizacion, activo
            FROM carrito
            WHERE id_usuario = %s AND activo = TRUE
            ORDER BY fecha_creacion DESC
            LIMIT 1
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()

def create_cart(user_id):
    """
    Crea un nuevo carrito para un usuario y lo marca como activo.
    Antes de crear un nuevo carrito, desactiva cualquier carrito existente para ese usuario.
    Retorna el id_carrito del carrito recién creado o None en caso de error.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        # Primero, desactiva cualquier carrito existente para este usuario
        # Esto asegura que solo haya un carrito "activo" por usuario
        deactivate_query = "UPDATE carrito SET activo = FALSE WHERE id_usuario = %s AND activo = TRUE"
        cursor.execute(deactivate_query, (user_id,))
        
        insert_query = """
            INSERT INTO carrito (id_usuario)
            VALUES (%s)
        """
        cursor.execute(insert_query, (user_id,))
        db.commit()
        return cursor.lastrowid
    except mysql.connector.Error as err:
        db.rollback()
        current_app.logger.error(f"Error al crear carrito para el usuario {user_id}: {err}")
        return None
    finally:
        cursor.close()

def deactivate_cart(cart_id):
    """
    Desactiva un carrito específico (setea activo = FALSE).
    Retorna True si la operación fue exitosa, False en caso contrario.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        query = "UPDATE carrito SET activo = FALSE WHERE id_carrito = %s"
        cursor.execute(query, (cart_id,))
        db.commit()
        return cursor.rowcount > 0
    except mysql.connector.Error as err:
        db.rollback()
        current_app.logger.error(f"Error al desactivar carrito {cart_id}: {err}")
        return False
    finally:
        cursor.close()

def get_book_price(book_id):
    """
    Obtiene el precio actual de un libro.
    Retorna el precio o None si el libro no existe o no está activo.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT precio FROM libros WHERE id_libro = %s AND activo = 1"
        cursor.execute(query, (book_id,))
        result = cursor.fetchone()
        return float(result['precio']) if result else None
    finally:
        cursor.close()

def get_book_stock_by_id(book_id):
    """
    Obtiene el stock actual de un libro.
    Retorna el stock o None si el libro no existe o no está activo.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = "SELECT stock FROM libros WHERE id_libro = %s AND activo = 1"
        cursor.execute(query, (book_id,))
        result = cursor.fetchone()
        return result['stock'] if result else None
    finally:
        cursor.close()

def add_or_update_item_in_cart_details(cart_id, book_id, quantity, price_at_addition):
    """
    Añade un libro a los detalles del carrito o actualiza su cantidad.
    Si el libro ya está en el carrito, incrementa la cantidad.
    Retorna True si la operación fue exitosa, False en caso contrario.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        # Verificar si el libro ya está en el carrito
        check_query = "SELECT cantidad FROM carrito_detalles WHERE id_carrito = %s AND id_libro = %s"
        cursor.execute(check_query, (cart_id, book_id))
        existing_item = cursor.fetchone()

        if existing_item:
            # Si el libro ya existe, actualizar la cantidad
            new_total_quantity = existing_item[0] + quantity
            update_query = """
                UPDATE carrito_detalles
                SET cantidad = %s
                WHERE id_carrito = %s AND id_libro = %s
            """
            cursor.execute(update_query, (new_total_quantity, cart_id, book_id))
        else:
            # Si el libro no existe, insertarlo
            insert_query = """
                INSERT INTO carrito_detalles (id_carrito, id_libro, cantidad, precio_momento_adicion)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_query, (cart_id, book_id, quantity, price_at_addition))
        
        db.commit()
        return True
    except mysql.connector.Error as err:
        db.rollback()
        current_app.logger.error(f"Error al añadir/actualizar ítem en carrito {cart_id}: {err}")
        return False
    finally:
        cursor.close()

def update_item_quantity_in_cart_details(cart_id, book_id, new_quantity):
    """
    Actualiza la cantidad de un libro específico en los detalles del carrito.
    Si new_quantity es 0, el ítem se elimina.
    Retorna True si la operación fue exitosa, False en caso contrario (ej. ítem no encontrado).
    """
    db = get_db()
    cursor = db.cursor()
    try:
        if new_quantity == 0:
            return remove_item_from_cart_details(cart_id, book_id)
        
        update_query = """
            UPDATE carrito_detalles
            SET cantidad = %s
            WHERE id_carrito = %s AND id_libro = %s
        """
        cursor.execute(update_query, (new_quantity, cart_id, book_id))
        db.commit()
        return cursor.rowcount > 0
    except mysql.connector.Error as err:
        db.rollback()
        current_app.logger.error(f"Error al actualizar cantidad en carrito {cart_id}: {err}")
        return False
    finally:
        cursor.close()

def remove_item_from_cart_details(cart_id, book_id):
    """
    Elimina un libro de los detalles del carrito.
    Retorna True si la operación fue exitosa, False en caso contrario.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        delete_query = "DELETE FROM carrito_detalles WHERE id_carrito = %s AND id_libro = %s"
        cursor.execute(delete_query, (cart_id, book_id))
        db.commit()
        return cursor.rowcount > 0
    except mysql.connector.Error as err:
        db.rollback()
        current_app.logger.error(f"Error al eliminar ítem de carrito {cart_id}: {err}")
        return False
    finally:
        cursor.close()

def get_cart_details_by_cart_id(cart_id):
    """
    Obtiene todos los ítems de un carrito específico con detalles del libro.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
            SELECT
                cd.id_libro,
                l.titulo,
                l.portada_url,
                cd.cantidad,
                cd.precio_momento_adicion,
                l.precio AS current_price -- Incluir el precio actual del libro
            FROM carrito_detalles cd
            JOIN libros l ON cd.id_libro = l.id_libro
            WHERE cd.id_carrito = %s
        """
        cursor.execute(query, (cart_id,))
        return cursor.fetchall()
    finally:
        cursor.close()