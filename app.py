from flask import Flask, request, jsonify, send_from_directory
from flask_mysqldb import MySQL
from flask_cors import CORS
import MySQLdb.cursors
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MySQL configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Hari@2006'  # Replace with your actual MySQL password
app.config['MYSQL_DB'] = 'lab_management'

mysql = MySQL(app)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('.', path)

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        keys = ['name', 'username', 'password', 'roll', 'gender', 'dob', 'course', 'graduationYear']
        values = [data[key] for key in keys]

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('INSERT INTO users (name, username, password, roll, gender, dob, course, graduation_year) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', values)
        mysql.connection.commit()
        cursor.close()

        return jsonify({'message': 'Registration successful!'}), 201
    except Exception as e:
        app.logger.error(f"Error occurred during registration: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        login_type = data['loginType']
        username = data['username']
        password = data['password']

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        if login_type == 'student':
            cursor.execute('SELECT * FROM users WHERE username = %s AND password = %s', (username, password))
            user = cursor.fetchone()
        elif login_type == 'lab_incharge' and username == 'amrita' and password == '1234':
            user = {'username': 'amrita', 'role': 'lab_incharge'}
        else:
            user = None

        cursor.close()

        if user:
            return jsonify(user), 200
        return jsonify({'message': 'Invalid username or password.'}), 400
    except Exception as e:
        app.logger.error(f"Error occurred during login: {e}")
        return jsonify({'message': 'An error occurred during login. Please try again.'}), 500

@app.route('/component-request', methods=['POST'])
def component_request():
    try:
        data = request.get_json()
        username = data['username']
        components = data['components']

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        for component in components:
            cursor.execute('INSERT INTO component_requests (username, component_name, quantity) VALUES (%s, %s, %s)', 
                           (username, component['componentName'], int(component['quantity'])))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Component request submitted successfully!'}), 201
    except Exception as e:
        app.logger.error(f"Error occurred during component request: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/component-requests', methods=['GET'])
def get_component_requests():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT id, username, component_name, quantity FROM component_requests')
        requests = cursor.fetchall()
        cursor.close()
        return jsonify(requests)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching component requests: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/available-components', methods=['GET'])
def get_available_components():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT component_name, category, quantity_available FROM available_components')
        components = cursor.fetchall()
        cursor.close()
        return jsonify(components)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching available components: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/slot-booking', methods=['POST'])
def slot_booking():
    try:
        data = request.get_json()
        required_fields = ['username', 'fromDate', 'fromTime', 'toDate', 'toTime', 'computerId']
        for field in required_fields:
            if field not in data:
                app.logger.error(f"Missing field: {field}")
                return jsonify({'message': f'Missing field: {field}'}), 400
        
        username = data['username']
        from_date = data['fromDate']
        from_time = data['fromTime']
        to_date = data['toDate']
        to_time = data['toTime']
        computer_id = data['computerId']
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('INSERT INTO slot_bookings (username, from_date, from_time, to_date, to_time, computer_id, status) VALUES (%s, %s, %s, %s, %s, %s, %s)', 
                       (username, from_date, from_time, to_date, to_time, computer_id, 'pending'))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Slot booking submitted successfully!'}), 201
    except MySQLdb.IntegrityError as e:
        app.logger.error(f"Integrity error occurred during slot booking: {e}")
        return jsonify({'message': 'Slot booking conflict or constraint violation.'}), 409
    except Exception as e:
        app.logger.error(f"Error occurred during slot booking: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/get-components', methods=['GET'])
def get_components():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT component_name FROM available_components')
        components = cursor.fetchall()
        cursor.close()
        return jsonify(components)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching components: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/approve-request/<int:request_id>', methods=['POST'])
def approve_request(request_id):
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT component_name, quantity FROM component_requests WHERE id = %s', (request_id,))
        request = cursor.fetchone()

        if not request:
            cursor.close()
            return jsonify({'message': 'Request not found'}), 404

        component_name = request['component_name']
        quantity = request['quantity']

        cursor.execute('SELECT quantity_available FROM available_components WHERE component_name = %s', (component_name,))
        result = cursor.fetchone()

        if not result or int(result['quantity_available']) < int(quantity):
            cursor.close()
            return jsonify({'message': f'Not enough {component_name} available.'}), 400

        cursor.execute('UPDATE available_components SET quantity_available = quantity_available - %s WHERE component_name = %s', 
                       (int(quantity), component_name))
        cursor.execute('DELETE FROM component_requests WHERE id = %s', (request_id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Request approved successfully!'}), 200
    except Exception as e:
        app.logger.error(f"Error occurred during request approval: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/decline-request/<int:request_id>', methods=['DELETE'])
def decline_request(request_id):
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('DELETE FROM component_requests WHERE id = %s', (request_id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Request declined successfully!'}), 200
    except Exception as e:
        app.logger.error(f"Error occurred during request declination: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/approve-booking/<int:booking_id>', methods=['POST'])
def approve_booking(booking_id):
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('UPDATE slot_bookings SET status = %s WHERE id = %s', ('approved', booking_id))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Booking approved successfully!'}), 200
    except Exception as e:
        app.logger.error(f"Error occurred during booking approval: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/decline-booking/<int:booking_id>', methods=['POST'])
def decline_booking(booking_id):
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('UPDATE slot_bookings SET status = %s WHERE id = %s', ('declined', booking_id))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Booking declined successfully!'}), 200
    except Exception as e:
        app.logger.error(f"Error occurred during booking declination: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/view-bookings', methods=['GET'])
def view_bookings():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM slot_bookings WHERE status = %s', ('pending',))
        bookings = cursor.fetchall()
        cursor.close()
        
        # Serialize datetime and timedelta objects to strings
        for booking in bookings:
            if isinstance(booking['from_date'], datetime):
                booking['from_date'] = booking['from_date'].strftime('%Y-%m-%d')
            if isinstance(booking['to_date'], datetime):
                booking['to_date'] = booking['to_date'].strftime('%Y-%m-%d')
            if isinstance(booking['from_time'], (datetime, timedelta)):
                booking['from_time'] = str(booking['from_time'])
            if isinstance(booking['to_time'], (datetime, timedelta)):
                booking['to_time'] = str(booking['to_time'])
        
        return jsonify(bookings)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching bookings: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/view-approved-bookings', methods=['GET'])
def view_approved_bookings():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM slot_bookings WHERE status = %s', ('approved',))
        bookings = cursor.fetchall()
        cursor.close()
        
        # Serialize datetime and timedelta objects to strings
        for booking in bookings:
            if isinstance(booking['from_date'], datetime):
                booking['from_date'] = booking['from_date'].strftime('%Y-%m-%d')
            if isinstance(booking['to_date'], datetime):
                booking['to_date'] = booking['to_date'].strftime('%Y-%m-%d')
            if isinstance(booking['from_time'], (datetime, timedelta)):
                booking['from_time'] = str(booking['from_time'])
            if isinstance(booking['to_time'], (datetime, timedelta)):
                booking['to_time'] = str(booking['to_time'])
        
        return jsonify(bookings)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching approved bookings: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/view-available-slots', methods=['GET'])
def view_available_slots():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM slot_bookings WHERE status = %s', ('available',))
        slots = cursor.fetchall()
        cursor.close()
        return jsonify(slots)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching available slots: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.route('/computers', methods=['GET'])
def get_computers():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT id, computer_index FROM computers')
        computers = cursor.fetchall()
        cursor.close()
        return jsonify(computers)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching computers: {e}")
        return jsonify({'message': 'An error occurred. Please try again.'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)