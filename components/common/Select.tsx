
import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  rationale?: string;
  helpText?: string;
  isRequired?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, id, options, error, className, rationale, helpText, isRequired, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center mb-1">
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {isRequired && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
          </label>
          {helpText && (
            <div className="relative group ml-1.5">
              <InformationCircleIcon className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 sm:w-72 p-2.5 text-xs text-white dark:text-slate-100 bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 border border-slate-600 dark:border-slate-500">
                {helpText}
              </div>
            </div>
          )}
        </div>
      )}
      <select
        id={id}
        className={`w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition duration-150 ease-in-out appearance-none ${error ? 'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400' : ''} ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        {...props}
      >
        <option value="" disabled={props.value !== ""} className="text-slate-500 dark:text-slate-400">옵션을 선택하세요</option>
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {rationale && <p className="mt-0.5 text-xs text-sky-600 dark:text-sky-400 italic">{rationale}</p>}
    </div>
  );
};