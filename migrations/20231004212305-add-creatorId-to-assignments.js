'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('assignments', 'creatorId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('assignments', 'creatorId');
  },
};
