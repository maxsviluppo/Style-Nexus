export enum View {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  STOREFRONT = 'STOREFRONT',
  MARKETING = 'MARKETING',
  ADMIN = 'ADMIN'
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
  barcode: string; // EAN specifico per la variante
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
  variants: ProductVariant[]; // Lista delle varianti
  // Helper per visualizzazione rapida
  totalStock?: number; 
}

export interface StatData {
  name: string;
  sales: number;
  visitors: number;
}
