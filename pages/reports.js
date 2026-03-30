import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { LineChartComponent, BarChartComponent } from '../components/Chart';
import StatsCard from '../components/StatsCard';

export default function Reports() {
  const [dateRange, setDateRange] = useState('week');
  const [revenueData, setRevenueData] = useState([]);
  const [vehicleStats, setVehicleStats] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Fixed: Moved fetchReports inside useEffect to avoid set-state-in-effect warning
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      let startDate;
      const now = new Date();
      
      if (dateRange === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (dateRange === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (dateRange === 'year') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      }

      // Revenue by date
      const { data: rides } = await supabase
        .from('rides')
        .select('created_at, fare, payment_status')
        .gte('created_at', startDate.toISOString())
        .eq('payment_status', 'paid');

      // Group by date
      const revenueMap = {};
      rides?.forEach(ride => {
        const date = new Date(ride.created_at).toLocaleDateString();
        if (!revenueMap[date]) {
          revenueMap[date] = { date, revenue: 0, rides: 0 };
        }
        revenueMap[date].revenue += ride.fare;
        revenueMap[date].rides++;
      });
      setRevenueData(Object.values(revenueMap));

      // Vehicle type stats
      const { data: vehicleData } = await supabase
        .from('rides')
        .select('vehicle_type')
        .gte('created_at', startDate.toISOString());

      const vehicleMap = {};
      vehicleData?.forEach(ride => {
        vehicleMap[ride.vehicle_type] = (vehicleMap[ride.vehicle_type] || 0) + 1;
      });
      setVehicleStats(Object.entries(vehicleMap).map(([name, value]) => ({ name, value })));

      // Top drivers
      const { data: driversData } = await supabase
        .from('rides')
        .select('driver_id, fare')
        .gte('created_at', startDate.toISOString())
        .not('driver_id', 'is', null);

      const driverMap = {};
      driversData?.forEach(ride => {
        if (!driverMap[ride.driver_id]) {
          driverMap[ride.driver_id] = { rides: 0, revenue: 0 };
        }
        driverMap[ride.driver_id].rides++;
        driverMap[ride.driver_id].revenue += ride.fare;
      });

      const driverArray = Object.entries(driverMap).map(([id, stats]) => ({ id, ...stats }));
      driverArray.sort((a, b) => b.revenue - a.revenue);
      
      // Fetch driver names
      const top5 = driverArray.slice(0, 5);
      for (let driver of top5) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', driver.id)
          .single();
        driver.name = data?.full_name || 'Unknown';
      }
      setTopDrivers(top5);

      // Summary stats
      const totalRevenue = rides?.reduce((sum, r) => sum + r.fare, 0) || 0;
      const totalRides = rides?.length || 0;
      const avgFare = totalRides > 0 ? totalRevenue / totalRides : 0;
      
      setSummary({ totalRevenue, totalRides, avgFare });
      setLoading(false);
    };

    fetchReports();
  }, [dateRange]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title="Total Revenue" value={`₹${summary.totalRevenue?.toFixed(2) || 0}`} icon="💰" color="green" />
          <StatsCard title="Total Rides" value={summary.totalRides || 0} icon="🚕" color="blue" />
          <StatsCard title="Average Fare" value={`₹${summary.avgFare?.toFixed(2) || 0}`} icon="📊" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LineChartComponent 
            data={revenueData} 
            dataKey="revenue" 
            xAxisKey="date" 
            title="Revenue Trend" 
          />
          <BarChartComponent 
            data={revenueData} 
            dataKey="rides" 
            xAxisKey="date" 
            title="Ride Volume Trend" 
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Vehicle Type Distribution</h2>
          <div className="space-y-4">
            {vehicleStats.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{item.name}</span>
                  <span className="text-sm text-gray-500">{item.value} rides</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(item.value / vehicleStats.reduce((sum, i) => sum + i.value, 0)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Top Performing Drivers</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Rides</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topDrivers.map((driver, index) => (
                  <tr key={driver.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.rides}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{driver.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}