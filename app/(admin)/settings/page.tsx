'use client';

import React, { useState } from 'react';
import { Settings, Store, Scale, Shield, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dataStore } from '@/lib/data/store-data';
import { MeasurementService } from '@/lib/services/measurement-service';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(dataStore.getStoreProfile());
  const [activeTab, setActiveTab] = useState<'profile' | 'units'>('profile');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.updateStoreProfile(profile);
    showToast('Store settings saved successfully.', 'success');
  };

  const measurementTypes = MeasurementService.getMeasurementTypes();

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure single-store identity, regional preferences, and explore the Global Unit Library.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Store Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'units'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Global Unit Library</span>
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card className="border-slate-200/90 bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">Store Identity</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Primary business details for this store instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store Name *</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Legal Business Name</label>
                  <Input
                    value={profile.legal_name || ''}
                    onChange={(e) => setProfile({ ...profile, legal_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email *</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <Input
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code</label>
                  <Input
                    value={profile.currency}
                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
                  <Input
                    value={profile.currency_symbol}
                    onChange={(e) => setProfile({ ...profile, currency_symbol: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Save Settings</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <Card className="border-slate-200/90 bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">Standard Measurement Families</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Units registered in the Universal Measurement Engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {measurementTypes.map((family) => {
                const units = MeasurementService.getUnitsForFamily(family.key);
                return (
                  <div key={family.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{family.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({family.description})</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">code: {family.key}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {units.map((u) => (
                        <span
                          key={u.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="font-mono text-indigo-600 font-bold">{u.symbol}</span>
                          <span>{u.name}</span>
                          {u.is_base && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                              Base
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
