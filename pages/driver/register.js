// pages/driver/register.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

export default function DriverRegister() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicle_type: '',
    vehicle_model: '',
    vehicle_number: '',
    license_number: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.vehicle_type || !formData.vehicle_number || !formData.license_number) {
      toast.error('Please fill all vehicle details');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Registration failed');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          user_type: 'driver',
          is_verified: false,
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      const { error: driverError } = await supabase
        .from('drivers')
        .insert({
          id: authData.user.id,
          vehicle_type: formData.vehicle_type,
          vehicle_model: formData.vehicle_model,
          vehicle_number: formData.vehicle_number.toUpperCase(),
          license_number: formData.license_number.toUpperCase(),
          is_approved: false,
          verification_status: 'pending',
          is_online: false,
          rating: 5.0,
          total_trips: 0,
          earnings: 0,
          created_at: new Date().toISOString(),
        });

      if (driverError) throw driverError;

      toast.success('Registration successful! Awaiting admin approval.');
      setTimeout(() => {
        router.push('/driver/login');
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: 'bike', label: 'Bike', icon: '🏍️' },
    { value: 'auto', label: 'Auto Rickshaw', icon: '🛺' },
    { value: 'sedan', label: 'Sedan', icon: '🚗' },
    { value: 'suv', label: 'SUV', icon: '🚙' },
  ];

  return (
    <>
      <Head>
        <title>Driver Registration | Maa Saraswati Travels</title>
      </Head>

      <div className={`min-h-screen py-8 transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-orange-500 to-red-600'
      }`}>
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl shadow-2xl p-8 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🚗</div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Driver Registration
              </h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Join Maa Saraswati Travels as a Driver
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicle_type"
                    required
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.vehicle_type}
                    onChange={handleChange}
                  >
                    <option value="">Select Vehicle</option>
                    {vehicleTypes.map(v => (
                      <option key={v.value} value={v.value}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vehicle Model *
                  </label>
                  <input
                    type="text"
                    name="vehicle_model"
                    required
                    placeholder="e.g., Honda Activa, Maruti Suzuki"
                    className={`w-full px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.vehicle_model}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicle_number"
                    required
                    placeholder="e.g., MP09 AB 1234"
                    className={`w-full px-4 py-2 rounded-lg uppercase ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300'
                    }`}
                    value={formData.vehicle_number}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Driving License Number *
                </label>
                <input
                  type="text"
                  name="license_number"
                  required
                  placeholder="e.g., DL-1234567890"
                  className={`w-full px-4 py-2 rounded-lg uppercase ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border border-gray-300'
                  }`}
                  value={formData.license_number}
                  onChange={handleChange}
                />
              </div>

              <div className={`p-4 rounded-lg mt-4 ${
                theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-50'
              }`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  ⚠️ After registration, your application will be reviewed by admin. 
                  You will receive notification once approved.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 mt-4"
              >
                {loading ? 'Registering...' : 'Register as Driver'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/driver/login" 
                className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Already have an account? Sign In →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}