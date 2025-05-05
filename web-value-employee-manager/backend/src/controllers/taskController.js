const Task = require('../models/Task');
const TaskLog = require('../models/TaskLog');
const User = require('../models/User');
const { sendTaskNotification } = require('../services/emailService');
const { scheduleCalendarEvent } = require('../services/calendarService');
const { Op } = require('sequelize');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assigneeId, dueDate, priority, note } = req.body;

    // Validate required fields
    if (!title || !description || !assigneeId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if assignee exists and is active
    const assignee = await User.findByPk(assigneeId);
    if (!assignee || !assignee.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive assignee'
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      creatorId: req.user.id,
      assigneeId,
      dueDate,
      priority: priority || 'Medium',
      note
    });

    // Create initial task log
    await TaskLog.create({
      taskId: task.id,
      userId: req.user.id,
      newStatus: 'Not Started',
      comment: 'Task created'
    });

    // Send email notification
    try {
      await sendTaskNotification(assignee.email, {
        taskId: task.id,
        title,
        description,
        dueDate
      });
    } catch (error) {
      console.error('Email notification failed:', error);
    }

    // Schedule calendar event
    try {
      const calendarEvent = await scheduleCalendarEvent({
        title,
        description,
        startTime: dueDate,
        attendees: [assignee.email]
      });
      
      if (calendarEvent) {
        await task.update({
          calendarEventId: calendarEvent
        });
      }
    } catch (error) {
      console.error('Calendar event scheduling failed:', error);
    }

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks (filtered by role)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    let tasks;
    const { status, priority, startDate, endDate } = req.query;

    // Build query conditions
    const whereConditions = {};
    if (status) whereConditions.status = status;
    if (priority) whereConditions.priority = priority;
    if (startDate && endDate) {
      whereConditions.dueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (req.user.role === 'admin') {
      // Admins can see all tasks
      tasks = await Task.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Employees can only see tasks they created or are assigned to
      tasks = await Task.findAll({
        where: {
          ...whereConditions,
          [Op.or]: [
            { creatorId: req.user.id },
            { assigneeId: req.user.id }
          ]
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: TaskLog,
          as: 'statusLogs',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access permission
    if (req.user.role !== 'admin' && 
        task.creatorId !== req.user.id && 
        task.assigneeId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can update the task
    if (req.user.role !== 'admin' && 
        task.assigneeId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    const previousStatus = task.status;
    
    // Update task status
    await task.update({ status });

    // Create task log
    await TaskLog.create({
      taskId: task.id,
      userId: req.user.id,
      previousStatus,
      newStatus: status,
      comment
    });

    // Send notification if status changed to completed
    if (status === 'Completed') {
      try {
        const creator = await User.findByPk(task.creatorId);
        await sendTaskNotification(creator.email, {
          taskId: task.id,
          title: task.title,
          status: 'Completed',
          completedBy: req.user.name
        });
      } catch (error) {
        console.error('Completion notification failed:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task analytics
// @route   GET /api/tasks/analytics
// @access  Private (Admin only)
exports.getTaskAnalytics = async (req, res, next) => {
  try {
    const analytics = {
      total: await Task.count(),
      byStatus: await Task.count({
        group: 'status'
      }),
      byPriority: await Task.count({
        group: 'priority'
      }),
      overdue: await Task.count({
        where: {
          dueDate: {
            [Op.lt]: new Date()
          },
          status: {
            [Op.ne]: 'Completed'
          }
        }
      })
    };

    // Get per-user statistics if admin
    if (req.user.role === 'admin') {
      analytics.perUser = await Task.findAll({
        attributes: [
          'assigneeId',
          [sequelize.fn('COUNT', '*'), 'total'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END")), 'inProgress']
        ],
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['name', 'email']
          }
        ],
        group: ['assigneeId', 'assignee.id', 'assignee.name', 'assignee.email']
      });
    }

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
