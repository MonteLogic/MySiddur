'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '#/ui/button';
import Modal from '#/ui/modal';
import { ChevronDown } from 'lucide-react';
import { getPrayersList, getPrayerData, savePrayerData, type Prayer, type PrayerData, type WordMapping } from './actions';

export default function VisualPrayerEditor() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>('');
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showJson, setShowJson] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewingMapping, setViewingMapping] = useState<{ key: string; mapping: WordMapping } | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Load list of prayers on mount
  useEffect(() => {
    loadPrayers();
  }, []);

  // Load prayer data when selection changes
  useEffect(() => {
    if (selectedPrayerId) {
      loadPrayer(selectedPrayerId);
    } else {
      setPrayerData(null);
    }
  }, [selectedPrayerId]);

  const loadPrayers = async () => {
    try {
      const prayersList = await getPrayersList();
      setPrayers(prayersList);
    } catch (error) {
      console.error('Failed to load prayers:', error);
    }
  };

  const loadPrayer = async (prayerId: string) => {
    setLoading(true);
    try {
      const data = await getPrayerData(prayerId);
      setPrayerData(data);
    } catch (error) {
      console.error('Failed to load prayer:', error);
      setPrayerData(null);
    } finally {
      setLoading(false);
    }
  };

  const savePrayer = async () => {
    if (!prayerData || !selectedPrayerId) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      const result = await savePrayerData(selectedPrayerId, prayerData);
      
      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save prayer:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const downloadJSON = () => {
    if (!prayerData) return;
    
    const jsonString = JSON.stringify(prayerData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPrayerId}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadPDF = async () => {
    if (!prayerData || !selectedPrayerId) return;
    
    try {
      const siddurParams = new URLSearchParams({
        date: new Date().toISOString(),
        style: 'all-transliterated',
      });
      const generateSiddurUrl = `/api/generate-basic-siddur?${siddurParams.toString()}&format=NusachAshkenaz`;
      
      const response = await fetch(generateSiddurUrl);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPrayerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const updatePrayerField = (field: keyof PrayerData, value: string) => {
    if (!prayerData) return;
    setPrayerData({
      ...prayerData,
      [field]: value,
    });
  };

  const updateWordMapping = (key: string, field: keyof WordMapping, value: string | Array<[number, number | number[]]>) => {
    if (!prayerData) return;
    setPrayerData({
      ...prayerData,
      'Word Mappings': {
        ...prayerData['Word Mappings'],
        [key]: {
          ...prayerData['Word Mappings'][key],
          [field]: value,
        },
      },
    });
  };


  const deleteWordMapping = (key: string) => {
    if (!prayerData) return;
    const newMappings = { ...prayerData['Word Mappings'] };
    delete newMappings[key];
    setPrayerData({
      ...prayerData,
      'Word Mappings': newMappings,
    });
  };

  const getFullJson = (): string => {
    if (!prayerData) return '';
    return JSON.stringify(prayerData, null, 2);
  };

  // Calculate color index for a mapping key
  const getColorIndex = (key: string): number => {
    if (!prayerData) return 0;
    const sortedKeys = Object.keys(prayerData['Word Mappings']).sort((a, b) => parseInt(a) - parseInt(b));
    return sortedKeys.indexOf(key);
  };

  // Get PDF color for a mapping
  const getPDFColor = (key: string): string => {
    const colors = [
      '#CC0000', // red [0.8, 0.0, 0.0]
      '#008000', // green [0.0, 0.5, 0.0]
      '#0000CC', // blue [0.0, 0.0, 0.8]
      '#CC8000', // orange [0.8, 0.5, 0.0]
      '#800080', // purple [0.5, 0.0, 0.5]
      '#008080', // teal [0.0, 0.5, 0.5]
    ];
    const index = getColorIndex(key);
    return colors[index % colors.length];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      });
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdown]);

  return (
    <div className="w-full text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Visual Prayer Editor</h1>
      </div>

      {/* Prayer Selection */}
      <div className="mb-6">
        <label htmlFor="prayer-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select Prayer
        </label>
        <select
          id="prayer-select"
          value={selectedPrayerId}
          onChange={(e) => setSelectedPrayerId(e.target.value)}
          className="block w-full max-w-md rounded-md border border-gray-700 bg-gray-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">-- Select a prayer --</option>
          {prayers.map((prayer) => (
            <option key={prayer.id} value={prayer.id}>
              {prayer.id} - {prayer.title}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-gray-400 mb-4">Loading prayer...</div>
      )}

      {prayerData && !loading && (
        <div className="space-y-6">
          {/* Save and Download Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button onClick={savePrayer} disabled={saving}>
              {saving ? 'Saving...' : 'Save Prayer'}
            </Button>
            {saveStatus === 'success' && (
              <span className="text-green-400">✓ Saved successfully!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400">✗ Failed to save</span>
            )}
            <Button onClick={() => setShowJson(!showJson)}>
              {showJson ? 'Hide JSON' : 'Show JSON'}
            </Button>
            <div className="flex gap-3 ml-auto">
              <Button 
                onClick={downloadPDF}
                className="bg-blue-800/30 border-blue-700 text-blue-400 hover:bg-blue-700/40"
              >
                Download PDF
              </Button>
              <Button 
                onClick={downloadJSON}
                className="bg-green-800/30 border-green-700 text-green-400 hover:bg-green-700/40 font-bold text-lg px-6 py-3"
              >
                Download JSON
              </Button>
            </div>
          </div>

          {/* JSON Preview */}
          {showJson && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <pre className="text-sm text-gray-300 overflow-x-auto">
                {getFullJson()}
              </pre>
            </div>
          )}

          {/* Prayer Metadata */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Prayer Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prayer Title
                </label>
                <input
                  type="text"
                  value={prayerData['prayer-title']}
                  onChange={(e) => updatePrayerField('prayer-title', e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prayer ID
                </label>
                <input
                  type="text"
                  value={prayerData['prayer-id']}
                  onChange={(e) => updatePrayerField('prayer-id', e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={prayerData.version}
                  onChange={(e) => updatePrayerField('version', e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date Modified
                </label>
                <input
                  type="text"
                  value={prayerData.date_modified}
                  disabled
                  className="w-full rounded-md border border-gray-700 bg-gray-700 text-gray-400 p-2 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Introduction
                </label>
                <textarea
                  value={prayerData.Introduction || ''}
                  onChange={(e) => updatePrayerField('Introduction', e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instruction
                </label>
                <textarea
                  value={prayerData.Instruction || ''}
                  onChange={(e) => updatePrayerField('Instruction', e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {prayerData['link-to-prayer'] !== undefined && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Link to Prayer
                  </label>
                  <input
                    type="text"
                    value={prayerData['link-to-prayer'] || ''}
                    onChange={(e) => updatePrayerField('link-to-prayer', e.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-gray-900 text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Word Mappings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Word Mappings</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-300 font-medium"></th>
                    <th className="text-left p-2 text-gray-300 font-medium">English</th>
                    <th className="text-left p-2 text-gray-300 font-medium">Transliteration</th>
                    <th className="text-left p-2 text-gray-300 font-medium">Hebrew</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(prayerData['Word Mappings'])
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([key, mapping]) => (
                      <tr key={key} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="p-2">
                          <div className="relative" ref={(el) => { dropdownRefs.current[key] = el; }}>
                            <button
                              onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              aria-label="View options"
                            >
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </button>
                            {openDropdown === key && (
                              <div className="absolute left-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    setViewingMapping({ key, mapping });
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-t-md"
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={mapping.english}
                            onChange={(e) => updateWordMapping(key, 'english', e.target.value)}
                            className="w-full rounded border border-gray-600 bg-gray-900 text-white p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={mapping.transliteration}
                            onChange={(e) => updateWordMapping(key, 'transliteration', e.target.value)}
                            className="w-full rounded border border-gray-600 bg-gray-900 text-white p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={mapping.hebrew}
                            readOnly
                            disabled
                            className="w-full rounded border border-gray-600 bg-gray-700 text-gray-400 p-1 text-sm cursor-not-allowed"
                            dir="rtl"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Preview - Fixed order: English, Transliteration, Hebrew */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Real-time Preview</h2>
            <div className="bg-white rounded p-4 md:p-6 shadow-lg">
              <div className="grid grid-cols-3 gap-3 md:gap-4 text-sm">
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">English</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping]) => (
                        mapping.english && mapping.english.split(/( )/).map((word, idx) => (
                          word.trim() && (
                            <span
                              key={`${key}-${idx}`}
                              style={{ color: getPDFColor(key) }}
                              className="font-medium"
                            >
                              {word}
                            </span>
                          )
                        ))
                      ))}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Transliteration</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping]) => (
                        (mapping.transliteration || '').split(/( )/).map((word, idx) => (
                          word.trim() && (
                            <span
                              key={`${key}-${idx}`}
                              style={{ color: getPDFColor(key) }}
                              className="font-medium"
                            >
                              {word}
                            </span>
                          )
                        ))
                      ))}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden text-right">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Hebrew</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed justify-end" dir="rtl">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping]) => (
                        <span
                          key={key}
                          style={{ color: getPDFColor(key) }}
                          className="font-medium"
                        >
                          {mapping.hebrew || ''}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!prayerData && !loading && selectedPrayerId && (
        <div className="text-gray-400">No prayer data available</div>
      )}

      {/* PDF Preview Modal */}
      <Modal
        isOpen={viewingMapping !== null && prayerData !== null}
        onClose={() => setViewingMapping(null)}
        maxWidth="max-w-5xl"
        className="bg-transparent p-0"
      >
        {viewingMapping && prayerData && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">PDF Preview - Context around Mapping {viewingMapping.key}</h2>
              <button
                onClick={() => setViewingMapping(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="bg-white rounded p-4 md:p-6 shadow-lg mb-4">
              <div className="grid grid-cols-3 gap-3 md:gap-4 text-sm">
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">English</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping]) => {
                        const isSelected = key === viewingMapping.key;
                        return (
                          <span
                            key={key}
                            style={{ 
                              color: getPDFColor(key),
                              backgroundColor: isSelected ? 'rgba(255, 255, 0, 0.2)' : 'transparent',
                              padding: isSelected ? '2px 4px' : '0',
                              borderRadius: isSelected ? '3px' : '0',
                              border: isSelected ? '1px solid rgba(255, 255, 0, 0.5)' : 'none'
                            }}
                            className="font-medium"
                            title={isSelected ? `Selected: Key ${key}` : `Key ${key}`}
                          >
                            {mapping.english ? (
                              mapping.english.split(/( )/).map((word, idx) => (
                                word.trim() && <span key={idx}>{word}</span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">(empty)</span>
                            )}
                          </span>
                        );
                      })}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Transliteration</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping]) => {
                        const isSelected = key === viewingMapping.key;
                        return (
                          <span
                            key={key}
                            style={{ 
                              color: getPDFColor(key),
                              backgroundColor: isSelected ? 'rgba(255, 255, 0, 0.2)' : 'transparent',
                              padding: isSelected ? '2px 4px' : '0',
                              borderRadius: isSelected ? '3px' : '0',
                              border: isSelected ? '1px solid rgba(255, 255, 0, 0.5)' : 'none'
                            }}
                            className="font-medium"
                            title={isSelected ? `Selected: Key ${key}` : `Key ${key}`}
                          >
                            {mapping.transliteration ? (
                              mapping.transliteration.split(/( )/).map((word, idx) => (
                                word.trim() && <span key={idx}>{word}</span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">(empty)</span>
                            )}
                          </span>
                        );
                      })}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden text-right">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Hebrew</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed justify-end" dir="rtl">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping]) => {
                        const isSelected = key === viewingMapping.key;
                        return (
                          <span
                            key={key}
                            style={{ 
                              color: getPDFColor(key),
                              backgroundColor: isSelected ? 'rgba(255, 255, 0, 0.2)' : 'transparent',
                              padding: isSelected ? '2px 4px' : '0',
                              borderRadius: isSelected ? '3px' : '0',
                              border: isSelected ? '1px solid rgba(255, 255, 0, 0.5)' : 'none'
                            }}
                            className="font-medium"
                            title={isSelected ? `Selected: Key ${key}` : `Key ${key}`}
                          >
                            {mapping.hebrew || <span className="text-gray-400 italic">(empty)</span>}
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-2">
              <p><strong>Selected Mapping Key:</strong> {viewingMapping.key}</p>
              <p><strong>Color:</strong> <span style={{ color: getPDFColor(viewingMapping.key) }}>●</span> {getPDFColor(viewingMapping.key)}</p>
              <p><strong>Detailed Array:</strong> {JSON.stringify(viewingMapping.mapping['detailed-array'])}</p>
              <p className="text-yellow-400 mt-3">💡 The highlighted phrase shows how it appears in context with surrounding phrases in the PDF</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
