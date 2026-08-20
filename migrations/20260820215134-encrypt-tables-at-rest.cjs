'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE blacklist ENCRYPTION='Y';");
    await queryInterface.sequelize.query("ALTER TABLE mutes ENCRYPTION='Y';");
    await queryInterface.sequelize.query("ALTER TABLE modlogs ENCRYPTION='Y';");
    await queryInterface.sequelize.query("ALTER TABLE reportlogs ENCRYPTION='Y';");
    await queryInterface.sequelize.query("ALTER TABLE reportreplies ENCRYPTION='Y';");
  },

  async down (queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE reportreplies ENCRYPTION='N';");
    await queryInterface.sequelize.query("ALTER TABLE reportlogs ENCRYPTION='N';");
    await queryInterface.sequelize.query("ALTER TABLE modlogs ENCRYPTION='N';");
    await queryInterface.sequelize.query("ALTER TABLE mutes ENCRYPTION='N';");
    await queryInterface.sequelize.query("ALTER TABLE blacklist ENCRYPTION='N';");
  }
};
