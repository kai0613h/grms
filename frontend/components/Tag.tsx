
import React from 'react';
import { XMarkIcon } from './icons';

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

const Tag: React.FC<TagProps> = ({ children, onRemove, className, interactive = false, onClick }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const colorClasses = interactive ? "bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer" : "bg-gray-100 text-gray-700";
  
  return (
    <span className={`${baseClasses} ${colorClasses} ${className || ''}`} onClick={onClick}>
      {children}
      {onRemove && (
        <button
          type="button"
          className="ml-1.5 flex-shrink-0 inline-flex items-center justify-center h-4 w-4 rounded-full text-gray-500 hover:bg-gray-300 hover:text-gray-600 focus:outline-none focus:bg-gray-300 focus:text-gray-600"
          onClick={(e) => {
            e.stopPropagation(); // Prevent onClick if onRemove exists
            onRemove();
          }}
        >
          <span className="sr-only">Remove tag</span>
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default Tag;
