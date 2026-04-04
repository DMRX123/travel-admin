import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useTheme } from '../context/ThemeContext';

export default function Drivers() {
  const { theme } = useTheme();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchDrivers = async () => {
    setLoading(true);
    let query = supabase
      .from('drivers')
      .select(`
        *,
        profile:driver_id (
          full_name,
          email,
          phone,
          created_at,
          is_active
        )
      `)
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('is_approved', false);
    } else if (filter === 'approved') {
      query = query.eq('is_approved', true);
    } else if (filter === 'verified') {
      query = query.eq('background_check_status', 'approved');
    }

    const { data } = await query;
    setDrivers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDriverDocuments = async (driverId) => {
    const { data } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId);
    setSelectedDocuments(data || []);
  };

  const approveDriver = async (driverId) => {
    const { error } = await supabase
      .from('drivers')
      .update({ 
        is_approved: true,
        background_check_status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', driverId);
    
    if (!error) {
      await fetchDrivers();
      setShowModal(false);
      setToast({ message: 'Driver approved successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      
      // Send notification
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          title: '✅ Application Approved',
          body: 'You can now go online and start accepting rides!',
          data: { type: 'driver_approved' }
        }),
      }).catch(() => {});
    } else {
      setToast({ message: 'Failed to approve driver', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const rejectDriver = async (driverId) => {
    const confirmed = confirm('Are you sure you want to reject this driver?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('drivers')
      .update({
        is_approved: false,
        background_check_status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', driverId);
    
    if (!error) {
      await fetchDrivers();
      setShowModal(false);
      setToast({ message: 'Driver application rejected', type: 'info' });
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({ message: 'Failed to reject driver', type: 'error' });
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

  const verifyDocument = async (documentId) => {
    const { error } = await supabase
      .from('driver_documents')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', documentId);
    
    if (!error) {
      fetchDriverDocuments(selectedDriver?.id);
      setToast({ message: 'Document verified', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusBadge = (driver) => {
    if (!driver.is_approved) {
      return { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    }
    if (driver.background_check_status === 'pending') {
      return { text: 'Background Check Pending', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' };
    }
    if (driver.is_online) {
      return { text: 'Online', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
    }
    return { text: 'Offline', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
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
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Driver Management
          </h1>
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="all">All Drivers</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="verified">Background Verified</option>
            </select>
            <button
              onClick={fetchDrivers}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => {
            const status = getStatusBadge(driver);
            return (
              <div key={driver.id} className={`rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-lg font-bold">
                        {driver.profile?.full_name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {driver.profile?.full_name || 'Unknown'}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {driver.vehicle_type || 'Vehicle not added'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className={`space-y-2 mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="text-sm">
                      <span className="font-semibold">Vehicle:</span> {driver.vehicle_model || 'N/A'} ({driver.vehicle_number || 'N/A'})
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">License:</span> {driver.license_number || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Rating:</span> ⭐ {driver.rating || 'New'} ({driver.total_trips || 0} trips)
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Earnings:</span> ₹{driver.earnings || 0}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Phone:</span> {driver.profile?.phone || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Joined:</span> {driver.created_at ? new Date(driver.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!driver.is_approved ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            fetchDriverDocuments(driver.id);
                            setShowModal(true);
                          }}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => rejectDriver(driver.id)}
                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            fetchDriverDocuments(driver.id);
                            setShowDocumentsModal(true);
                          }}
                          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          Documents
                        </button>
                        <button
                          onClick={() => toggleDriverStatus(driver.id, driver.is_online)}
                          className={`flex-1 px-4 py-2 rounded-lg transition ${
                            driver.is_online
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {driver.is_online ? 'Force Offline' : 'Force Online'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Driver Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Review Driver Application">
          {selectedDriver && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                <p><strong>Name:</strong> {selectedDriver.profile?.full_name}</p>
                <p><strong>Email:</strong> {selectedDriver.profile?.email}</p>
                <p><strong>Phone:</strong> {selectedDriver.profile?.phone}</p>
                <p><strong>Joined:</strong> {selectedDriver.created_at ? new Date(selectedDriver.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Vehicle Information</h3>
                <p><strong>Type:</strong> {selectedDriver.vehicle_type}</p>
                <p><strong>Model:</strong> {selectedDriver.vehicle_model}</p>
                <p><strong>Number:</strong> {selectedDriver.vehicle_number}</p>
                <p><strong>Color:</strong> {selectedDriver.vehicle_color || 'N/A'}</p>
                <p><strong>Seating Capacity:</strong> {selectedDriver.seating_capacity || 4}</p>
                <p><strong>AC Available:</strong> {selectedDriver.ac_available ? 'Yes' : 'No'}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-lg">License Information</h3>
                <p><strong>License Number:</strong> {selectedDriver.license_number}</p>
              </div>
              {selectedDocuments.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">Documents</h3>
                  {selectedDocuments.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center py-2 border-b">
                      <span className="capitalize">{doc.document_type}</span>
                      <span className={`text-sm ${doc.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {doc.is_verified ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => approveDriver(selectedDriver.id)}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectDriver(selectedDriver.id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Documents Modal */}
        <Modal isOpen={showDocumentsModal} onClose={() => setShowDocumentsModal(false)} title="Driver Documents">
          {selectedDriver && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{selectedDriver.profile?.full_name}</h3>
                <p className="text-sm text-gray-500">Vehicle: {selectedDriver.vehicle_number}</p>
              </div>
              <div className="space-y-3">
                {selectedDocuments.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No documents uploaded yet</p>
                ) : (
                  selectedDocuments.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold capitalize">{doc.document_type}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {doc.document_url && (
                            <a 
                              href={doc.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                              View
                            </a>
                          )}
                          {!doc.is_verified && (
                            <button
                              onClick={() => verifyDocument(doc.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Verify
                            </button>
                          )}
                          {doc.is_verified && (
                            <span className="text-green-600 text-sm">✓ Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}