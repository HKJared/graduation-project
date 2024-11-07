const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_DATABASE || 'wiseowl',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
});

module.exports = pool;
