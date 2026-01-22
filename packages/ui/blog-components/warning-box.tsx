import React from 'react';

export const WarningBox = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 my-4">
        <div className="text-yellow-300 font-medium mb-2">⚠️ Warning</div>
        <div className="text-gray-200">{children}</div>
      </div>
    );
  };