
import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, subtitle, className }) => {
  return (
    <div className={`mb-6 pb-2 ${className || ''}`}>
      <h1 className="text-3xl font-bold text-gray-800">{children}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
};

export default SectionTitle;
