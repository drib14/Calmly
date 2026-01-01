import React from 'react';
import { Check } from 'lucide-react';

const SelectionCard = ({ options, value, onChange, columns = 2, layout = 'grid' }) => {
  // options: array of { value, label, description, icon (optional), preview (optional class), fontClass (optional) }

  // Map columns to static Tailwind classes to ensure they are not purged
  const gridCols = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    6: 'sm:grid-cols-6',
  };

  const gridClass = layout === 'grid'
    ? `grid-cols-1 ${gridCols[columns] || 'sm:grid-cols-2'}`
    : 'flex flex-col';

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              relative flex flex-col items-start p-4 rounded-xl border transition-all text-left group
              ${isSelected
                ? 'bg-surface border-text ring-1 ring-text shadow-sm'
                : 'bg-background border-soft-border hover:border-text/50 hover:bg-surface'
              }
            `}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center space-x-2">
                {option.icon && (
                  <div className={`transition-colors ${isSelected ? 'text-text' : 'text-secondary'}`}>
                    {option.icon}
                  </div>
                )}
                {/* Font sample support */}
                {option.fontClass ? (
                    <div className="flex items-baseline space-x-2">
                        <span className={`text-lg ${option.fontClass} ${isSelected ? 'text-text' : 'text-text/80'}`}>Aa</span>
                        <span className={`font-bold text-sm ${isSelected ? 'text-text' : 'text-secondary'}`}>
                            {option.label}
                        </span>
                    </div>
                ) : (
                    <span className={`font-bold text-sm ${isSelected ? 'text-text' : 'text-text'}`}>
                      {option.label}
                    </span>
                )}
              </div>
              {isSelected && (
                <div className="bg-text text-background rounded-full p-0.5">
                  <Check size={12} />
                </div>
              )}
            </div>

            {option.description && (
              <p className="text-xs text-secondary leading-relaxed">
                {option.description}
              </p>
            )}

            {option.preview && (
               <div className={`mt-3 w-full h-8 rounded-md border border-soft-border ${option.preview}`}></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SelectionCard;
