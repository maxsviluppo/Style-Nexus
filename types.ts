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

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  size?: string;
  color?: string;
  material?: string;
  barcode?: string;
}

export interface StatData {
  name: string;
  sales: number;
  visitors: number;
}
