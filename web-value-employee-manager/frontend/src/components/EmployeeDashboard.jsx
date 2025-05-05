import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TaskCard = ({ task }) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Needs Feedback':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            task.status
          )}`}
        >
          {t(`tasks.status.${task.status.toLowerCase()}`)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {task.creator.name.charAt(0)}
              </span>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-gray-900">{task.creator.name}</p>
            <p className="text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
        <Link
          to={`/tasks/${task.id}`}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          {t('common.view')}
        </Link>
      </div>
    </motion.div>
  );
};

const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState({
    assigned: [],
    created: []
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksResponse, statsResponse] = await Promise.all([
        api.get('/tasks', {
          params: {
            userId: user.id
          }
        }),
        api.get(`/users/${user.id}/stats`)
      ]);

      setTasks({
        assigned: tasksResponse.data.data.filter(task => task.assigneeId === user.id),
        created: tasksResponse.data.data.filter(task => task.creatorId === user.id)
      });

      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard.welcome')}, {user.name}!
        </h1>
        <p className="mt-2 text-gray-600">{t('dashboard.overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: t('dashboard.stats.totalTasks'),
            value: stats.total,
            color: 'blue'
          },
          {
            title: t('dashboard.stats.completedTasks'),
            value: stats.completed,
            color: 'green'
          },
          {
            title: t('dashboard.stats.inProgressTasks'),
            value: stats.inProgress,
            color: 'yellow'
          },
          {
            title: t('dashboard.stats.overdueTasks'),
            value: stats.overdue,
            color: 'red'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-${stat.color}-50 rounded-lg p-6 shadow-sm`}
          >
            <h3 className={`text-${stat.color}-600 text-sm font-medium`}>
              {stat.title}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tasks Sections */}
      <div className="space-y-8">
        {/* Assigned Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('tasks.assignedToMe')}
            </h2>
            <Link
              to="/tasks?filter=assigned"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.assigned.slice(0, 4).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Created Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('tasks.createdByMe')}
            </h2>
            <Link
              to="/tasks?filter=created"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.created.slice(0, 4).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-end">
        <Link
          to="/tasks/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {t('tasks.createTask')}
        </Link>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
