import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../lib/auth';

export default function Layout() {
  const { user, roles } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 w-full lg:ml-64">
        {/* User role indicator */}
        {user && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <span className="font-medium">Logged in as:</span> {user.email}
            <span className="ml-2 font-medium">Roles:</span> {roles.length > 0 ? roles.join(', ') : 'No roles assigned'}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}