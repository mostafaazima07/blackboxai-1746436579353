const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isFuture(value) {
        if (value && value <= new Date()) {
          throw new Error('Due date must be in the future');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Needs Feedback'),
    defaultValue: 'Not Started'
  },
  note: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  calendarEventId: {
    type: DataTypes.STRING,
    // Store Google Calendar and Microsoft Calendar event IDs as JSON
    get() {
      const value = this.getDataValue('calendarEventId');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('calendarEventId', JSON.stringify(value));
    }
  },
  completedAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  hooks: {
    beforeUpdate: async (task) => {
      if (task.changed('status') && task.status === 'Completed') {
        task.completedAt = new Date();
      }
    }
  }
});

// Define associations
Task.associate = (models) => {
  Task.belongsTo(models.User, {
    as: 'creator',
    foreignKey: 'creatorId'
  });
  
  Task.belongsTo(models.User, {
    as: 'assignee',
    foreignKey: 'assigneeId'
  });

  Task.hasMany(models.TaskLog, {
    as: 'statusLogs',
    foreignKey: 'taskId'
  });
};

// Instance methods
Task.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Remove sensitive data if needed
  delete values.calendarEventId;
  return values;
};

module.exports = Task;
