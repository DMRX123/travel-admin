// components/StatsCard.js
import { useTheme } from '../context/ThemeContext';

export default function StatsCard({ title, value, icon, color, trend, trendValue }) {
  const { theme } = useTheme();

  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  return (
    <div className={`rounded-xl p-6 shadow-lg transition-all hover:shadow-xl ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${trendColors[trend]}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colors[color] || colors.blue}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}