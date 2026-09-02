'use client';

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Switch({
  checked,
  onChange,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
  size = 'md',
}: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 8)}`;

  const handleToggle = () => {
    if (disabled) return;
    const nextVal = !checked;
    onChange?.(nextVal);
    onCheckedChange?.(nextVal);
  };

  const isSmall = size === 'sm';

  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <label htmlFor={switchId} className="cursor-pointer select-none">
          {label && <p className="text-xs font-bold text-slate-800">{label}</p>}
          {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
        </label>
      )}
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
          isSmall ? 'h-4 w-7' : 'h-6 w-11'
        } ${
          checked ? 'bg-indigo-600' : 'bg-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            isSmall ? 'h-3 w-3' : 'h-5 w-5'
          } ${
            checked ? (isSmall ? 'translate-x-3' : 'translate-x-5') : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
