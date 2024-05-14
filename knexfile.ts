/* eslint-disable */
const dotenv = require("dotenv");
dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_PORT = +(process.env.MYSQL_PORT || 3306);
const MYSQL_DB = process.env.MYSQL_DB;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DB,
    },
    pool: {
      min: 2,
      max: 4,
    },
    migrations: {
      tableName: "knex_migrations",
      loadExtensions: [".ts"],
    },
  },

  staging: {
    client: "mysql2",
    connection: {
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DB,
    },
    pool: {
      min: 2,
      max: 4,
    },
    migrations: {
      tableName: "knex_migrations",
      loadExtensions: [".ts"],
    },
  },

  production: {
    client: "mysql2",
    connection: {
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DB,
    },
    pool: {
      min: 2,
      max: 4,
    },
    migrations: {
      tableName: "knex_migrations",
      loadExtensions: [".ts"],
    },
  },
};

