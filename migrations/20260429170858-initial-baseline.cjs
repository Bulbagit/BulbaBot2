"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("blacklist", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      term: { type: Sequelize.STRING, unique: true, allowNull: false },
      flags: { type: Sequelize.STRING },
      options: { type: Sequelize.STRING },
      creator: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.createTable("modlogs", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      loggedID: { type: Sequelize.BIGINT, allowNull: false },
      loggerID: { type: Sequelize.BIGINT, allowNull: false },
      logName: { type: Sequelize.TEXT, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      logTime: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.createTable("mutes", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      mutedID: { type: Sequelize.BIGINT, allowNull: false },
      mutedName: { type: Sequelize.TEXT, allowNull: false },
      duration: { type: Sequelize.TEXT, allowNull: false },
      mutedTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      unmutedTime: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("reportlogs", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      reporterID: { type: Sequelize.BIGINT, allowNull: false },
      reportedID: { type: Sequelize.BIGINT, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      channel: { type: Sequelize.BIGINT, allowNull: false },
      time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("reportreplies", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      reportId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "reportlogs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      senderId: { type: Sequelize.BIGINT, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    // Dropping in this order prevents foreign key constraint errors
    await queryInterface.dropTable("reportreplies");
    await queryInterface.dropTable("reportlogs");
    await queryInterface.dropTable("mutes");
    await queryInterface.dropTable("modlogs");
    await queryInterface.dropTable("blacklist");
  },
};
