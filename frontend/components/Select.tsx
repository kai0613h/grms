
import React from 'react';
import { ChevronDownIcon } from './icons';

interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    containerClassName?: string;
    error?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    className,
    containerClassName,
    id,
    error,
    ...props
}) => {
    return (
        <div className={containerClassName}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={id}
                    className={`block w-full pl-4 pr-10 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 text-sm appearance-none transition-all ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200'
                        } ${className || ''}`}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDownIcon className="h-4 w-4" />
                </div>
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Select;
