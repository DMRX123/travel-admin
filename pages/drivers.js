import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('drivers')
      .select(`
        *,
        profile:driver_id (
          full_name,
          email,
          phone,
          created_at
        )
      `)
      .order('created_at', { ascending: false });
    
    setDrivers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const loadDrivers = async () => {
      await fetchDrivers();
    };
    loadDrivers();
  }, []);

  const approveDriver = async (driverId) => {
    const { error } = await supabase
      .from('drivers')
      .update({ is_approved: true })
      .eq('id', driverId);
    
    if (!error) {
      await fetchDrivers();
      setShowModal(false);
      setToast({ message: 'Driver approved successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const rejectDriver = async (driverId) => {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId);
    
    if (!error) {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', driverId);
      
      await fetchDrivers();
      setShowModal(false);
      setToast({ message: 'Driver application rejected', type: 'info' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleDriverStatus = async (driverId, currentStatus) => {
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: !currentStatus })
      .eq('id', driverId);
    
    if (!error) {
      await fetchDrivers();
      setToast({ message: `Driver ${!currentStatus ? 'online' : 'offline'}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusBadge = (isApproved, isOnline) => {
    if (!isApproved) return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    if (isOnline) return { text: 'Online', color: 'bg-green-100 text-green-800' };
    return { text: 'Offline', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Driver Management</h1>
          <button
            onClick={fetchDrivers}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => {
            const status = getStatusBadge(driver.is_approved, driver.is_online);
            return (
              <div key={driver.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white text-lg font-bold">
                        {driver.profile?.full_name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold">{driver.profile?.full_name || 'Unknown'}</h3>
                        <p className="text-sm text-gray-500">{driver.vehicle_type || 'Vehicle not added'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="font-semibold">Vehicle:</span> {driver.vehicle_model || 'N/A'} ({driver.vehicle_number || 'N/A'})
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">License:</span> {driver.license_number || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Rating:</span> ⭐ {driver.rating} ({driver.total_trips} trips)
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Earnings:</span> ₹{driver.earnings}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!driver.is_approved ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            setShowModal(true);
                          }}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => rejectDriver(driver.id)}
                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleDriverStatus(driver.id, driver.is_online)}
                        className={`flex-1 px-4 py-2 rounded-lg ${
                          driver.is_online
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {driver.is_online ? 'Force Offline' : 'Force Online'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Review Driver Application">
          {selectedDriver && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold">Personal Information</h3>
                <p><strong>Name:</strong> {selectedDriver.profile?.full_name}</p>
                <p><strong>Email:</strong> {selectedDriver.profile?.email}</p>
                <p><strong>Phone:</strong> {selectedDriver.profile?.phone}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Vehicle Information</h3>
                <p><strong>Type:</strong> {selectedDriver.vehicle_type}</p>
                <p><strong>Model:</strong> {selectedDriver.vehicle_model}</p>
                <p><strong>Number:</strong> {selectedDriver.vehicle_number}</p>
                <p><strong>License:</strong> {selectedDriver.license_number}</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => approveDriver(selectedDriver.id)}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectDriver(selectedDriver.id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}