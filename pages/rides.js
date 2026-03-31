import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      let query = supabase
        .from('rides')
        .select(`
          *,
          user:user_id (full_name, email, phone),
          driver:driver_id (full_name, email, phone, vehicle_number)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      setRides(data || []);
      setLoading(false);
    };

    fetchRides();
  }, [filter]);

  const updateRideStatus = async (rideId, newStatus) => {
    const { error } = await supabase
      .from('rides')
      .update({ status: newStatus })
      .eq('id', rideId);
    
    if (!error) {
      const fetchRides = async () => {
        let query = supabase
          .from('rides')
          .select(`
            *,
            user:user_id (full_name, email, phone),
            driver:driver_id (full_name, email, phone, vehicle_number)
          `)
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data } = await query;
        setRides(data || []);
      };
      await fetchRides();
      setShowModal(false);
      setToast({ message: `Ride status updated to ${newStatus}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      arrived: 'bg-purple-100 text-purple-800',
      started: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const refreshRides = async () => {
    setLoading(true);
    let query = supabase
      .from('rides')
      .select(`
        *,
        user:user_id (full_name, email, phone),
        driver:driver_id (full_name, email, phone, vehicle_number)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setRides(data || []);
    setLoading(false);
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
          <h1 className="text-3xl font-bold">Ride Management</h1>
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Rides</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={refreshRides}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rides.map((ride) => (
                  <tr key={ride.id}>
                    <td className="px-6 py-4 text-sm font-mono">{ride.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{ride.user?.full_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{ride.user?.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{ride.driver?.full_name || 'Not assigned'}</div>
                      <div className="text-xs text-gray-500">{ride.driver?.vehicle_number || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">₹{ride.fare}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ride.status)}`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{ride.payment_method}</div>
                      <div className={`text-xs ${ride.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                        {ride.payment_status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedRide(ride);
                          setShowModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ride Details">
          {selectedRide && (
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Ride Information</h3>
                  <p><strong>Ride ID:</strong> {selectedRide.id}</p>
                  <p><strong>Status:</strong> {selectedRide.status}</p>
                  <p><strong>Fare:</strong> ₹{selectedRide.fare}</p>
                  <p><strong>Distance:</strong> {selectedRide.distance} km</p>
                  <p><strong>Vehicle Type:</strong> {selectedRide.vehicle_type}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Pickup Location</h3>
                  <p className="text-sm text-gray-600">{selectedRide.pickup_address}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Drop Location</h3>
                  <p className="text-sm text-gray-600">{selectedRide.drop_address}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Timing</h3>
                  <p><strong>Created:</strong> {new Date(selectedRide.created_at).toLocaleString()}</p>
                  {selectedRide.started_at && <p><strong>Started:</strong> {new Date(selectedRide.started_at).toLocaleString()}</p>}
                  {selectedRide.completed_at && <p><strong>Completed:</strong> {new Date(selectedRide.completed_at).toLocaleString()}</p>}
                </div>
                {selectedRide.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => updateRideStatus(selectedRide.id, 'cancelled')}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Cancel Ride
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}