import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent! We will contact you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Contact Us | Maa Saraswati Travels</title>
        <meta name="description" content="Contact Maa Saraswati Travels for taxi bookings, support, and inquiries. Call us 24/7 at +91 98765 43210 or email support@maasaraswatitravels.com" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Contact Us</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-orange-600">Get in Touch</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="w-full p-3 border rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full p-3 border rounded-lg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  required
                  className="w-full p-3 border rounded-lg"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <textarea
                  placeholder="Your Message"
                  rows="4"
                  required
                  className="w-full p-3 border rounded-lg"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-orange-600">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📞</span>
                    <div><strong>Phone</strong><p className="text-gray-600">+91 98765 43210</p><p className="text-gray-600">+91 98765 43211</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✉️</span>
                    <div><strong>Email</strong><p className="text-gray-600">support@maasaraswatitravels.com</p><p className="text-gray-600">bookings@maasaraswatitravels.com</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div><strong>Office Address</strong><p className="text-gray-600">Maa Saraswati Travels,<br />Sector 18, Noida,<br />Uttar Pradesh - 201301</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🕐</span>
                    <div><strong>Business Hours</strong><p className="text-gray-600">24/7 - Always Open</p></div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-2xl shadow-lg p-8 text-center">
                <h3 className="text-xl font-bold mb-2">Need Urgent Help?</h3>
                <p className="text-gray-600 mb-4">Call our 24/7 support line</p>
                <a href="tel:+919876543210" className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600">📞 Call Now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}