require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: 3306, 
  dialect: 'mysql'
});

module.exports = sequelize;
