'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import strings from '#/strings.json';

export default function LandingPage() {
  const { user, isLoaded } = useUser();
  const [selectedStyle, setSelectedStyle] = useState('sentence-based-mapping');
  const [printBlackAndWhite, setPrintBlackAndWhite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const publicMetadata = user.publicMetadata as any || {};
      setPrintBlackAndWhite(publicMetadata?.printBlackAndWhite ?? false);
    }
  }, [isLoaded, user]);

  const handleBlackAndWhiteToggle = async (checked: boolean) => {
    setPrintBlackAndWhite(checked);

    if (user) {
      setIsSaving(true);
      try {
        await fetch('/api/profile/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printBlackAndWhite: checked }),
        });
        await user.reload();
      } catch (error) {
        console.error('Error updating setting:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleGenerateSiddur = async () => {
    setIsGenerating(true);
    try {
      const siddurParams = new URLSearchParams({
        date: new Date().toISOString(),
        style: selectedStyle,
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
      a.download = 'MySiddur.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sampleWords = [
    { english: 'Blessed', transliteration: 'Baruch', hebrew: 'ברוך' },
    { english: 'are', transliteration: 'atah', hebrew: 'אתה' },
    { english: 'You', transliteration: 'Adonai', hebrew: 'ה\'' },
    { english: 'Lord', transliteration: 'Eloheinu', hebrew: 'אלוקינו' },
  ];

  const getWordColor = (index: number) => {
    if (printBlackAndWhite) return '#000000';
    const colors = ['#CC0000', '#008000', '#0000CC', '#CC8000'];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full text-white">
      <div className="text-center mb-8">
        <h1 className="mb-4 text-4xl font-bold">{strings['title']}</h1>
        <p className="mb-8 text-lg text-gray-300">
          Customize your settings and generate your Siddur PDF.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 mb-6">
        <button
          onClick={handleGenerateSiddur}
          disabled={isGenerating}
          className="flex items-center justify-center w-full rounded-lg border border-blue-700 bg-blue-800/30 px-6 py-4 text-lg font-semibold text-blue-400 transition-all duration-150 hover:border-blue-600 hover:bg-blue-700/40 active:scale-95 active:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isGenerating ? (
            <>
              Generating PDF
              <svg
                className="animate-spin ml-2 h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </>
          ) : (
            <>
              Generate Siddur PDF
              <span className="ml-2" aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-5 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-400">Preview</h2>
              <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded border border-yellow-800">
                Sample Only
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              This is a preview of how your PDF will look. The actual PDF will contain your full Siddur content.
            </p>
            
            <div className="bg-white rounded p-4 md:p-6 shadow-lg">
              <div className="grid grid-cols-3 gap-3 md:gap-4 text-sm">
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">English</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {sampleWords.map((word, index) => (
                      <span
                        key={index}
                        style={{ color: getWordColor(index) }}
                        className="font-medium"
                      >
                        {word.english}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Transliteration</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed">
                    {sampleWords.map((word, index) => (
                      <span
                        key={index}
                        style={{ color: getWordColor(index) }}
                        className="font-medium"
                      >
                        {word.transliteration}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col overflow-hidden text-right">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Hebrew</div>
                  <div className="flex flex-wrap gap-x-1 leading-relaxed justify-end" dir="rtl">
                    {sampleWords.map((word, index) => (
                      <span
                        key={index}
                        style={{ color: getWordColor(index) }}
                        className="font-medium"
                      >
                        {word.hebrew}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Color Mode: <strong>{printBlackAndWhite ? 'Black & White' : 'Color'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-lg font-semibold mb-6 text-cyan-400">Settings</h2>
            
            <div className="space-y-6">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex-1 pr-4">
                  <span className="text-sm font-medium text-gray-300 block">Black & White</span>
                  <span className="text-xs text-gray-500 mt-0.5 block">Print without colors</span>
                </div>
                <input
                  type="checkbox"
                  checked={printBlackAndWhite}
                  onChange={(e) => handleBlackAndWhiteToggle(e.target.checked)}
                  disabled={isSaving}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <label htmlFor="style-select" className="block text-sm font-medium text-gray-300">
                    Prayer Style
                  </label>
                  <Link href="/custom-siddur" className="text-xs text-blue-400 hover:text-blue-300 underline whitespace-nowrap">
                    More Settings
                  </Link>
                </div>
                <select
                  id="style-select"
                  value={selectedStyle}
                  disabled
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-3 cursor-not-allowed opacity-75"
                >
                  <option value="sentence-based-mapping">Recommended</option>
                </select>
              </div>

              {isSaving && <p className="text-xs text-gray-500">Saving...</p>}

              {!user && (
                <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                  <Link href="/profile" className="text-blue-400 hover:text-blue-300 underline">
                    Sign in
                  </Link> to save settings
                </p>
              )}
            </div>
          </div>
        </div>

      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 mb-6">
        <button
          onClick={handleGenerateSiddur}
          disabled={isGenerating}
          className="flex items-center justify-center w-full rounded-lg border border-blue-700 bg-blue-800/30 px-6 py-4 text-lg font-semibold text-blue-400 transition-all duration-150 hover:border-blue-600 hover:bg-blue-700/40 active:scale-95 active:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isGenerating ? (
            <>
              Generating PDF
              <svg
                className="animate-spin ml-2 h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </>
          ) : (
            <>
              Generate Siddur PDF
              <span className="ml-2" aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
