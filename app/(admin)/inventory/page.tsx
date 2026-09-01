'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { PlaceholderModule } from '@/components/shared/PlaceholderModule';

export default function InventoryPage() {
  return (
    <PlaceholderModule
      title="Stock & Multi-Location Inventory"
      moduleName="Inventory & Stock Ledger"
      icon={Layers}
      phase="Phase 3 Roadmap"
      description="Location-level inventory tracking, stock movements, and threshold radar."
      architectureDetails={[
        'Track available, reserved, damaged, and incoming stock per variant',
        'Support multiple warehouse depots and retail fulfillment points',
        'Immutable inventory movement audit ledger for restocks and order fulfillments',
        'Automatic low-stock and out-of-stock threshold alerts',
        'Stock transfers between physical inventory locations',
        'Batch inventory CSV adjustments and audit counts',
      ]}
    />
  );
}
