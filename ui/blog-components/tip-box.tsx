import React from 'react';

export const TipBox = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 my-4">
        <div className="text-green-300 font-medium mb-2">💡 Tip</div>
        <div className="text-gray-200">{children}</div>
      </div>
    );
  };