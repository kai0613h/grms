
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, icon, className, containerClassName, ...props }) => {
  const baseInputClasses = "block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed placeholder:text-slate-400";
  const inputWithIconClasses = icon ? "pl-11" : "";

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && React.isValidElement(icon) && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5 text-slate-400" })}
          </div>
        )}
        <input
          id={id}
          className={`${baseInputClasses} ${inputWithIconClasses} ${className || ''}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;
