import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Fixed: Moved fetchUsers inside useEffect
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'user')
        .order('created_at', { ascending: false });
      
      setUsers(data || []);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const refreshUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'user')
      .order('created_at', { ascending: false });
    
    setUsers(data || []);
    setLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);
    
    if (!error) {
      await refreshUsers();
      setToast({
        message: `User ${!currentStatus ? 'activated' : 'blocked'} successfully`,
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (!error) {
      await refreshUsers();
      setShowModal(false);
      setToast({
        message: 'User deleted successfully',
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const columns = [
    { header: 'User', key: 'full_name', render: (row) => (
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
          {row.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="ml-3">
          <div className="font-medium text-gray-900">{row.full_name || 'N/A'}</div>
          <div className="text-gray-500 text-sm">{row.email}</div>
        </div>
      </div>
    ) },
    { header: 'Phone', key: 'phone', render: (row) => row.phone || 'N/A' },
    { header: 'Joined', key: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Status', key: 'is_active', render: (row) => (
      <span className={`px-2 py-1 text-xs rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {row.is_active ? 'Active' : 'Blocked'}
      </span>
    ) },
    { header: 'Actions', key: 'actions', render: (row) => (
      <div className="flex space-x-2">
        <button
          onClick={() => toggleUserStatus(row.id, row.is_active)}
          className={`px-3 py-1 text-sm rounded ${row.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
        >
          {row.is_active ? 'Block' : 'Activate'}
        </button>
        <button
          onClick={() => {
            setSelectedUser(row);
            setShowModal(true);
          }}
          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
        >
          Delete
        </button>
      </div>
    ) },
  ];

  return (
    <Layout>
      <div className="p-6">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search users..."
              className="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={refreshUsers}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <Table columns={columns} data={filteredUsers} />
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Delete User">
          <div className="p-4">
            <p className="mb-4">Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>?</p>
            <p className="text-red-600 text-sm mb-4">This action cannot be undone. All ride history will be lost.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(selectedUser?.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}