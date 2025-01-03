export interface StoreAccount {
  id: string;
  name: string;
  platform: string;
  username: string;
  password: string;
  cookie?: string;
  watermarkText?: string;
  watermarkSettings?: {
    fontSize?: number;
    opacity?: number;
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    rotation?: number;
    mode?: 'single' | 'tile';
    color?: string;
    fontFamily?: string;
    isSmartMode?: boolean;
  };
  createdAt: string;
  lastUpdated?: string;
  status: 'active' | 'inactive';
  features?: {
    templates: Array<{
      id: string;
      name: string;
      content: string;
    }>;
  };
} 