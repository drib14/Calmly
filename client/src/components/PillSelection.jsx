import React from 'react';

const PillSelection = ({ options, value, onChange }) => {
  // options: array of { value, label } or simple strings

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const val = typeof option === 'object' ? option.value : option;
        const label = typeof option === 'object' ? option.label : option;
        const isSelected = value === val;

        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium transition-all border
              ${isSelected
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-surface text-secondary border-soft-border hover:border-slate-300 hover:text-text'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default PillSelection;
