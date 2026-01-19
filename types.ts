export enum View {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  STOREFRONT = 'STOREFRONT',
  MARKETING = 'MARKETING',
  ADMIN = 'ADMIN',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  SALES = 'SALES' // Nuova vista Vendita al banco
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
  price: number;
  imageUrl: string;
  material?: string;
  weight?: number; // Nuovo campo opzionale (kg)
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
  paymentMethod: 'CASH' | 'CARD';
}

export interface StoreSettings {
  // General
  storeName: string;
  logoUrl?: string;
  
  // Fiscal
  companyName: string; // Ragione Sociale
  vatNumber: string; // P.IVA
  fiscalCode: string; // Codice Fiscale
  sdiCode?: string; // Codice Univoco
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
  currency: string;
}

export interface StatData {
  name: string;
  sales: number;
  visitors: number;
}