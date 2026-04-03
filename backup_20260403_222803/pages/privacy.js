import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Privacy Policy</h1>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">Information We Collect</h2>
              <p className="text-gray-600">We collect personal information such as name, email, phone number, and location data necessary for providing our taxi services.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">How We Use Your Information</h2>
              <p className="text-gray-600">Your information is used to process bookings, communicate ride details, improve our services, and ensure your safety during rides.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">Data Security</h2>
              <p className="text-gray-600">We implement industry-standard security measures to protect your personal information from unauthorized access.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">Third-Party Sharing</h2>
              <p className="text-gray-600">We do not sell or share your personal information with third parties except as necessary to provide our services or as required by law.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">Your Rights</h2>
              <p className="text-gray-600">You may request access to, correction of, or deletion of your personal information by contacting our support team.</p>
            </div>

            <div className="border-t pt-6 text-center text-gray-500 text-sm">
              <p>Last updated: January 1, 2024</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}