'use client';

import React from 'react';
import {
  FileText,
  DollarSign,
  Layers,
  Package,
  Image as ImageIcon,
  Search,
  Check
} from 'lucide-react';

export type ProductFormStep = 'basic' | 'pricing' | 'attributes' | 'media' | 'seo';

interface StepDef {
  id: ProductFormStep;
  number: number;
  label: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepDef[] = [
  {
    id: 'basic',
    number: 1,
    label: 'Basic Info',
    subtitle: 'Main product details',
    icon: FileText,
  },
  {
    id: 'pricing',
    number: 2,
    label: 'Pricing',
    subtitle: 'Price, margins & tax',
    icon: DollarSign,
  },
  {
    id: 'attributes',
    number: 3,
    label: 'Attributes & Variants',
    subtitle: 'Options & matrix',
    icon: Layers,
  },
  {
    id: 'media',
    number: 4,
    label: 'Media',
    subtitle: 'Product imagery',
    icon: ImageIcon,
  },
  {
    id: 'seo',
    number: 5,
    label: 'SEO & Status',
    subtitle: 'Optimize & publish',
    icon: Search,
  },
];

interface ProductFormStepperProps {
  currentStep: ProductFormStep;
  onStepChange: (step: ProductFormStep) => void;
  completedSteps?: ProductFormStep[];
}

export function ProductFormStepper({
  currentStep,
  onStepChange,
  completedSteps = [],
}: ProductFormStepperProps) {
  const currentStepIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full liquid-glass-card rounded-2xl p-1.5 sm:p-2 overflow-hidden shadow-xs">
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isPast = idx < currentStepIdx || completedSteps.includes(step.id);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              className={`flex items-center gap-2 sm:gap-2.5 p-2 sm:px-3 sm:py-2 rounded-xl text-left transition-all cursor-pointer group min-w-0 ${
                isActive
                  ? 'liquid-glass-active text-indigo-950 font-bold'
                  : 'hover:bg-white/70 text-slate-600'
              }`}
            >
              {/* Step Badge */}
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all shrink-0 ${
                  isActive
                    ? 'liquid-button-primary text-white shadow-md shadow-indigo-500/30'
                    : isPast
                    ? 'bg-emerald-500/90 text-white shadow-xs backdrop-blur-xs border border-white/40'
                    : 'bg-white/70 text-slate-500 border border-slate-200/70 group-hover:bg-white'
                }`}
              >
                {isPast && !isActive ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Step Info */}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-bold truncate ${
                    isActive
                      ? 'text-indigo-950'
                      : isPast
                      ? 'text-slate-800'
                      : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate hidden md:block">
                  {step.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
