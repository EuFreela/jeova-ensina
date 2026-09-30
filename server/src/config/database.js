const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DATABASE_DIALECT || 'sqlite';

const options = {
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
};

if (dialect === 'sqlite') {
  // O banco fica em server/data/, fora de src/: é um artefato local,
  // versionado pelo .gitignore e nunca deve ficar junto do código.
  options.storage = process.env.DATABASE_STORAGE || path.join(__dirname, '..', '..', 'data', 'database.sqlite');
} else {
  options.host = process.env.DATABASE_HOST || 'localhost';
  options.port = Number(process.env.DATABASE_PORT) || 5432;
  options.username = process.env.DATABASE_USER;
  options.password = process.env.DATABASE_PASSWORD;
  options.database = process.env.DATABASE_NAME || 'adivinhacao';
}

const sequelize = new Sequelize(options);

module.exports = sequelize;
