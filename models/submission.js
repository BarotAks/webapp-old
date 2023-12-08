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
  },
  submission_url: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
  },
  submission_date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  submission_updated: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});

module.exports = Submission;
