from flask import Flask, request, jsonify, send_from_directory
from flask_mysqldb import MySQL
from flask_cors import CORS
import MySQLdb.cursors
import os

app = Flask(__name__)
CORS(app)

# MySQL configurations (use environment variables in production)
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'Hari@2006')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'lab_management')

mysql = MySQL(app)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('.', path)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    keys = ['name', 'username', 'password', 'roll', 'gender', 'dob', 'course', 'graduationYear']
    values = [data[key] for key in keys]

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('INSERT INTO users (name, username, password, roll, gender, dob, course, graduation_year) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', values)
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Registration successful!'}), 201

@app.route('/login', methods=['POST'])
def login():
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

@app.route('/component-request', methods=['POST'])
def component_request():
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

@app.route('/component-requests', methods=['GET'])
def get_component_requests():
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT id, username, component_name, quantity FROM component_requests')
    requests = cursor.fetchall()
    cursor.close()
    return jsonify(requests)

@app.route('/available-components', methods=['GET'])
def get_available_components():
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT component_name, category, quantity_available FROM available_components')
    components = cursor.fetchall()
    cursor.close()
    return jsonify(components)

@app.route('/slot-booking', methods=['POST'])
def slot_booking():
    data = request.get_json()
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('INSERT INTO slot_bookings (username, from_date, from_time, to_date, to_time) VALUES (%s, %s, %s, %s, %s)', 
                   (data['username'], data['fromDate'], data['fromTime'], data['toDate'], data['toTime']))
    mysql.connection.commit()
    cursor.close()
    return jsonify({'message': 'Slot booking submitted successfully!'}), 201

@app.route('/get-components', methods=['GET'])
def get_components():
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT component_name FROM available_components')
    components = cursor.fetchall()
    cursor.close()
    return jsonify(components)

@app.route('/approve-request/<int:request_id>', methods=['POST'])
def approve_request(request_id):
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

@app.route('/decline-request/<int:request_id>', methods=['DELETE'])
def decline_request(request_id):
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('DELETE FROM component_requests WHERE id = %s', (request_id,))
    mysql.connection.commit()
    cursor.close()
    return jsonify({'message': 'Request declined successfully!'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)