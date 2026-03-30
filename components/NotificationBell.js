import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onMessageListener, requestNotificationPermission } from '../lib/firebase';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load saved notifications from localStorage
    const saved = localStorage.getItem('notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }

    // Request notification permission
    requestNotificationPermission();

    // Listen for foreground messages
    onMessageListener().then((payload) => {
      if (payload && payload.notification) {
        const newNotification = {
          id: Date.now().toString(),
          title: payload.notification.title,
          body: payload.notification.body,
          type: payload.data?.type || 'system',
          read: false,
          timestamp: new Date(),
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        localStorage.setItem('notifications', JSON.stringify([newNotification, ...notifications]));
      }
    });
  }, []);

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'ride': return '🚗';
      case 'payment': return '💰';
      case 'promo': return '🎉';
      default: return '🔔';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'ride': return 'text-blue-400';
      case 'payment': return 'text-green-400';
      case 'promo': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-all"
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
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50"
          >
            <div className="sticky top-0 bg-slate-800 p-3 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-orange-400 hover:text-orange-300">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="divide-y divide-white/10">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <span className="text-3xl">🔕</span>
                  <p className="mt-2">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 cursor-pointer hover:bg-white/5 transition-all ${!notification.read ? 'bg-orange-500/10' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl ${getColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{notification.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{notification.body}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
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