
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  containerClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className, containerClassName, ...props }) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 text-sm placeholder:text-slate-400 transition-all resize-y ${className || ''}`}
        rows={4}
        {...props}
      />
    </div>
  );
};

export default Textarea;
