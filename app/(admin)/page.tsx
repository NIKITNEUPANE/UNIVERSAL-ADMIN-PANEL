'use client';

import React from 'react';
import {
  SlidersHorizontal,
  Scale,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dataStore } from '@/lib/data/store-data';

export default function DashboardOverview() {
  const profile = dataStore.getStoreProfile();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Universal Store Command
            </h1>
            <Badge variant="default" className="text-xs font-semibold bg-indigo-600 text-white">
              {profile.name}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Phase 1 Foundation: Universal Attribute Engine, Global Unit Library & Single-Store Architecture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/attributes">
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Open Attribute Library</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Foundational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel-hover border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Universal Attributes
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">20+</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Reusable primitives (Color, Size, Weight, RAM, etc.)
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel-hover border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Measurement Families
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <Scale className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">7 Families</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Weight, Volume, Length, Area, Quantity, Temp, Time
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel-hover border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Standard Units
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Boxes className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">25+ Units</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Offset & factor conversion engine configured
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel-hover border-slate-200/90 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              System Architecture
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Single Store</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pure single-tenant PostgreSQL database model
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Architectural Flow Diagram Card */}
      <Card className="border-slate-200/90 bg-white shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Universal Commerce Architectural Hierarchy
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                How global attribute definitions flow into categories, products, and purchasable variants.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
              Standard Flow
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Layer 1</span>
                <Badge variant="default" className="text-[9px] bg-indigo-600 text-white">Phase 1</Badge>
              </div>
              <p className="text-xs font-bold text-slate-900">Global Attribute</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Defines what an attribute <em>IS</em> (e.g. Color, Size, Volume, RAM) with independent capabilities.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 opacity-90">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layer 2</span>
                <Badge variant="secondary" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-xs font-bold text-slate-900">Category Config</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Defines <em>WHERE and HOW</em> it is used, plus contextual requiredness (e.g. Color required in Apparel).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 opacity-90">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layer 3</span>
                <Badge variant="secondary" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-xs font-bold text-slate-900">Product Value</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Holds the actual typed value (e.g. Material: Cotton, 500ml, Screen: 6.7 in).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 opacity-90">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layer 4</span>
                <Badge variant="secondary" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-xs font-bold text-slate-900">Variant Option</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Customer-selectable options chosen by buyers on the product page (e.g. Navy / 4Y).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 opacity-90">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layer 5</span>
                <Badge variant="secondary" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-xs font-bold text-slate-900">Product Variant</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Purchasable inventory combination with dedicated SKU, price, and barcode.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-900">Next Step: Manage Universal Attributes</p>
              <p>Explore, create, and test universal attributes in the Global Attribute Library.</p>
            </div>
            <a href="/attributes">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs shrink-0">
                <span>Go to Attributes</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
