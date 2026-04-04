import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

export default function DriverVehicle() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState({
    vehicle_type: '',
    vehicle_model: '',
    vehicle_number: '',
    license_number: '',
    vehicle_color: '',
    seating_capacity: 4,
    ac_available: true,
  });
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState({
    rc_book: null,
    insurance: null,
    pollution_certificate: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/driver/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'driver') {
        await supabase.auth.signOut();
        router.replace('/driver/login');
        return;
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (driverData) {
        setVehicle({
          vehicle_type: driverData.vehicle_type || '',
          vehicle_model: driverData.vehicle_model || '',
          vehicle_number: driverData.vehicle_number || '',
          license_number: driverData.license_number || '',
          vehicle_color: driverData.vehicle_color || '',
          seating_capacity: driverData.seating_capacity || 4,
          ac_available: driverData.ac_available !== false,
        });
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!vehicle.vehicle_type || !vehicle.vehicle_number || !vehicle.license_number) {
      toast.error('Please fill all required fields');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('drivers')
      .update({
        vehicle_type: vehicle.vehicle_type,
        vehicle_model: vehicle.vehicle_model,
        vehicle_number: vehicle.vehicle_number,
        license_number: vehicle.license_number,
        vehicle_color: vehicle.vehicle_color,
        seating_capacity: vehicle.seating_capacity,
        ac_available: vehicle.ac_available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Update error:', error);
      toast.error('Failed to update vehicle details');
    } else {
      toast.success('Vehicle details updated');
    }

    setSaving(false);
  };

  const vehicleTypes = [
    { value: 'bike', label: 'Bike', seats: 1, icon: '🏍️', rate: '₹8/km' },
    { value: 'auto', label: 'Auto Rickshaw', seats: 3, icon: '🛺', rate: '₹12/km' },
    { value: 'sedan', label: 'Sedan', seats: 4, icon: '🚗', rate: '₹15/km' },
    { value: 'suv', label: 'SUV', seats: 6, icon: '🚙', rate: '₹20/km' },
    { value: 'luxury', label: 'Luxury', seats: 4, icon: '🚘', rate: '₹30/km' },
    { value: 'tempo', label: 'Tempo Traveller', seats: 12, icon: '🚐', rate: '₹25/km' },
  ];

  const currentVehicle = vehicleTypes.find(v => v.value === vehicle.vehicle_type);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vehicle Details | Driver Dashboard | Maa Saraswati Travels</title>
      </Head>

      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <header className={`shadow-md sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/driver/dashboard" className={`text-2xl hover:text-orange-500 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>←</Link>
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Vehicle Details</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className={`rounded-xl shadow p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="text-7xl mb-3">
                {currentVehicle?.icon || '🚙'}
              </div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {vehicle.vehicle_model || 'Vehicle Not Added'}
              </h2>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{vehicle.vehicle_number || 'No number added'}</p>
              {currentVehicle && (
                <div className="mt-2 inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-sm">
                  {currentVehicle.label} • {currentVehicle.rate}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Vehicle Type *</label>
                <select
                  value={vehicle.vehicle_type}
                  onChange={(e) => {
                    const selected = vehicleTypes.find(v => v.value === e.target.value);
                    setVehicle({ 
                      ...vehicle, 
                      vehicle_type: e.target.value,
                      seating_capacity: selected?.seats || 4
                    });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Select Vehicle Type</option>
                  {vehicleTypes.map(v => (
                    <option key={v.value} value={v.value}>{v.icon} {v.label} ({v.seats} seats) - {v.rate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Vehicle Model</label>
                <input
                  type="text"
                  placeholder="e.g., Toyota Innova, Maruti Suzuki Swift"
                  value={vehicle.vehicle_model}
                  onChange={(e) => setVehicle({ ...vehicle, vehicle_model: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Vehicle Number *</label>
                <input
                  type="text"
                  placeholder="e.g., MP09 AB 1234"
                  value={vehicle.vehicle_number}
                  onChange={(e) => setVehicle({ ...vehicle, vehicle_number: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 uppercase ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Vehicle Color</label>
                <input
                  type="text"
                  placeholder="e.g., White, Black, Silver"
                  value={vehicle.vehicle_color}
                  onChange={(e) => setVehicle({ ...vehicle, vehicle_color: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={vehicle.seating_capacity}
                  onChange={(e) => setVehicle({ ...vehicle, seating_capacity: parseInt(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>License Number *</label>
                <input
                  type="text"
                  placeholder="e.g., DL-1234567890"
                  value={vehicle.license_number}
                  onChange={(e) => setVehicle({ ...vehicle, license_number: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ac_available"
                  checked={vehicle.ac_available}
                  onChange={(e) => setVehicle({ ...vehicle, ac_available: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="ac_available" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>AC Available</label>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-400 flex items-start gap-2">
                <span>⚠️</span>
                <span>Please ensure all details are correct. This information will be verified by admin before approval.</span>
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving...' : 'Save Vehicle Details'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}