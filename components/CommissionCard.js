// components/CommissionCard.js
import { useTheme } from '../context/ThemeContext';

export default function CommissionCard({ totalRevenue, totalCommission, commissionRate }) {
  const { theme } = useTheme();
  
  const driverEarnings = totalRevenue - totalCommission;
  const platformPercentage = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;
  const driverPercentage = totalRevenue > 0 ? (driverEarnings / totalRevenue) * 100 : 0;

  return (
    <div className={`rounded-xl p-6 shadow-lg ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💰</span>
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Commission Summary
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Commission Rate</p>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {commissionRate}%
          </p>
        </div>
        <div className="text-center">
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Platform Commission</p>
          <p className="text-xl font-bold text-orange-500">₹{totalCommission.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Driver Earnings</p>
          <p className="text-xl font-bold text-green-500">₹{driverEarnings.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
          style={{ width: `${platformPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs">
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          Platform: {platformPercentage.toFixed(1)}%
        </span>
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          Driver: {driverPercentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}