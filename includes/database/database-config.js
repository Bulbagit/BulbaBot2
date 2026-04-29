import config from "../../config.js";

export default {
  development: {
    username: config.dbuser,
    password: config.dbpass,
    database: config.database,
    host: config.dbhost,
    dialect: "mysql",
  },
  production: {
    username: config.dbuser,
    password: config.dbpass,
    database: config.database,
    host: config.dbhost,
    dialect: "mysql",
  },
};
