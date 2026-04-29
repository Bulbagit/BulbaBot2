// @ts-check
/*
 * Contains the sequelize class for the moderation logs table.
 */

import { Model as _Model, BIGINT, DATE, literal, TEXT } from "sequelize";
import sequelize from "../database.js";

const Model = _Model;
class ModLogs extends Model {}
ModLogs.init(
  {
    id: {
      type: BIGINT(20),
      unique: true,
      primaryKey: true,
      autoIncrement: true,
    },
    loggedID: {
      type: BIGINT(20),
      allowNull: false,
    },
    loggerID: {
      type: BIGINT(20),
      allowNull: false,
    } /* Not functional yet
    loggedNick: {
        type: Sequelize.STRING,
        allowNull: false
    },
    loggedUsername: {
        type: Sequelize.STRING,
        allowNull: false
    },*/,
    logName: {
      type: TEXT,
      allowNull: false,
    },
    message: {
      type: TEXT,
      allowNull: false,
    },
    logTime: {
      type: DATE,
      defaultValue: literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    modelName: "modlogs",
    // Sequelize will pluralize table names by default
    // For consistency, we stop this behavior
    freezeTableName: true,
    // If this is set to true (default),
    // Sequelize will create columns for time created, time updated, etc.
    // We store the log time already, so this is set to false.
    timestamps: false,
  }
);

export default ModLogs;
