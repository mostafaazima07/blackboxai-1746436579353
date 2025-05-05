const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Verify company email domain
exports.verifyEmailDomain = (req, res, next) => {
  const { email } = req.body;

  if (!email || !email.endsWith('@thewebvalue.com')) {
    return res.status(400).json({
      success: false,
      message: 'Email must be from @thewebvalue.com domain'
    });
  }

  next();
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is accessing their own resource or is admin
exports.isOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};

// Validate task ownership or assignment
exports.canAccessTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Allow access if user is admin, creator, or assignee
    if (
      req.user.role === 'admin' ||
      task.creatorId === req.user.id ||
      task.assigneeId === req.user.id
    ) {
      req.task = task;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }
  } catch (error) {
    next(error);
  }
};
