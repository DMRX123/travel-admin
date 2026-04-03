import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Toast from '../components/Toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    base_fare: 50,
    per_km_rate: 15,
    per_minute_rate: 2,
    cancellation_fee: 50,
    commission_rate: 20,
    min_booking_amount: 100,
    max_distance: 100,
    promo_code_enabled: true,
    referral_bonus: 100
  });
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    valid_until: ''
  });

  // Fixed: Moved fetch functions inside useEffect
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (data) {
        setSettings(data);
      }
    };

    const fetchPromoCodes = async () => {
      const { data } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      setPromoCodes(data || []);
    };

    fetchSettings();
    fetchPromoCodes();
  }, []);

  const refreshPromoCodes = async () => {
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    setPromoCodes(data || []);
  };

  const saveSettings = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert(settings);
    
    if (!error) {
      setToast({ message: 'Settings saved successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({ message: 'Error saving settings', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
    setLoading(false);
  };

  const createPromoCode = async () => {
    if (!newPromo.code || !newPromo.discount_value) {
      setToast({ message: 'Please fill all fields', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const { error } = await supabase
      .from('promo_codes')
      .insert({
        ...newPromo,
        valid_until: newPromo.valid_until || null
      });
    
    if (!error) {
      await refreshPromoCodes();
      setShowPromoModal(false);
      setNewPromo({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        valid_until: ''
      });
      setToast({ message: 'Promo code created!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const deletePromoCode = async (id) => {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await refreshPromoCodes();
      setToast({ message: 'Promo code deleted', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <h1 className="text-3xl font-bold mb-6">System Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pricing Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare (₹)</label>
              <input
                type="number"
                value={settings.base_fare}
                onChange={(e) => setSettings({...settings, base_fare: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per KM Rate (₹)</label>
              <input
                type="number"
                value={settings.per_km_rate}
                onChange={(e) => setSettings({...settings, per_km_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Minute Rate (₹)</label>
              <input
                type="number"
                value={settings.per_minute_rate}
                onChange={(e) => setSettings({...settings, per_minute_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Fee (₹)</label>
              <input
                type="number"
                value={settings.cancellation_fee}
                onChange={(e) => setSettings({...settings, cancellation_fee: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                value={settings.commission_rate}
                onChange={(e) => setSettings({...settings, commission_rate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Amount (₹)</label>
              <input
                type="number"
                value={settings.min_booking_amount}
                onChange={(e) => setSettings({...settings, min_booking_amount: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.promo_code_enabled}
                onChange={(e) => setSettings({...settings, promo_code_enabled: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Enable Promo Codes</label>
            </div>
            <div>
              <label className="text-sm text-gray-700 mr-2">Referral Bonus (₹)</label>
              <input
                type="number"
                value={settings.referral_bonus}
                onChange={(e) => setSettings({...settings, referral_bonus: parseFloat(e.target.value)})}
                className="w-32 px-3 py-1 border rounded-lg"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Promo Codes</h2>
            <button
              onClick={() => setShowPromoModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              + Add Promo Code
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Min Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Valid Until</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td className="px-4 py-3 font-mono font-bold">{promo.code}</td>
                    <td className="px-4 py-3">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `₹${promo.discount_value} OFF`}
                    </td>
                    <td className="px-4 py-3">₹{promo.min_order_amount}</td>
                    <td className="px-4 py-3">{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : 'No expiry'}</td>
                    <td className="px-4 py-3">{promo.used_count}/{promo.usage_limit}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deletePromoCode(promo.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showPromoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Promo Code</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <select
                  value={newPromo.discount_type}
                  onChange={(e) => setNewPromo({...newPromo, discount_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                <input
                  type="number"
                  placeholder="Discount Value"
                  value={newPromo.discount_value}
                  onChange={(e) => setNewPromo({...newPromo, discount_value: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Minimum Order Amount"
                  value={newPromo.min_order_amount}
                  onChange={(e) => setNewPromo({...newPromo, min_order_amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  placeholder="Valid Until"
                  value={newPromo.valid_until}
                  onChange={(e) => setNewPromo({...newPromo, valid_until: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createPromoCode}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}