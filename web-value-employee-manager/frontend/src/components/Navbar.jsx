import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and main navigation */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard">
                <img
                  className="h-8 w-auto"
                  src="/logo.svg"
                  alt="Web Value"
                />
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className="border-transparent text-gray-500 hover:border-blue-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('navigation.dashboard')}
              </Link>

              <Link
                to="/tasks"
                className="border-transparent text-gray-500 hover:border-blue-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('navigation.tasks')}
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin/users"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {t('navigation.users')}
                </Link>
              )}
            </div>
          </div>

          {/* Right side - User menu and language toggle */}
          <div className="flex items-center">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="bg-white p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Create Task Button */}
            <Link
              to="/tasks/create"
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('tasks.createTask')}
            </Link>

            {/* User Menu */}
            <Menu as="div" className="ml-4 relative">
              <Menu.Button className="bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {/* Menu Items */}
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700`}
                      >
                        {t('navigation.profile')}
                      </Link>
                    )}
                  </Menu.Item>

                  {user?.role === 'admin' && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/admin/analytics"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700`}
                        >
                          {t('navigation.analytics')}
                        </Link>
                      )}
                    </Menu.Item>
                  )}

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full text-left px-4 py-2 text-sm text-red-600`}
                      >
                        {t('auth.logout')}
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/dashboard"
            className="bg-blue-50 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            {t('navigation.dashboard')}
          </Link>

          <Link
            to="/tasks"
            className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            {t('navigation.tasks')}
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin/users"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              {t('navigation.users')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
