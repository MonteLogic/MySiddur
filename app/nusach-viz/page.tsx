import Link from 'next/link';

export default async function Page() {
  const prayerOrders = [
    { name: 'Ashkenazi', description: 'The traditional prayer order used by Ashkenazi Jews, originating from Central and Eastern Europe.' },
    { name: 'Sephardic', description: 'The prayer order used by Sephardic Jews, originating from Spain, Portugal, and the Middle East.' },
    { name: 'Chassidic', description: 'The prayer order used by Chassidic communities, with variations based on different Chassidic dynasties.' },
    { name: 'Yemenite', description: 'The prayer order used by Yemenite Jews, preserving ancient traditions and customs.' },
    { name: 'Italian', description: 'The prayer order used by Italian Jews, with unique liturgical traditions.' },
  ];

  return (
    <div className="relative z-0 space-y-10 text-white min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-5 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Prayer Order (Nusach) Information</h1>
            <Link 
              href="/" 
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">Recommended Prayer Order</h2>
            <p className="text-gray-300 mb-2">
              The <strong className="text-white">Recommended</strong> prayer order is <strong className="text-white">Ashkenazi order</strong> (nusach).
            </p>
            <p className="text-gray-300">
              This is the default prayer order we recommend and is the one currently available in our system.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Available Prayer Orders</h2>
            <div className="space-y-4">
              {prayerOrders.map((order) => (
                <div key={order.name} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-lg mb-1">{order.name}</h3>
                  <p className="text-gray-300 text-sm">{order.description}</p>
                  {order.name === 'Ashkenazi' && (
                    <p className="text-blue-400 text-sm mt-2 font-medium">
                      ✓ Currently available
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-900/20 rounded-lg p-6 border border-yellow-800">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">Current Availability</h2>
            <p className="text-gray-300">
              <strong className="text-white">Currently, we only offer Ashkenazi order (nusach)</strong> in our system. 
              The other prayer orders listed above are not yet available, but we are working to expand our offerings 
              to include additional nusach options in the future.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
