'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import strings from '#/strings.json';

// Sample words for preview
const SAMPLE_WORDS = [
  { english: 'Blessed', transliteration: 'Baruch', hebrew: 'ברוך' },
  { english: 'are', transliteration: 'atah', hebrew: 'אתה' },
  { english: 'You', transliteration: 'Ad-nai', hebrew: 'ה\'' },
  { english: 'Lord', transliteration: 'Eloheinu', hebrew: 'אלוקינו' },
];

const WORD_COLORS = ['#CC0000', '#008000', '#0000CC', '#CC8000'];

// Spinner component for loading states
function LoadingSpinner() {
  return (
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
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Download button component
function DownloadButton({ url }: { url: string }) {
  return (
    <button
      onClick={() => window.open(url, '_blank')}
      className="flex items-center justify-center w-full rounded-lg border border-blue-700 bg-blue-800/30 px-6 py-4 text-lg font-semibold text-blue-400 transition-all duration-150 hover:border-blue-600 hover:bg-blue-700/40 active:scale-95 active:bg-blue-600/50"
    >
      Download Daily Siddur
      <span className="ml-2" aria-hidden="true">↓</span>
    </button>
  );
}

// Generate button component
function GenerateButton({ isGenerating, onGenerate }: { isGenerating: boolean; onGenerate: () => void }) {
  return (
    <button
      onClick={onGenerate}
      disabled={isGenerating}
      className="flex items-center justify-center w-full rounded-lg border border-blue-700 bg-blue-800/30 px-6 py-4 text-lg font-semibold text-blue-400 transition-all duration-150 hover:border-blue-600 hover:bg-blue-700/40 active:scale-95 active:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {isGenerating ? (
        <>Generating PDF<LoadingSpinner /></>
      ) : (
        <>Generate Siddur PDF<span className="ml-2" aria-hidden="true">→</span></>
      )}
    </button>
  );
}

// Preparing message component
function PreparingMessage() {
  return (
    <div className="text-center py-4">
      <p className="text-gray-400">Today's Siddur is being prepared.</p>
      <p className="text-sm text-gray-500 mt-2">Please check back later.</p>
    </div>
  );
}

// PDF Action section - shows download, generate, or preparing based on state
function PdfActionSection({ 
  latestSiddurUrl, 
  isSignedIn, 
  isGenerating, 
  onGenerate 
}: { 
  latestSiddurUrl: string | null; 
  isSignedIn: boolean; 
  isGenerating: boolean; 
  onGenerate: () => void;
}) {
  if (latestSiddurUrl) {
    return <DownloadButton url={latestSiddurUrl} />;
  }
  if (isSignedIn) {
    return <PreparingMessage />;
  }
  return <GenerateButton isGenerating={isGenerating} onGenerate={onGenerate} />;
}

// Preview section component
function PreviewSection({ printBlackAndWhite }: { printBlackAndWhite: boolean }) {
  const getWordColor = (index: number) => 
    printBlackAndWhite ? '#000000' : WORD_COLORS[index % WORD_COLORS.length];

  return (
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
          {(['english', 'transliteration', 'hebrew'] as const).map((type) => (
            <div key={type} className={`flex flex-col overflow-hidden ${type === 'hebrew' ? 'text-right' : ''}`}>
              <div className="text-xs text-gray-600 mb-2 font-semibold capitalize">{type}</div>
              <div className={`flex flex-wrap gap-x-1 leading-relaxed ${type === 'hebrew' ? 'justify-end' : ''}`} dir={type === 'hebrew' ? 'rtl' : 'ltr'}>
                {SAMPLE_WORDS.map((word, index) => (
                  <span key={index} style={{ color: getWordColor(index) }} className="font-medium">
                    {word[type]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Color Mode: <strong>{printBlackAndWhite ? 'Black & White' : 'Color'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings section component
function SettingsSection({ 
  printBlackAndWhite, 
  onToggle, 
  isSaving, 
  isSignedIn,
  selectedStyle
}: { 
  printBlackAndWhite: boolean; 
  onToggle: (checked: boolean) => void; 
  isSaving: boolean; 
  isSignedIn: boolean;
  selectedStyle: string;
}) {
  return (
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
            onChange={(e) => onToggle(e.target.checked)}
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
            <option value="Recommended">Recommended</option>
          </select>
        </div>

        {isSaving && <p className="text-xs text-gray-500">Saving...</p>}

        {!isSignedIn && (
          <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">
            <Link href="/profile" className="text-blue-400 hover:text-blue-300 underline">
              Sign in
            </Link> to save settings
          </p>
        )}
      </div>
    </div>
  );
}

// Main component
export default function LandingPage() {
  const { user, isLoaded } = useUser();
  const [selectedStyle] = useState('Recommended');
  const [printBlackAndWhite, setPrintBlackAndWhite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestSiddurUrl, setLatestSiddurUrl] = useState<string | null>(null);

  // Fetch latest Siddur from blob
  useEffect(() => {
    const fetchLatestSiddur = async () => {
      try {
        const res = await fetch(`/api/siddur/latest?printBlackAndWhite=${printBlackAndWhite}`);
        if (res.ok) {
          const data = await res.json();
          setLatestSiddurUrl(data.success && data.url ? data.url : null);
        }
      } catch (error) {
        console.error('Failed to fetch latest Siddur:', error);
      }
    };
    fetchLatestSiddur();
  }, [printBlackAndWhite]);

  // Load user preferences
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as Record<string, unknown> || {};
      setPrintBlackAndWhite(Boolean(metadata.printBlackAndWhite));
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
      const params = new URLSearchParams({
        date: new Date().toISOString(),
        style: selectedStyle,
      });
      const response = await fetch(`/api/generate-basic-siddur?${params}&format=NusachAshkenaz`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
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

  return (
    <div className="w-full text-white">
      <div className="text-center mb-8">
        <h1 className="mb-4 text-4xl font-bold">{strings['title']}</h1>
        <p className="mb-8 text-lg text-gray-300">
          Customize your settings and generate your Siddur PDF.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 mb-6">
        <PdfActionSection
          latestSiddurUrl={latestSiddurUrl}
          isSignedIn={!!user}
          isGenerating={isGenerating}
          onGenerate={handleGenerateSiddur}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <PreviewSection printBlackAndWhite={printBlackAndWhite} />
        <SettingsSection
          printBlackAndWhite={printBlackAndWhite}
          onToggle={handleBlackAndWhiteToggle}
          isSaving={isSaving}
          isSignedIn={!!user}
          selectedStyle={selectedStyle}
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 mb-6">
        <PdfActionSection
          latestSiddurUrl={latestSiddurUrl}
          isSignedIn={!!user}
          isGenerating={isGenerating}
          onGenerate={handleGenerateSiddur}
        />
      </div>
    </div>
  );
}
