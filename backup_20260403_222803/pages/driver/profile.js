import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DriverProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [driver, setDriver] = useState({
    vehicle_type: '',
    vehicle_model: '',
    vehicle_number: '',
    license_number: '',
    vehicle_color: '',
    seating_capacity: 4,
    ac_available: true,
    rating: 0,
    total_trips: 0,
    earnings: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/driver/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData?.user_type !== 'driver') {
        await supabase.auth.signOut();
        router.replace('/driver/login');
        return;
      }

      setProfile({
        full_name: profileData?.full_name || '',
        email: profileData?.email || '',
        phone: profileData?.phone || '',
      });

      setDriver({
        vehicle_type: driverData?.vehicle_type || '',
        vehicle_model: driverData?.vehicle_model || '',
        vehicle_number: driverData?.vehicle_number || '',
        license_number: driverData?.license_number || '',
        vehicle_color: driverData?.vehicle_color || '',
        seating_capacity: driverData?.seating_capacity || 4,
        ac_available: driverData?.ac_available !== false,
        rating: driverData?.rating || 0,
        total_trips: driverData?.total_trips || 0,
        earnings: driverData?.earnings || 0,
      });

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq('id', session.user.id);

    if (profileError) {
      toast.error('Failed to update profile');
      setSaving(false);
      return;
    }

    // Update driver
    const { error: driverError } = await supabase
      .from('drivers')
      .update({
        vehicle_type: driver.vehicle_type,
        vehicle_model: driver.vehicle_model,
        vehicle_number: driver.vehicle_number,
        license_number: driver.license_number,
        vehicle_color: driver.vehicle_color,
        seating_capacity: driver.seating_capacity,
        ac_available: driver.ac_available,
      })
      .eq('id', session.user.id);

    if (driverError) {
      toast.error('Failed to update driver info');
    } else {
      toast.success('Profile updated successfully');
    }

    setSaving(false);
  };

  const vehicleTypes = [
    { value: 'auto', label: 'Auto Rickshaw', seats: 3, icon: '🛺' },
    { value: 'sedan', label: 'Sedan', seats: 4, icon: '🚗' },
    { value: 'suv', label: 'SUV', seats: 6, icon: '🚙' },
    { value: 'luxury', label: 'Luxury', seats: 4, icon: '🚘' },
    { value: 'tempo', label: 'Tempo Traveller', seats: 12, icon: '🚐' },
  ];

  const currentVehicle = vehicleTypes.find(v => v.value === driver.vehicle_type);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile | Driver Dashboard | Maa Saraswati Travels</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/driver/dashboard" className="text-2xl hover:text-orange-500">←</Link>
            <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white text-center">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xl font-bold">{driver.rating || 'New'}</div>
              <div className="text-xs opacity-80">Rating</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white text-center">
              <div className="text-2xl mb-1">🚕</div>
              <div className="text-xl font-bold">{driver.total_trips || 0}</div>
              <div className="text-xs opacity-80">Total Trips</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white text-center">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xl font-bold">₹{driver.earnings || 0}</div>
              <div className="text-xs opacity-80">Total Earnings</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={driver.vehicle_type}
                    onChange={(e) => {
                      const selected = vehicleTypes.find(v => v.value === e.target.value);
                      setDriver({ 
                        ...driver, 
                        vehicle_type: e.target.value,
                        seating_capacity: selected?.seats || 4
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map(v => (
                      <option key={v.value} value={v.value}>{v.icon} {v.label} ({v.seats} seats)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    placeholder="e.g., Toyota Innova, Maruti Suzuki Swift"
                    value={driver.vehicle_model}
                    onChange={(e) => setDriver({ ...driver, vehicle_model: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g., MP09 AB 1234"
                    value={driver.vehicle_number}
                    onChange={(e) => setDriver({ ...driver, vehicle_number: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Color</label>
                  <input
                    type="text"
                    placeholder="e.g., White, Black, Silver"
                    value={driver.vehicle_color}
                    onChange={(e) => setDriver({ ...driver, vehicle_color: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    placeholder="e.g., DL-1234567890"
                    value={driver.license_number}
                    onChange={(e) => setDriver({ ...driver, license_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="ac_available"
                    checked={driver.ac_available}
                    onChange={(e) => setDriver({ ...driver, ac_available: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="ac_available" className="text-sm text-gray-700">AC Available</label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}