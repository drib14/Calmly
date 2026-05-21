import React from 'react';

const PillSelection = ({ options, value, onChange }) => {
  // options: array of { value, label, icon? } or simple strings

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const val = typeof option === 'object' ? option.value : option;
        const label = typeof option === 'object' ? option.label : option;
        const icon = typeof option === 'object' ? option.icon : null;
        const isSelected = value === val;

        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center space-x-2
              ${isSelected
                ? 'bg-text text-background border-text shadow-sm'
                : 'bg-surface text-secondary border-soft-border hover:border-text/50 hover:text-text'
              }
            `}
          >
            {icon && (
                <span className={isSelected ? 'text-background' : 'text-secondary group-hover:text-text'}>
                    {icon}
                </span>
            )}
            {(!icon || isSelected) && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default PillSelection;
