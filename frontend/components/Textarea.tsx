
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  containerClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className, containerClassName, ...props }) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className || ''}`}
        rows={4}
        {...props}
      />
    </div>
  );
};

export default Textarea;
