// app/page.tsx
'use client'; // Add this if you plan to add client-side interactions later, though not strictly needed for a simple link.

import React, { useState } from 'react';
// Link component is not strictly necessary if we're just linking to an API endpoint for download,
// a standard <a> tag works fine. But using Link is also okay.
import Link from 'next/link';
import strings from '#/strings.json'; // Assuming this path is correct

export default function LandingPage() {
  const [selectedStyle, setSelectedStyle] = useState('Recommended');

  // Define parameters for the Siddur generation.
  // These could be dynamic in a real application (e.g., from user input or state).
  const siddurParams = new URLSearchParams({
    // format: 'NusachAshkenaz', // Or 'NusachSefard'
    // userName: 'Dev User',
    date: new Date().toISOString(), // Use current date or a selected one
    style: selectedStyle, // Add the selected style parameter
  });

  // Construct the API endpoint URL.
  // You can choose to include default parameters or make them selectable by the user later.
  // For simplicity, the API route currently defaults if params are not present.
  // Let's make it explicit for 'NusachAshkenaz' for this example.
  const generateSiddurUrl = `/api/generate-basic-siddur?${siddurParams.toString()}&format=NusachAshkenaz`;

  return (
    // Use Tailwind classes for a basic layout and dark theme consistent with original code
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{strings['title']}</h1>
        <p className="mb-8 text-lg text-gray-300">
          Choose your preferred style and generate a Siddur PDF.
        </p>
        
        {/* Style Selection Dropdown */}
        <div className="mb-6">
          <label htmlFor="style-select" className="block mb-2 text-sm font-medium text-gray-300">
            Prayer Style:
          </label>
          <select
            id="style-select"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="Recommended">Recommended (Hebrew + English for prayers with specific style config, transliterations for others)</option>
            <option value="all-transliterated">All Transliterated (Hebrew + English + Transliteration for all prayers)</option>
          </select>
        </div>

        {/*
          This <a> tag now points directly to your API endpoint.
          The browser will make a GET request to this URL.
          The API route will generate the PDF and send it back with headers
          that tell the browser to download it.
        */}
        <a
          href={generateSiddurUrl}
          // The 'download' attribute is a hint to the browser, but the
          // Content-Disposition header from the server is more definitive.
          // You can name the downloaded file here if desired, though the server can also set it.
          download="MySiddur.pdf"
          className="inline-block rounded-lg border border-blue-700 bg-blue-800/30 px-6 py-3 text-xl font-semibold text-blue-400 transition-colors hover:border-blue-600 hover:bg-blue-700/40"
        >
          Generate Siddur <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
