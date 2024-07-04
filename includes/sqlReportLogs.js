// @ts-check
/*
 * Contains the sequelize class for the reports table.
 */

import Sequelize, {
    Model as _Model,
    BIGINT,
    DATE,
    literal,
    TEXT,
} from "sequelize";
import config from "../config.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

class ReportLogs extends _Model {}
ReportLogs.init(
  {
    id: {
      type: BIGINT(20),
      unique: true,
      primaryKey: true,
      autoIncrement: true,
    },
    reporterID: {
      type: BIGINT(20),
      allowNull: false,
    },
    reportedID: {
      type: BIGINT(20),
      allowNull: false,
    },
    message: {
      type: TEXT,
      allowNull: false,
    },
    time: {
      type: DATE,
      allowNull: false,
      defaultValue: literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    modelName: "reportlogs",
    // Sequelize will pluralize table names by default
    // For consistency, we stop this behavior
    freezeTableName: true,
    // If this is set to true (default),
    // Sequelize will create columns for time created, time updated, etc.
    timestamps: false,
  }
);

// Ensure our DB is ready.
ReportLogs.sync().catch((err) => {
  console.log(err);
});

export default ReportLogs;
