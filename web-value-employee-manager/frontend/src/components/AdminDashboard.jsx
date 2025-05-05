import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../utils/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [tasksByStatus, setTasksByStatus] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [userPerformance, setUserPerformance] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [taskStats, userStats, tasks] = await Promise.all([
        api.get('/tasks/analytics'),
        api.get('/users/analytics/overview'),
        api.get('/tasks?limit=5&sort=createdAt:desc')
      ]);

      setStats({
        totalTasks: taskStats.data.total,
        completedTasks: taskStats.data.byStatus.Completed || 0,
        inProgressTasks: taskStats.data.byStatus['In Progress'] || 0,
        overdueTasks: taskStats.data.overdue,
        totalUsers: userStats.data.totalUsers,
        activeUsers: userStats.data.activeUsers
      });

      setTasksByStatus(taskStats.data.byStatus);
      setRecentTasks(tasks.data.data);
      setUserPerformance(taskStats.data.perUser);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskStatusChartData = {
    labels: Object.keys(tasksByStatus),
    datasets: [
      {
        data: Object.values(tasksByStatus),
        backgroundColor: [
          '#3B82F6', // blue-500
          '#EF4444', // red-500
          '#10B981', // green-500
          '#F59E0B'  // yellow-500
        ]
      }
    ]
  };

  const userPerformanceChartData = {
    labels: userPerformance.map(user => user.assignee.name),
    datasets: [
      {
        label: t('dashboard.taskMetrics.completed'),
        data: userPerformance.map(user => user.completed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      },
      {
        label: t('dashboard.taskMetrics.inProgress'),
        data: userPerformance.map(user => user.inProgress),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }
    ]
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard.title')}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: t('dashboard.stats.totalTasks'),
            value: stats.totalTasks,
            color: 'blue'
          },
          {
            title: t('dashboard.stats.completedTasks'),
            value: stats.completedTasks,
            color: 'green'
          },
          {
            title: t('dashboard.stats.overdueTasks'),
            value: stats.overdueTasks,
            color: 'red'
          },
          {
            title: t('dashboard.stats.activeUsers'),
            value: stats.activeUsers,
            color: 'indigo'
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t('dashboard.charts.taskStatus')}
          </h2>
          <div className="h-64">
            <Pie data={taskStatusChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </motion.div>

        {/* User Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t('dashboard.charts.userPerformance')}
          </h2>
          <div className="h-64">
            <Line data={userPerformanceChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </motion.div>
      </div>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {t('dashboard.recentTasks')}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {t('tasks.assignedTo')}: {task.assignee.name}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {t(`tasks.status.${task.status.toLowerCase()}`)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-end space-x-4">
        <Link
          to="/admin/users/add"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {t('users.addUser')}
        </Link>
        <Link
          to="/tasks/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          {t('tasks.createTask')}
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
