
import React from 'react';

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
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, options, selectedOptions, onChange, name, rationale }) => {
  const handleChange = (optionId: string) => {
    const newSelectedOptions = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    onChange(newSelectedOptions);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      {rationale && <p className="text-xs text-sky-400 italic mb-1.5 -mt-0.5">{rationale}</p>}
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-700 transition-colors">
            <input
              type="checkbox"
              name={name}
              value={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={() => handleChange(option.id)}
              className="form-checkbox h-5 w-5 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-offset-slate-800"
            />
            <span className="text-slate-200">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
