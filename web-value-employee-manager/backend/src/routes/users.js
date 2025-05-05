const express = require('express');
const router = express.Router();
const {
  protect,
  authorize,
  isAdmin,
  isOwnerOrAdmin
} = require('../middlewares/authMiddleware');
const {
  createUserValidation,
  updateUserValidation,
  validateIdParam,
  validate
} = require('../utils/validators');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// All routes are protected and require authentication
router.use(protect);

// Admin-only routes
router.route('/')
  .get(authorize('admin'), getUsers)
  .post(authorize('admin'), createUserValidation, validate, createUser);

// Admin or self routes
router.route('/:id')
  .get(validateIdParam, validate, isOwnerOrAdmin, getUser)
  .put(validateIdParam, updateUserValidation, validate, isOwnerOrAdmin, updateUser)
  .delete(validateIdParam, validate, authorize('admin'), deleteUser);

// Get user statistics (admin or self)
router.get('/:id/stats', validateIdParam, validate, isOwnerOrAdmin, getUserStats);

// Additional admin routes
router.get('/analytics/overview', authorize('admin'), async (req, res) => {
  try {
    const analytics = {
      totalUsers: await User.count(),
      activeUsers: await User.count({ where: { isActive: true } }),
      admins: await User.count({ where: { role: 'admin' } }),
      employees: await User.count({ where: { role: 'employee' } })
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Bulk actions (admin only)
router.post('/bulk/activate', authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;
    await User.update(
      { isActive: true },
      { where: { id: userIds } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Users activated successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk/deactivate', authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;
    await User.update(
      { isActive: false },
      { where: { id: userIds } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Users deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Search users (admin only)
router.get('/search', authorize('admin'), async (req, res) => {
  try {
    const { query, role, isActive } = req.query;
    const whereClause = {};
    
    if (query) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// Export activity log for user (admin or self)
router.get('/:id/activity', validateIdParam, validate, isOwnerOrAdmin, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: {
        [Op.or]: [
          { creatorId: req.params.id },
          { assigneeId: req.params.id }
        ]
      },
      include: [
        {
          model: TaskLog,
          as: 'statusLogs'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
