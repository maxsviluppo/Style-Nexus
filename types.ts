export enum View {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  STOREFRONT = 'STOREFRONT',
  MARKETING = 'MARKETING',
  ADMIN = 'ADMIN',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  SALES = 'SALES',
  ACCOUNTING = 'ACCOUNTING',
  CFO = 'CFO'
}

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  subCategories?: Category[];
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  barcode: string; 
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  
  // Pricing & Economics
  costPrice?: number; // Costo acquisto
  markup?: number; // Ricarico %
  price: number; // Prezzo vendita negozio (calcolato o manuale)
  onlinePrice?: number; // Prezzo vendita online (opzionale)
  
  imageUrl: string;
  material?: string;
  weight?: number;
  
  // Visibility
  isOnline: boolean; // Visibile in vetrina
  
  variants: ProductVariant[]; 
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  vat: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  barcode: string;
  productName: string;
  variantDetails: string;
  quantity: number;
  costPrice: number;
}

export interface Invoice {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'DRAFT' | 'COMPLETED';
}

export interface SaleItem {
  productId: string;
  variantId: string;
  name: string;
  details: string; // "L / Rosso"
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'SUMUP';
}

export type TransactionCategory = 'RENT' | 'UTILITIES' | 'TAXES' | 'SALARY' | 'OTHER_EXPENSE' | 'OTHER_INCOME' | 'GRANT';
export type DetailedPaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CHECK' | 'RIBA';

export interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  type: 'IN' | 'OUT';
  category: TransactionCategory;
  description: string;
  dueDate?: string; // Per le scadenze
  isPaid: boolean;
  paymentMethod?: DetailedPaymentMethod; // Nuovo campo dettagliato
}

export interface HardwareConfig {
  printerIp: string;
  printerBrand: 'EPSON' | 'CUSTOM' | 'RCH' | 'NONE';
  printerEnabled: boolean;
  sumUpEmail: string;
  sumUpEnabled: boolean;
}

export interface StoreSettings {
  // General
  storeName: string;
  logoUrl?: string;
  
  // Fiscal
  companyName: string;
  vatNumber: string;
  fiscalCode: string;
  sdiCode?: string;
  pec?: string;
  address: string;
  city: string;
  zip: string;
  
  // Contacts
  email: string;
  phone: string;
  website?: string;
  
  // Social
  instagram?: string;
  facebook?: string;
  
  // Config
  vatRate: number;
  defaultMarkup: number; // Nuovo default ricarico %
  currency: string;
  
  // Hardware Integrations
  integrations: HardwareConfig;
}

export interface StatData {
  name: string;
  sales: number;
  visitors: number;
}