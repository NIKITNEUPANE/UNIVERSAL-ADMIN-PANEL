'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { PlaceholderModule } from '@/components/shared/PlaceholderModule';

export default function OrdersPage() {
  return (
    <PlaceholderModule
      title="Orders & Transaction Engine"
      moduleName="Order Management"
      icon={ShoppingCart}
      phase="Phase 3 Roadmap"
      description="Order lifecycle, packing status, shipping integrations, and payment tracking."
      architectureDetails={[
        'Full order lifecycle management (Pending, Confirmed, Packed, Shipped, Delivered, Cancelled)',
        'Payment status reconciliation and multi-currency calculation',
        'Line items snapshot preserving purchased variant attributes and prices',
        'Shipping and billing address management with tax breakdown',
        'Customer communication and automated order status notifications',
        'Audit timeline capturing every staff interaction and status transition',
      ]}
    />
  );
}
