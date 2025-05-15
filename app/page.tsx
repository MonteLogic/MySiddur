import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    // Use Tailwind classes for a basic layout and dark theme consistent with original code
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">MoL Tech Blog</h1>
        <p className="mb-8 text-lg text-gray-300">
          Insights, guides, and notes on web development, workflows, and the
          tech journey.
        </p>
        {/* Link to the main blog page */}
        <Link
          href="/blog"
          // Basic button-like styling for the link
          className="inline-block rounded-lg border border-blue-700 bg-blue-800/30 px-6 py-3 text-xl font-semibold text-blue-400 transition-colors hover:border-blue-600 hover:bg-blue-700/40"
        >
          Explore the Blog <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
