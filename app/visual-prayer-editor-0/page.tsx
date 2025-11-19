'use client';

import { useState, useEffect } from 'react';
import Button from '#/ui/button';
import { getPrayersList, getPrayerData, savePrayerData, type Prayer, type PrayerData, type WordMapping } from './actions';

export default function VisualPrayerEditor() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>('');
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showJson, setShowJson] = useState(false);

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

  const addWordMapping = () => {
    if (!prayerData) return;
    const keys = Object.keys(prayerData['Word Mappings']);
    const maxKey = keys.length > 0 ? Math.max(...keys.map(k => parseInt(k) || 0)) : -1;
    const newKey = (maxKey + 1).toString();

    setPrayerData({
      ...prayerData,
      'Word Mappings': {
        ...prayerData['Word Mappings'],
        [newKey]: {
          hebrew: '',
          english: '',
          transliteration: '',
          'detailed-array': [[0, [0, 1]]],
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Word Mappings</h2>
              <Button onClick={addWordMapping}>Add Word Mapping</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-300 font-medium">Key</th>
                    <th className="text-left p-2 text-gray-300 font-medium">Hebrew</th>
                    <th className="text-left p-2 text-gray-300 font-medium">English</th>
                    <th className="text-left p-2 text-gray-300 font-medium">Transliteration</th>
                    <th className="text-left p-2 text-gray-300 font-medium">Detailed Array</th>
                    <th className="text-left p-2 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(prayerData['Word Mappings'])
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([key, mapping]) => (
                      <tr key={key} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="p-2 text-gray-400 font-mono text-sm">{key}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={mapping.hebrew}
                            onChange={(e) => updateWordMapping(key, 'hebrew', e.target.value)}
                            className="w-full rounded border border-gray-600 bg-gray-900 text-white p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            dir="rtl"
                          />
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
                            value={JSON.stringify(mapping['detailed-array'])}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                updateWordMapping(key, 'detailed-array', parsed);
                              } catch {
                                // Invalid JSON, ignore
                              }
                            }}
                            className="w-full rounded border border-gray-600 bg-gray-900 text-white p-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="[[0,[0,1]]]"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            kind="error"
                            onClick={() => deleteWordMapping(key)}
                            className="text-xs"
                          >
                            Delete
                          </Button>
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
                      .map(([key, mapping], index) => (
                        <span
                          key={key}
                          className="font-medium"
                        >
                          {mapping.english || '(empty)'}
                        </span>
                      ))}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Transliteration</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping], index) => (
                        <span
                          key={key}
                          className="font-medium"
                        >
                          {mapping.transliteration || '(empty)'}
                        </span>
                      ))}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden text-right">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Hebrew</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed justify-end" dir="rtl">
                    {Object.entries(prayerData['Word Mappings'])
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([key, mapping], index) => (
                        <span
                          key={key}
                          className="font-medium"
                        >
                          {mapping.hebrew || '(empty)'}
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
    </div>
  );
}
