import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

const PinInput = ({ length = 4, onComplete, onChange, onClear, error }) => {
  const [pin, setPin] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
      if (onClear) {
          setPin(new Array(length).fill(''));
          inputRefs.current[0]?.focus();
      }
  }, [onClear, length]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return; // Only numbers

    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1); // Only take last char
    setPin(newPin);

    // Call generic onChange if provided
    if (onChange) {
        onChange(newPin);
    }

    // Trigger complete
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check if full
    const fullPin = newPin.join('');
    if (fullPin.length === length && newPin.every(d => d !== '')) {
        if (onComplete) onComplete(fullPin);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
        if (!pin[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    }
  };

  const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').slice(0, length);
      if (/^\d+$/.test(pastedData)) {
          const newPin = pastedData.split('');
          while (newPin.length < length) newPin.push('');
          setPin(newPin);
          if (onChange) onChange(newPin);
          if (onComplete) onComplete(newPin.join(''));
      }
  };

  return (
    <div className="flex justify-center space-x-2 sm:space-x-4">
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={clsx(
            "w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-xl text-center text-2xl font-bold bg-background text-text focus:outline-none transition-all",
            error ? "border-red-500 ring-2 ring-red-200" : "border-soft-border focus:border-accent focus:ring-4 ring-accent/10"
          )}
        />
      ))}
    </div>
  );
};

export default PinInput;
