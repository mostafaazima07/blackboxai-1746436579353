import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TaskDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const [taskResponse, timelineResponse] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/tasks/${id}/timeline`)
      ]);

      setTask(taskResponse.data.data);
      setTimeline(timelineResponse.data.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error(t('tasks.errors.fetchError'));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${id}`, {
        status: newStatus,
        comment: comment.trim() || t('tasks.autoComment.statusChange', { status: newStatus })
      });

      await fetchTaskDetails();
      setComment('');
      toast.success(t('tasks.updateSuccess'));
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(t('tasks.errors.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setUpdating(true);
    try {
      await api.post(`/tasks/${id}/comments`, { comment: comment.trim() });
      await fetchTaskDetails();
      setComment('');
      toast.success(t('tasks.commentSuccess'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('tasks.errors.commentError'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const canUpdateStatus = user.role === 'admin' || task.assigneeId === user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm"
      >
        {/* Task Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                task.status === 'Completed'
                  ? 'bg-green-100 text-green-800'
                  : task.status === 'In Progress'
                  ? 'bg-blue-100 text-blue-800'
                  : task.status === 'Needs Feedback'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {t(`tasks.status.${task.status.toLowerCase()}`)}
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                {t('tasks.fields.description')}
              </h3>
              <p className="mt-2 text-gray-900 whitespace-pre-wrap" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                {task.description}
              </p>

              {task.note && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {t('tasks.fields.note')}
                  </h3>
                  <p className="mt-2 text-gray-900" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                    {task.note}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t('tasks.fields.assignee')}
                </h3>
                <div className="mt-2 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {task.assignee.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{task.assignee.name}</p>
                    <p className="text-sm text-gray-500">{task.assignee.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t('tasks.fields.creator')}
                </h3>
                <div className="mt-2 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {task.creator.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{task.creator.name}</p>
                    <p className="text-sm text-gray-500">{task.creator.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t('tasks.fields.dueDate')}
                </h3>
                <p className="mt-2 text-gray-900">
                  {new Date(task.dueDate).toLocaleString(i18n.language)}
                </p>
              </div>

              {canUpdateStatus && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    {t('tasks.updateStatus')}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Not Started', 'In Progress', 'Completed', 'Needs Feedback'].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={updating || task.status === status}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            task.status === status
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {t(`tasks.status.${status.toLowerCase()}`)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 py-4 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t('tasks.timeline')}
          </h2>

          <div className="flow-root">
            <ul className="-mb-8">
              {timeline.map((event, index) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {index < timeline.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {event.user.name.charAt(0)}
                          </span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900">
                            {event.comment ||
                              t('tasks.autoComment.statusChange', {
                                status: event.newStatus
                              })}
                          </p>
                          {event.previousStatus && (
                            <p className="mt-0.5 text-sm text-gray-500">
                              {t('tasks.statusChanged', {
                                from: t(`tasks.status.${event.previousStatus.toLowerCase()}`),
                                to: t(`tasks.status.${event.newStatus.toLowerCase()}`)
                              })}
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleString(i18n.language)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Add Comment */}
        <div className="px-6 py-4 border-t border-gray-200">
          <form onSubmit={handleAddComment}>
            <div>
              <label htmlFor="comment" className="sr-only">
                {t('tasks.addComment')}
              </label>
              <textarea
                id="comment"
                name="comment"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={t('tasks.commentPlaceholder')}
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={updating || !comment.trim()}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (updating || !comment.trim()) && 'opacity-50 cursor-not-allowed'
                }`}
              >
                {updating ? t('common.sending') : t('common.send')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskDetail;
