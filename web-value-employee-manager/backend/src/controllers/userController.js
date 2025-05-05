const User = require('../models/User');
const Task = require('../models/Task');
const { validateEmail } = require('../utils/validators');
const { Op } = require('sequelize');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin or Self)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Task,
          as: 'assignedTasks',
          separate: true,
          limit: 5,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Task,
          as: 'createdTasks',
          separate: true,
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add task statistics
    const taskStats = await Task.findAll({
      where: { assigneeId: user.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const userData = user.toJSON();
    userData.taskStats = taskStats;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate email format and domain
    if (!validateEmail(email) || !email.endsWith('@thewebvalue.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid @thewebvalue.com email'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee'
    });

    // Remove password from response
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate email if provided
    if (email && (!validateEmail(email) || !email.endsWith('@thewebvalue.com'))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid @thewebvalue.com email'
      });
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      isActive: typeof isActive === 'boolean' ? isActive : user.isActive
    });

    // Remove password from response
    const userData = user.toJSON();
    delete userData.password;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any active tasks
    const activeTasks = await Task.count({
      where: {
        [Op.or]: [
          { creatorId: user.id },
          { assigneeId: user.id }
        ],
        status: {
          [Op.notIn]: ['Completed']
        }
      }
    });

    if (activeTasks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active tasks. Please reassign or complete tasks first.'
      });
    }

    // Soft delete by deactivating instead of removing
    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user task statistics
// @route   GET /api/users/:id/stats
// @access  Private (Admin or Self)
exports.getUserStats = async (req, res, next) => {
  try {
    const stats = await Task.findAll({
      where: {
        [Op.or]: [
          { creatorId: req.params.id },
          { assigneeId: req.params.id }
        ]
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const overdueTasks = await Task.count({
      where: {
        assigneeId: req.params.id,
        dueDate: {
          [Op.lt]: new Date()
        },
        status: {
          [Op.ne]: 'Completed'
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        tasksByStatus: stats,
        overdueTasks
      }
    });
  } catch (error) {
    next(error);
  }
};
