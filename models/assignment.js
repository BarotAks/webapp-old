const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Submission = require('./submission');
const Account = require('./account');

const Assignment = sequelize.define('assignment', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  points: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  num_of_attempts: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  deadline: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  assignment_created: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  assignment_updated: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  creatorId: {
    type: Sequelize.UUID, // Assuming creatorId is a foreign key referencing Account table
    allowNull: false,
  },
});

// Set up association
Assignment.hasMany(Submission, { foreignKey: 'assignment_id' });
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id' });

module.exports = Assignment;
