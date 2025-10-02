
import React from 'react';

interface RadioCardProps {
  id: string;
  name: string; // for radio group
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
}

const RadioCard: React.FC<RadioCardProps> = ({ id, name, label, value, checked, onChange }) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-150
        ${checked ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
    >
      <span className={`text-sm font-medium ${checked ? 'text-blue-700' : 'text-gray-700'}`}>
        {label}
      </span>
      <div className="relative flex items-center">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="opacity-0 absolute h-0 w-0" // Hide actual radio, style custom one
        />
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150
            ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}
        >
          {checked && <div className="w-2 h-2 rounded-full bg-white"></div>}
        </div>
      </div>
    </label>
  );
};

export default RadioCard;
