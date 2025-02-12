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
        cursor.execute('INSERT INTO component_requests (username, component_name, quantity) VALUES (%s, %s, %s)', 
                       (username, component['componentName'], component['quantity']))
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

if __name__ == '__main__':
    app.run(port=5000, debug=True)