import { StoreProfile } from '@/lib/types/commerce';

export const INITIAL_STORE_PROFILE: StoreProfile = {
  name: 'Lumina Concept Store',
  legal_name: 'Lumina Universal Retailers LLC',
  logo_url: '',
  email: 'admin@lumina-store.com',
  phone: '+1 (555) 342-9810',
  currency: 'NPR',
  currency_symbol: 'Rs.',
  timezone: 'America/New_York',
  language: 'en-US',
  address: {
    street: '120 Broadway Ave, Suite 400',
    city: 'New York',
    state: 'NY',
    postal_code: '10006',
    country: 'United States',
  },
};

export class SingleStoreData {
  private profile: StoreProfile = { ...INITIAL_STORE_PROFILE };

  getStoreProfile(): StoreProfile {
    return { ...this.profile };
  }

  updateStoreProfile(updates: Partial<StoreProfile>): StoreProfile {
    this.profile = { ...this.profile, ...updates };
    return { ...this.profile };
  }
}

export const dataStore = new SingleStoreData();
