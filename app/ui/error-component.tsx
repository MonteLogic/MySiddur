'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorComponentProps {
  message?: string;
}

export default function ErrorComponent({ message = "This blog post could not be found or you do not have permission to view it." }: ErrorComponentProps) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href="/blog" className="text-blue-400 hover:text-blue-300">
          ← Back to all posts
        </Link>
      </div>

      <div className="rounded-lg border border-red-500 bg-red-900/20 p-6">
        <h1 className="mb-4 text-3xl font-bold text-red-500">
          Post Not Found
        </h1>
        <p className="text-white">
          {message}
        </p>
      </div>
    </div>
  );
}