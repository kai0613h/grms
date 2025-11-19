
import React from 'react';

interface RadioCardProps<T extends string | number> {
  id: string;
  name: string;
  label: string;
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
  description?: string;
}

const RadioCard = <T extends string | number>({ id, name, label, value, checked, onChange, description }: RadioCardProps<T>) => {
  return (
    <label
      htmlFor={id}
      className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 group
        ${checked
          ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm'}`}
    >
      <div className="flex items-center h-5">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="opacity-0 absolute h-0 w-0"
        />
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200
            ${checked
              ? 'border-indigo-500 bg-indigo-500 scale-110'
              : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}
        >
          {checked && <div className="w-2 h-2 rounded-full bg-white shadow-sm"></div>}
        </div>
      </div>
      <div className="ml-3 text-sm">
        <span className={`font-medium block ${checked ? 'text-indigo-900' : 'text-slate-900'}`}>
          {label}
        </span>
        {description && (
          <span className={`block mt-1 ${checked ? 'text-indigo-700' : 'text-slate-500'}`}>
            {description}
          </span>
        )}
      </div>
    </label>
  );
};

export default RadioCard;
