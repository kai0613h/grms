
import React from 'react';
import { XMarkIcon } from './icons';

interface TagProps {
  label: string;
  className?: string;
  onRemove?: () => void;
  onClick?: () => void;
  interactive?: boolean;
}

const Tag: React.FC<TagProps> = ({
  label,
  className,
  onRemove,
  onClick,
  interactive = false
}) => {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200";

  const interactiveClasses = interactive
    ? "cursor-pointer hover:bg-indigo-200 active:bg-indigo-300"
    : "";

  const colorClasses = "bg-indigo-100 text-indigo-800 border border-indigo-200";

  return (
    <span
      className={`${baseClasses} ${colorClasses} ${interactiveClasses} ${className || ''}`}
      onClick={onClick}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          className="ml-1.5 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 focus:outline-none focus:bg-indigo-500 focus:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
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
