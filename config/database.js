// require sequelize - an ORM tool for nodejs and SQL Databases
const Sequelize = require('sequelize');

// require .env configuration properties
require('dotenv').config();

// connect to db - disable logging
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    logging: false
});

// create User Model as User
const UserModel = require('../models/UserModel');
const User = UserModel(sequelize, Sequelize);

// this creates models if they don't already exist in our database
// it doesn't drop or alter existing tables
sequelize.sync()
    .then(() => {
        console.log(`Succesfully connected to db: ${process.env.DB_DATABASE}`);
    })
    .catch(err => {
        console.log(`Error Connecting to db: ${process.env.DB_DATABASE} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(err.original);
    });

// export object models/entities

module.exports = { User };