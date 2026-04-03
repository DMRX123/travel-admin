// pages/offline.js
import Head from 'next/head';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <>
      <Head>
        <title>Offline - Maa Saraswati Travels</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You're Offline</h1>
          <p className="text-gray-600 mb-6">Please check your internet connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
          <Link href="/" className="block mt-4 text-orange-500">
            ← Go to Home
          </Link>
        </div>
      </div>
    </>
  );
}