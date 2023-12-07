const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Assignment = require('./assignment');

const Submission = sequelize.define('submission', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  assignment_id: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'assignment',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  submission_url: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
    readOnly: true,
  },
  submission_date: {
    type: Sequelize.DATE,
    allowNull: false,
    readOnly: true,
  },
  submission_updated: {
    type: Sequelize.DATE,
    allowNull: false,
    readOnly: true,
  },
});

module.exports = Submission;