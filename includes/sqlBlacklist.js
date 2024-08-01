// @ts-check
/*
 * Contains the sequelize class for the blacklist table.
 */

import Sequelize, { Model as _Model, BIGINT, STRING } from "sequelize";
import config from "../config.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

const Model = _Model;
class Blacklist extends Model {}
Blacklist.init(
  {
    id: {
      type: BIGINT(20),
      unique: true,
      primaryKey: true,
      autoIncrement: true,
    },

    term: {
      type: STRING,
      unique: true,
      allowNull: false,
    },

    flags: {
      type: STRING,
    },

    options: {
      type: STRING,
    },

    creator: {
      type: STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "blacklist",
    // Sequelize will pluralize table names by default
    // For consistency, we stop this behavior
    freezeTableName: true,
    // If this is set to true (default),
    // Sequelize will create columns for time created, time updated, etc.
    // We store the log time already, so this is set to false.
    timestamps: false,
  }
);

Blacklist.sync();

export default Blacklist;
