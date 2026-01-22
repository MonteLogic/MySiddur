import React from 'react';

export const InfoBox = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 my-4">
      <div className="text-blue-300 font-medium mb-2">ℹ️ Info</div>
      <div className="text-gray-200">{children}</div>
    </div>
  );
};
