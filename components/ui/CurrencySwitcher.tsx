'use client';

import React, { useState, useEffect } from 'react';
import { CurrencyService, SUPPORTED_CURRENCIES, CurrencyConfig } from '@/lib/services/currency-service';
import { Coins, ChevronDown, Check } from 'lucide-react';

export function CurrencySwitcher({
  className = '',
  onCurrencyChange,
}: {
  className?: string;
  onCurrencyChange?: (currency: CurrencyConfig) => void;
}) {
  const [activeCurrency, setActiveCurrency] = useState<CurrencyConfig>(CurrencyService.getActiveCurrency());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    CurrencyService.initClient();
    const curr = CurrencyService.getActiveCurrency();
    setActiveCurrency(curr);
    onCurrencyChange?.(curr);

    const handleCurrencyChange = () => {
      const updated = CurrencyService.getActiveCurrency();
      setActiveCurrency(updated);
      onCurrencyChange?.(updated);
    };

    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  const handleSelect = (code: string) => {
    const updated = CurrencyService.setActiveCurrency(code);
    setActiveCurrency(updated);
    onCurrencyChange?.(updated);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-input hover:bg-white/90 text-xs font-bold text-slate-800 transition-all cursor-pointer"
        title="Change Store Currency"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
        <span className="font-mono">{activeCurrency.code}</span>
        <span className="text-slate-400 font-medium">({activeCurrency.symbol.trim()})</span>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 rounded-2xl liquid-modal-panel py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3.5 py-1.5 border-b border-slate-200/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Store Currency
            </div>
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = curr.code === activeCurrency.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => handleSelect(curr.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono font-bold text-slate-500">
                        {curr.symbol.trim()}
                      </span>
                      <span>{curr.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">
                      {curr.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
