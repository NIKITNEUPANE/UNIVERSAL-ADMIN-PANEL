'use client';

import React, { useState } from 'react';
import { Scale, Check, Info, ArrowRight } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { MeasurementService } from '@/lib/services/measurement-service';
import { MeasurementFamilyKey } from '@/lib/types/commerce';

interface UnitLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnitLibraryModal({ isOpen, onClose }: UnitLibraryModalProps) {
  const families = MeasurementService.getMeasurementTypes();
  const [selectedFamilyKey, setSelectedFamilyKey] = useState<MeasurementFamilyKey>('weight');
  const units = MeasurementService.getUnitsForFamily(selectedFamilyKey);
  const activeFamily = families.find((f) => f.key === selectedFamilyKey);

  // Conversion test calculator state
  const [calcVal, setCalcVal] = useState<number>(1);
  const [fromUnitId, setFromUnitId] = useState<string>(units[0]?.id || '');
  const [toUnitId, setToUnitId] = useState<string>(units[1]?.id || units[0]?.id || '');

  const conversionResult = MeasurementService.convert(
    calcVal,
    fromUnitId || units[0]?.id || '',
    toUnitId || units[1]?.id || units[0]?.id || ''
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Global Unit Library & Measurement Families" maxWidth="lg">
      <div className="space-y-6">
        <p className="text-xs text-slate-500">
          The Universal Commerce measurement architecture guarantees unit family compatibility, base unit normalization, and offset-aware conversions across physical and commercial dimensions.
        </p>

        {/* Family Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {families.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFamilyKey(f.key);
                const famUnits = MeasurementService.getUnitsForFamily(f.key);
                setFromUnitId(famUnits[0]?.id || '');
                setToUnitId(famUnits[1]?.id || famUnits[0]?.id || '');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFamilyKey === f.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Units Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">{activeFamily?.name} Family Units</span>
            <span className="text-slate-500">{activeFamily?.description}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {units.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{u.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold">
                      {u.symbol}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {u.is_base ? 'Standard Base Unit' : `Factor: ${u.conversion_factor}`}
                    {u.conversion_offset ? ` (Offset: ${u.conversion_offset})` : ''}
                  </p>
                </div>
                {u.is_base && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    Base Unit
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Conversion Sandbox */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
          <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
            Live Unit Conversion Simulator
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={calcVal}
                onChange={(e) => setCalcVal(Number(e.target.value) || 0)}
                className="w-20 h-9 rounded-xl border border-indigo-200 bg-white px-2.5 text-xs font-bold text-slate-900"
              />
              <select
                value={fromUnitId}
                onChange={(e) => setFromUnitId(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-indigo-200 bg-white px-2 text-xs font-semibold text-slate-800"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} ({u.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center text-indigo-600 font-bold text-xs">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-indigo-200 bg-white px-2 text-xs font-semibold text-slate-800"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} ({u.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-indigo-100 text-xs font-semibold text-indigo-950 flex items-center justify-between">
            <span>Result:</span>
            {conversionResult.success ? (
              <span className="text-sm font-bold text-indigo-700 font-mono">
                {calcVal} {units.find((u) => u.id === fromUnitId)?.symbol} = {conversionResult.value}{' '}
                {units.find((u) => u.id === toUnitId)?.symbol}
              </span>
            ) : (
              <span className="text-xs text-rose-600">{conversionResult.error}</span>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
