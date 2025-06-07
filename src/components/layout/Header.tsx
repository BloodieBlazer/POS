import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Bell, Sun, Moon, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

function Header() {
  const { toggleSidebar } = useApp();
  const { items, total } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, clearAll } = useNotification();

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Split notifications into unread and read
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  // Mark all unread as read when dropdown opens
  useEffect(() => {
    if (showDropdown && unreadNotifications.length > 0) {
      unreadNotifications.forEach((n) => markAsRead(n.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="sticky top-0 z-30 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-4 md:px-6 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
          Dashboard
        </h1>
        <div className="flex-1" />
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 relative"
              onClick={() => setShowDropdown((prev) => !prev)}
              aria-label="Show notifications"
            >
              <Bell size={20} />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 flex justify-between items-center">
                  <span>Notifications</span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {unreadNotifications.length === 0 && readNotifications.length === 0 && (
                    <li className="p-4 text-center text-slate-500 dark:text-slate-400">No notifications</li>
                  )}
                  {unreadNotifications.map((n) => (
                    <li key={n.id} className="flex items-start space-x-2 p-4 bg-yellow-50 dark:bg-yellow-900/20">
                      {n.type === 'warning' && <AlertTriangle className="text-yellow-500 mt-1" size={18} />}
                      {n.type === 'success' && <span className="text-green-500 font-bold mt-1">✓</span>}
                      {n.type === 'error' && <span className="text-red-500 font-bold mt-1">✕</span>}
                      {n.type === 'info' && <span className="text-blue-500 font-bold mt-1">ℹ</span>}
                      <div className="flex-1">
                        <div className="text-sm text-slate-800 dark:text-slate-100">{n.message}</div>
                        <div className="text-xs text-slate-400 mt-1">{n.timestamp.toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                  {readNotifications.length > 0 && (
                    <li className="px-4 py-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/30">Read</li>
                  )}
                  {readNotifications.map((n) => (
                    <li key={n.id} className="flex items-start space-x-2 p-4 opacity-60">
                      {n.type === 'warning' && <AlertTriangle className="text-yellow-500 mt-1" size={18} />}
                      {n.type === 'success' && <span className="text-green-500 font-bold mt-1">✓</span>}
                      {n.type === 'error' && <span className="text-red-500 font-bold mt-1">✕</span>}
                      {n.type === 'info' && <span className="text-blue-500 font-bold mt-1">ℹ</span>}
                      <div className="flex-1">
                        <div className="text-sm text-slate-800 dark:text-slate-100">{n.message}</div>
                        <div className="text-xs text-slate-400 mt-1">{n.timestamp.toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button 
            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 relative flex items-center"
            onClick={() => navigate('/sales')}
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            {total > 0 && (
              <span className="ml-2 text-sm font-medium hidden md:inline-block dark:text-slate-300">
                ${total.toFixed(2)}
              </span>
            )}
          </button>
          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
              AD
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:inline-block">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;