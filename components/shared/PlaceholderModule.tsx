'use client';

import React from 'react';
import { LucideIcon, ArrowRight, Layers, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PlaceholderModuleProps {
  title: string;
  moduleName: string;
  icon: LucideIcon;
  phase: string;
  description: string;
  architectureDetails: string[];
}

export function PlaceholderModule({
  title,
  moduleName,
  icon: Icon,
  phase,
  description,
  architectureDetails,
}: PlaceholderModuleProps) {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <Badge variant="secondary" className="text-xs font-semibold text-indigo-700 bg-indigo-50 border-indigo-200">
              {phase}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      {/* Main Roadmap Card */}
      <Card className="border-slate-200/90 shadow-xs bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900">
                {moduleName} — Coming in the Next Module
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Architectural foundation is established. The Universal Attribute Library will power this system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Universal Engine Integration Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {architectureDetails.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link to Phase 1 Global Attributes */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 to-violet-50/70 border border-indigo-100">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Explore Phase 1 Global Attribute Library</p>
                <p className="text-[11px] text-slate-500">
                  Define universal attributes, units, and capabilities ready for {moduleName}.
                </p>
              </div>
            </div>
            <a href="/attributes">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs">
                <span>View Attributes</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
