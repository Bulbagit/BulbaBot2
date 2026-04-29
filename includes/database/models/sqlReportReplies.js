// @ts-check
/*
 * Contains replies to reports and subsequent conversations between mod and user.
 */
import { Model as _Model, BIGINT, DATE, literal, TEXT } from "sequelize";
import sequelize from "../database.js";

class ReportReplies extends _Model {}

ReportReplies.init(
  {
    id: {
      type: BIGINT(20),
      unique: true,
      primaryKey: true,
      autoIncrement: true,
    },
    reportId: {
      type: BIGINT(20),
      allowNull: false,
      references: {
        model: "reportlogs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // Delete all replies associated with a report if the report is deleted
    },
    senderId: {
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
    modelName: "reportreplies",
    // Sequelize will pluralize table names by default
    // For consistency, we stop this behavior
    freezeTableName: true,
    // If this is set to true (default),
    // Sequelize will create columns for time created, time updated, etc.
    // We store the log time already, so this is set to false.
    timestamps: false,
  }
);

export default ReportReplies;
