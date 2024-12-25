export interface StoreAccount {
  id: string;
  name: string;
  platform: string;
  username: string;
  password: string;
  cookie?: string;
  watermarkText?: string;
  createdAt: string;
  lastUpdated?: string;
  status: 'active' | 'inactive';
} 