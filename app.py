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
    name = data['name']
    username = data['username']
    password = data['password']
    roll = data['roll']
    gender = data['gender']
    dob = data['dob']
    course = data['course']
    graduation_year = data['graduationYear']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('INSERT INTO users (name, username, password, roll, gender, dob, course, graduation_year) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', 
                   (name, username, password, roll, gender, dob, course, graduation_year))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Registration successful!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM users WHERE username = %s AND password = %s', (username, password))
    user = cursor.fetchone()
    cursor.close()

    if user:
        return jsonify(user), 200
    else:
        return jsonify({'message': 'Invalid username or password.'}), 400

@app.route('/component-request', methods=['POST'])
def component_request():
    data = request.get_json()
    username = data['username']
    components = data['components']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    for component in components:
        component_name = component['componentName']
        quantity_requested = component['quantity']

        # Check available quantity
        cursor.execute('SELECT quantity_available FROM available_components WHERE component_name = %s', (component_name,))
        result = cursor.fetchone()
        
        if result and result['quantity_available'] >= quantity_requested:
            # Decrease quantity in available_components table
            cursor.execute('UPDATE available_components SET quantity_available = quantity_available - %s WHERE component_name = %s', 
                           (quantity_requested, component_name))
            # Insert into component_requests table
            cursor.execute('INSERT INTO component_requests (username, component_name, quantity) VALUES (%s, %s, %s)', 
                           (username, component_name, quantity_requested))
        else:
            cursor.close()
            return jsonify({'message': f'Not enough {component_name} available.'}), 400

    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Component request submitted successfully!'}), 201

@app.route('/slot-booking', methods=['POST'])
def slot_booking():
    data = request.get_json()
    username = data['username']
    from_date = data['fromDate']
    from_time = data['fromTime']
    to_date = data['toDate']
    to_time = data['toTime']

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('INSERT INTO slot_bookings (username, from_date, from_time, to_date, to_time) VALUES (%s, %s, %s, %s, %s)', 
                   (username, from_date, from_time, to_date, to_time))
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