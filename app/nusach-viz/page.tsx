import Link from 'next/link';
import ashPrayerInfo from 'prayer/prayer-content/ashkenazi-prayer-info.json';
import { FAQAccordion } from '#/ui/components/faq-accordion';

export default async function Page() {
  const otherNusachs = [
    { name: 'Sephardic', summary: 'Used by Sephardic Jews, originating from Spain, Portugal, and the Middle East.' },
    { name: 'Chassidic', summary: 'Used by Chassidic communities, with variations based on different Chassidic dynasties.' },
    { name: 'Yemenite', summary: 'Used by Yemenite Jews, preserving ancient traditions and customs.' },
    { name: 'Italian', summary: 'Used by Italian Jews, with unique liturgical traditions.' },
  ];

  return (
    <div className="w-full text-white space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Prayer Order (Nusach) Information</h1>
        <Link 
          href="/" 
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="space-y-6">
        {/* Ashkenazi Nusach Section */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Ashkenazi Nusach</h2>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Prayer Order in Your PDF</h3>
              <p className="text-gray-300 text-sm mb-4">
                The following is the order of prayers that are compiled into the PDF generated on the home page:
              </p>
              
              <div className="space-y-3">
                {Object.entries(ashPrayerInfo.services).map(([serviceKey, service]) => (
                  <div key={serviceKey} className="bg-gray-700/30 rounded-lg border border-gray-600/50 overflow-hidden">
                    <FAQAccordion question={service['display-name']} variant="nested">
                      <div className="space-y-3">
                        {service.sections && service.sections.map((section: any, sectionIndex: number) => (
                          <div key={sectionIndex} className="bg-gray-800/50 rounded border border-gray-700/50 overflow-hidden">
                            <FAQAccordion question={section.sectionTitle} variant="nested">
                              <div className="space-y-3">
                                {section.description && (
                                  <p className="text-gray-400 text-sm italic">
                                    {section.description}
                                  </p>
                                )}
                                {section.prayers && (
                                  <ul className="list-disc list-inside space-y-1.5 ml-2">
                                    {section.prayers.map((prayer: any, prayerIndex: number) => (
                                      <li key={prayerIndex} className="text-gray-300 text-sm">
                                        {prayer.title}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </FAQAccordion>
                          </div>
                        ))}
                      </div>
                    </FAQAccordion>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Other Versions Section */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Other Versions (Nusachs)</h2>
          
          <div className="mb-6">
            <FAQAccordion question="What is a Nusach?">
              <p>
                A nusach (נוסח) is a traditional prayer order and liturgical text 
                that determines the sequence, wording, and structure of prayers. Different Jewish communities have developed their own 
                nusach over centuries, each reflecting their unique historical and cultural traditions.
              </p>
              <p>
                The <strong className="text-white">Recommended</strong> prayer order is <strong className="text-white">Ashkenazi order</strong> (nusach), 
                which is the traditional prayer order used by Ashkenazi Jews, originating from Central and Eastern Europe. 
                This is the nusach we currently offer in our system.
              </p>
            </FAQAccordion>
          </div>

          <p className="text-gray-300 text-sm mb-4">
            Currently, we only offer Ashkenazi order (nusach) in our system. The following are other nusachs that exist:
          </p>
          <div className="space-y-3">
            {otherNusachs.map((nusach) => (
              <div key={nusach.name} className="border-b border-gray-700 pb-3 last:border-b-0">
                <h3 className="font-semibold text-base mb-1 text-gray-200">{nusach.name}</h3>
                <p className="text-gray-400 text-sm">{nusach.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
