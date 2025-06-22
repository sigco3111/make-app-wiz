
import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  name?: string;
  rationale?: string;
  helpText?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, options, selectedOptions, onChange, name, rationale, helpText }) => {
  const handleChange = (optionId: string) => {
    const newSelectedOptions = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    onChange(newSelectedOptions);
  };

  return (
    <div>
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
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
      {rationale && <p className="text-xs text-sky-600 dark:text-sky-400 italic mb-1.5 -mt-0.5">{rationale}</p>}
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <input
              type="checkbox"
              name={name}
              value={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={() => handleChange(option.id)}
              className="form-checkbox h-5 w-5 text-purple-600 bg-slate-100 dark:bg-slate-600 border-slate-400 dark:border-slate-500 rounded focus:ring-purple-500 dark:focus:ring-purple-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800"
            />
            <span className="text-slate-700 dark:text-slate-200">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
