// components/Layout.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, user_type')
          .eq('id', session.user.id)
          .single();
        setUser({ ...session.user, ...profile });
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Users', href: '/users', icon: '👥' },
    { name: 'Drivers', href: '/drivers', icon: '🚗' },
    { name: 'Rides', href: '/rides', icon: '🚕' },
    { name: 'Reports', href: '/reports', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-orange-500 text-white rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-200 ease-in-out z-40 w-64 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-xl`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Maa Saraswati Travels
          </h1>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Admin Panel
          </p>
          {user && (
            <p className={`text-xs mt-2 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Welcome, {user.full_name || user.email}
            </p>
          )}
        </div>
        <nav className="p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                router.pathname === item.href
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 mt-4 rounded-xl transition-all duration-200 ${
              theme === 'dark'
                ? 'text-gray-300 hover:bg-red-900/30 hover:text-red-400'
                : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <span className="mr-3 text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className={`sticky top-0 z-30 border-b ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Welcome to Maa Saraswati Travels Admin
            </h2>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}