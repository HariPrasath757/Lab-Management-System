from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS
import MySQLdb.cursors

app = Flask(__name__)
CORS(app)

# MySQL configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Hari@2006'
app.config['MYSQL_DB'] = 'lab_management'

mysql = MySQL(app)

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
        cursor.execute('SELECT quantity_available FROM available_components WHERE component_name = %s', (component['componentName'],))
        result = cursor.fetchone()
        if result and int(result['quantity_available']) >= int(component['quantity']):
            cursor.execute('UPDATE available_components SET quantity_available = quantity_available - %s WHERE component_name = %s', 
                           (int(component['quantity']), component['componentName']))
            cursor.execute('INSERT INTO component_requests (username, component_name, quantity) VALUES (%s, %s, %s)', 
                           (username, component['componentName'], int(component['quantity'])))
        else:
            cursor.close()
            return jsonify({'message': f'Not enough {component["componentName"]} available.'}), 400

    mysql.connection.commit()
    cursor.close()
    return jsonify({'message': 'Component request submitted successfully!'}), 201

@app.route('/component-requests', methods=['GET'])
def get_component_requests():
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT username, component_name, quantity FROM component_requests')
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

if __name__ == '__main__':
    app.run(port=5000, debug=True)