// @ts-check
/*
 * Contains the sequelize class for the mutes table.
 * This table is referenced on restart to requeue any unmutes that were pending.
 */

import Sequelize, { Model as _Model, BIGINT, DATE, literal, TEXT } from "sequelize";
import config from "../config.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

class Mutes extends _Model {}
Mutes.init(
  {
    id: {
      type: BIGINT(20),
      unique: true,
      primaryKey: true,
      autoIncrement: true,
    },
    mutedID: {
      type: BIGINT(20),
      allowNull: false,
    },
    mutedName: {
      type: TEXT,
      allowNull: false,
    },
    duration: {
      type: TEXT,
      allowNull: false,
    },
    mutedTime: {
      type: DATE,
      defaultValue: literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
    unmutedTime: {
      type: DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "mutes",
    // Sequelize will pluralize table names by default
    // For consistency, we stop this behavior
    freezeTableName: true,
    // If this is set to true (default),
    // Sequelize will create columns for time created, time updated, etc.
    // We store the log time already, so this is set to false.
    timestamps: false,
  }
);

Mutes.sync();

export default Mutes;
