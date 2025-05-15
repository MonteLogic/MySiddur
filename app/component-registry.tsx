import { InfoBox } from '#/ui/blog-components/info-box';
import { TipBox } from '#/ui/blog-components/tip-box';
import { WarningBox } from '#/ui/blog-components/warning-box';
import React from 'react';

// Example post-specific components
const PostA = {
  CustomAlert: ({ children, type = 'info' }: { children: React.ReactNode; type?: string }) => {
    const styles = {
      info: 'bg-blue-900/30 border-blue-500 text-blue-300',
      success: 'bg-green-900/30 border-green-500 text-green-300',
      warning: 'bg-yellow-900/30 border-yellow-500 text-yellow-300',
      error: 'bg-red-900/30 border-red-500 text-red-300',
    };
    
    const style = styles[type as keyof typeof styles] || styles.info;
    
    return (
      <div className={`${style} border rounded-lg p-4 my-4`}>
        <div className="font-medium mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div className="text-gray-200">{children}</div>
      </div>
    );
  },
  
  Timeline: ({ items }: { items: { date: string; title: string; description: string }[] }) => (
    <div className="border-l-2 border-gray-600 pl-4 my-6 space-y-6">
      {items.map((item, index) => (
        <div key={index} className="relative">
          <div className="absolute -left-6 mt-1.5 h-4 w-4 rounded-full bg-gray-600"></div>
          <div className="text-sm text-gray-400">{item.date}</div>
          <div className="font-medium text-white mt-1">{item.title}</div>
          <div className="text-gray-300 mt-1">{item.description}</div>
        </div>
      ))}
    </div>
  ),
};

const AdvancedCharts = {
  Chart: ({ data, type }: { data: any[]; type: string }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="text-center text-gray-400 mb-2">
        [Placeholder for {type} chart with {data.length} data points]
      </div>
      <div className="h-40 border border-dashed border-gray-600 rounded flex items-center justify-center">
        <div className="text-gray-400">Chart would render here in a real implementation</div>
      </div>
    </div>
  ),
};

// Create a registry of component sets that posts can reference
const componentRegistry: Record<string, Record<string, any>> = {
  'post-a': PostA,
  'advanced-charts': AdvancedCharts,
  // You can add more component sets here
};

// List of all available component sets for validation
export const availableComponentSets = Object.keys(componentRegistry);

export function validateComponentSets(componentSets: string[]): { 
  valid: string[]; 
  invalid: string[]; 
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  componentSets.forEach(set => {
    if (componentRegistry[set]) {
      valid.push(set);
    } else {
      invalid.push(set);
    }
  });
  
  return { valid, invalid };
}

export function getComponents(keys: string[] = []): Record<string, any> {
  // Start with base components
  const components = {
    InfoBox,
    WarningBox,
    TipBox,
  };
  
  // Validate component sets
  const { valid, invalid } = validateComponentSets(keys);
  
  // Log warnings for invalid component sets
  if (invalid.length > 0) {
    console.warn(`Invalid component sets found: ${invalid.join(', ')}`);
    console.warn(`Available component sets are: ${availableComponentSets.join(', ')}`);
  }
  
  // Add requested component sets (only valid ones)
  valid.forEach(key => {
    Object.assign(components, componentRegistry[key]);
  });
  
  return components;
}

export default componentRegistry;