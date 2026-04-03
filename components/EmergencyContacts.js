// components/EmergencyContacts.js - CREATE NEW FILE
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function EmergencyContacts({ userId }) {
  const [contacts, setContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  useEffect(() => {
    if (userId) {
      fetchContacts();
    }
  }, [userId]);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId);
    
    setContacts(data || []);
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Please enter name and phone number');
      return;
    }

    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: userId,
        name: newContact.name,
        phone: newContact.phone,
        relation: newContact.relation,
        created_at: new Date().toISOString()
      });

    if (!error) {
      toast.success('Emergency contact added');
      setShowAddModal(false);
      setNewContact({ name: '', phone: '', relation: '' });
      fetchContacts();
    }
  };

  const deleteContact = async (id) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Contact removed');
      fetchContacts();
    }
  };

  const sendSOSToContacts = async (rideDetails) => {
    for (const contact of contacts) {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contact.phone,
          message: `🚨 EMERGENCY! ${contact.name}, I need help. My ride: ${rideDetails.pickup} to ${rideDetails.drop}. Track: ${window.location.href}`
        })
      });
    }
    toast.success('SOS sent to all emergency contacts');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🆘</span> Emergency Contacts
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
        >
          + Add
        </button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No emergency contacts added. Add now for safety!
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-semibold">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.phone} • {contact.relation}</p>
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="text-red-500"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <button
          onClick={() => sendSOSToContacts({ pickup: 'Current Location', drop: 'Destination' })}
          className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
        >
          🚨 Send SOS to All Contacts
        </button>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold mb-4">Add Emergency Contact</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={newContact.relation}
                onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Relation</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Friend">Friend</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={addContact}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg"
                >
                  Add Contact
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}