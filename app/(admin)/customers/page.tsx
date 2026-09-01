'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { PlaceholderModule } from '@/components/shared/PlaceholderModule';

export default function CustomersPage() {
  return (
    <PlaceholderModule
      title="Customer Accounts & Profiles"
      moduleName="Customer Management"
      icon={Users}
      phase="Phase 3 Roadmap"
      description="Customer purchase history, lifetime value, and segmentation tags."
      architectureDetails={[
        'Customer profiles with order history and total lifetime spend',
        'Customer segmentation tags (e.g. VIP, Wholesale, New Customer)',
        'Multiple saved shipping and billing addresses',
        'Customer support notes and internal staff annotations',
        'Export customer lists and order history reports',
      ]}
    />
  );
}
