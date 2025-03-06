import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'default',
}) => {
  const getTabStyles = (tab: Tab) => {
    const isActive = tab.id === activeTab;
    const isDisabled = tab.disabled;

    // Base styles that apply to all variants
    const baseStyles = `px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`;

    // Variant-specific styles
    switch (variant) {
      case 'pills':
        return `${baseStyles} rounded-md ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`;
      case 'underline':
        return `${baseStyles} border-b-2 ${
          isActive
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
      case 'default':
      default:
        return `${baseStyles} ${
          isActive
            ? 'bg-white border-gray-200 border-b-white text-gray-900 rounded-t-md border'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
    }
  };

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={getTabStyles(tab)}
            aria-current={tab.id === activeTab ? 'page' : undefined}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
