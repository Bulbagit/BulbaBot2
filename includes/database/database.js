// @ts-check
/*
 * Centralized database connection.
 */
import Sequelize from "sequelize";
import config from "../../config.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

export default sequelize;
