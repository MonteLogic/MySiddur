'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Users } from 'lucide-react';

const OrganizationPrompt = () => {
  const [countdown, setCountdown] = useState(15);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      router.push('/main/create-org');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-slate-800 rounded-lg shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500 rounded-full">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Organization Required</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-200">
              You need to be part of an organization to access this feature. You can either request an invitation
              to join an existing organization or create your own.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors flex items-center justify-center gap-2 font-medium"
              onClick={() => {/* Handle invitation request */}}
            >
              Request Invitation
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button 
              className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 
                         transition-colors flex items-center justify-center gap-2 font-medium"
              onClick={() => router.push('/main/create-org')}
            >
              Create Organization
              <Users className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="bg-slate-700/50 rounded-full px-4 py-2 text-sm text-slate-300">
              Redirecting to organization creation in {countdown} seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPrompt;