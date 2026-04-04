// components/NotificationBell.js
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'ride': return '🚗';
      case 'payment': return '💰';
      case 'promo': return '🎉';
      case 'alert': return '⚠️';
      case 'success': return '✅';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all ${
          theme === 'dark'
            ? 'hover:bg-white/10 text-white'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl z-50 ${
              theme === 'dark'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className={`sticky top-0 p-3 border-b flex justify-between items-center ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark'
                        ? 'text-orange-400 hover:bg-gray-700'
                        : 'text-orange-600 hover:bg-gray-100'
                    }`}
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:bg-gray-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="text-3xl">🔕</span>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 cursor-pointer transition-all ${
                      !notification.read
                        ? theme === 'dark'
                          ? 'bg-orange-500/10'
                          : 'bg-orange-50'
                        : ''
                    } ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getIcon(notification.type)}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {notification.body}
                        </p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}