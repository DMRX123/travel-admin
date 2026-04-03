// components/DriverBadges.js - CREATE NEW FILE
import { motion } from 'framer-motion';

const badges = [
  { id: 'gold_driver', name: 'Gold Driver', icon: '🥇', requirement: '500+ rides', color: 'from-yellow-500 to-amber-500' },
  { id: 'silver_driver', name: 'Silver Driver', icon: '🥈', requirement: '200+ rides', color: 'from-gray-400 to-gray-500' },
  { id: 'safety_champion', name: 'Safety Champion', icon: '🛡️', requirement: '100% safety rating', color: 'from-green-500 to-emerald-500' },
  { id: 'punctual_star', name: 'Punctual Star', icon: '⭐', requirement: '95% on-time', color: 'from-blue-500 to-cyan-500' },
  { id: 'customer_favorite', name: 'Customer Favorite', icon: '❤️', requirement: '4.9+ rating', color: 'from-red-500 to-pink-500' },
  { id: 'top_earner', name: 'Top Earner', icon: '💰', requirement: '₹50k+ earnings', color: 'from-purple-500 to-indigo-500' },
];

export default function DriverBadges({ driverStats }) {
  const earnedBadges = badges.filter(badge => {
    if (badge.id === 'gold_driver' && driverStats?.totalRides >= 500) return true;
    if (badge.id === 'silver_driver' && driverStats?.totalRides >= 200) return true;
    if (badge.id === 'safety_champion' && driverStats?.safetyRating === 100) return true;
    if (badge.id === 'punctual_star' && driverStats?.onTimeRate >= 95) return true;
    if (badge.id === 'customer_favorite' && driverStats?.rating >= 4.9) return true;
    if (badge.id === 'top_earner' && driverStats?.totalEarnings >= 50000) return true;
    return false;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🏆</span> Driver Achievements
      </h2>
      
      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => {
          const isEarned = earnedBadges.some(b => b.id === badge.id);
          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`relative p-3 rounded-xl text-center transition-all ${
                isEarned 
                  ? `bg-gradient-to-r ${badge.color} text-white shadow-lg` 
                  : 'bg-gray-100 text-gray-400 opacity-50'
              }`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <p className="text-xs font-semibold mt-1">{badge.name}</p>
              <p className="text-[10px]">{badge.requirement}</p>
              {!isEarned && (
                <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-orange-50 rounded-lg">
        <p className="text-sm text-orange-800">
          🎯 {earnedBadges.length}/{badges.length} Badges Earned
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
            style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}