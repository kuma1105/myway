const mysql = require('mysql');
const dbConfig = require('../config/database');

const connection = mysql.createConnection(dbConfig);

const connectToDatabase = () => {
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return;
        }
        console.log('Connected to the MySQL database.');
    });
};

module.exports = {
    connectToDatabase,
};