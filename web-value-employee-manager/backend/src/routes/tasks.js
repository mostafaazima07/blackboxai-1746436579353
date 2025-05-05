const express = require('express');
const router = express.Router();
const {
  protect,
  authorize,
  canAccessTask
} = require('../middlewares/authMiddleware');
const {
  createTaskValidation,
  updateTaskStatusValidation,
  taskFilterValidation,
  validateIdParam,
  validate
} = require('../utils/validators');
const {
  createTask,
  getTasks,
  getTask,
  updateTaskStatus,
  getTaskAnalytics
} = require('../controllers/taskController');

// Protect all routes
router.use(protect);

// Task routes
router.route('/')
  .get(taskFilterValidation, validate, getTasks)
  .post(createTaskValidation, validate, createTask);

router.route('/:id')
  .get(validateIdParam, validate, canAccessTask, getTask)
  .patch(validateIdParam, updateTaskStatusValidation, validate, canAccessTask, updateTaskStatus);

// Analytics routes (admin only)
router.get('/analytics/overview', authorize('admin'), getTaskAnalytics);

// Task comments
router.post('/:id/comments', validateIdParam, validate, canAccessTask, async (req, res, next) => {
  try {
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    await TaskLog.create({
      taskId: req.params.id,
      userId: req.user.id,
      comment,
      previousStatus: req.task.status,
      newStatus: req.task.status
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get task timeline
router.get('/:id/timeline', validateIdParam, validate, canAccessTask, async (req, res, next) => {
  try {
    const timeline = await TaskLog.findAll({
      where: { taskId: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
});

// Bulk task operations (admin only)
router.post('/bulk/update-status', authorize('admin'), async (req, res, next) => {
  try {
    const { taskIds, status, comment } = req.body;
    
    // Update tasks
    await Task.update(
      { status },
      { where: { id: taskIds } }
    );

    // Create logs for each task
    await Promise.all(taskIds.map(taskId =>
      TaskLog.create({
        taskId,
        userId: req.user.id,
        newStatus: status,
        comment: comment || `Bulk status update to ${status}`
      })
    ));

    res.status(200).json({
      success: true,
      message: 'Tasks updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Task search
router.get('/search', async (req, res, next) => {
  try {
    const { query, status, priority, assigneeId, startDate, endDate } = req.query;
    const whereClause = {};

    // Build search criteria
    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ];
    }

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assigneeId) whereClause.assigneeId = assigneeId;

    if (startDate && endDate) {
      whereClause.dueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Add permission check
    if (req.user.role !== 'admin') {
      whereClause[Op.or] = [
        { creatorId: req.user.id },
        { assigneeId: req.user.id }
      ];
    }

    const tasks = await Task.findAll({
      where: whereClause,
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

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

// Export task data (admin only)
router.get('/export', authorize('admin'), async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['name', 'email']
        },
        {
          model: TaskLog,
          as: 'statusLogs',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format data for export
    const exportData = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      creator: task.creator.name,
      assignee: task.assignee.name,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      timeline: task.statusLogs.map(log => ({
        status: log.newStatus,
        updatedBy: log.user.name,
        timestamp: log.createdAt,
        comment: log.comment
      }))
    }));

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
