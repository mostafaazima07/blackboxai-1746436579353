const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskLog = sequelize.define('TaskLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  previousStatus: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Needs Feedback'),
    allowNull: true
  },
  newStatus: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Needs Feedback'),
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['userId']
    }
  ]
});

// Define associations
TaskLog.associate = (models) => {
  TaskLog.belongsTo(models.Task, {
    foreignKey: 'taskId',
    as: 'task'
  });

  TaskLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

// Instance method to format the log entry
TaskLog.prototype.formatLogEntry = function() {
  return {
    id: this.id,
    taskId: this.taskId,
    userId: this.userId,
    statusChange: {
      from: this.previousStatus,
      to: this.newStatus
    },
    comment: this.comment,
    timestamp: this.timestamp
  };
};

module.exports = TaskLog;
