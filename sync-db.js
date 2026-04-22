// @ts-check
/*
 * This script is used to sync the current state of the database with the model definitions
 */

import sequelize from "./includes/database.js";
import "./includes/index.js";

console.log("Syncing database...");

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database successfully synced.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("An error occurred while syncing the database: ", err);
    process.exit(1);
  });
