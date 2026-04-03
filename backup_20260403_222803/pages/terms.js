import Head from 'next/head';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Terms & Conditions</h1>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">1. Booking Policy</h2>
              <p className="text-gray-600">All bookings are subject to availability. Advance booking is recommended for guaranteed service. Cancellation charges may apply as per policy.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">2. Cancellation Policy</h2>
              <p className="text-gray-600">Free cancellation up to 1 hour before scheduled pickup. Cancellation within 1 hour will incur a cancellation fee of ₹100. No-shows will be charged full fare.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">3. Payment Terms</h2>
              <p className="text-gray-600">Payment can be made via cash, card, or UPI at the time of ride completion. For outstation rides, advance payment may be required.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">4. Driver Conduct</h2>
              <p className="text-gray-600">Our drivers are professional and trained. Any misconduct should be reported immediately to our customer support.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">5. Luggage Policy</h2>
              <p className="text-gray-600">Standard luggage allowance: 1 suitcase per passenger. Extra luggage may incur additional charges.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3 text-orange-600">6. Privacy Policy</h2>
              <p className="text-gray-600">We respect your privacy. Your personal information is used only for booking purposes and will not be shared with third parties.</p>
            </div>

            <div className="border-t pt-6 text-center text-gray-500 text-sm">
              <p>For any questions, please contact our support team.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}