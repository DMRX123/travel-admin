// context/NotificationContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, []);

  const saveToLocal = (updated) => {
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      read: false,
      timestamp: new Date().toISOString(),
      ...notification,
    };
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    saveToLocal(updated);
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveToLocal(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveToLocal(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    saveToLocal([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};