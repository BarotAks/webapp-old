'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('assignments', 'creatorId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'accounts', // Name of the referenced table (accounts table in this case)
        key: 'id', // Primary key of the referenced table
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('assignments', 'creatorId');
  },
  
};
