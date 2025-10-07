import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const Panel: React.FC<PanelProps> = ({ children, className = '', padding = true }) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-2xl shadow-sm text-sm text-gray-700';
  const paddingClass = padding ? 'p-4' : '';
  const composed = [baseClasses, paddingClass, className].filter(Boolean).join(' ').trim();
  return <div className={composed}>{children}</div>;
};

export default Panel;
