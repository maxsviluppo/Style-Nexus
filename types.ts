export enum View {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  STOREFRONT = 'STOREFRONT',
  MARKETING = 'MARKETING',
  ADMIN = 'ADMIN',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN' // Nuova vista Fornitori/Ordini
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
  variants: ProductVariant[]; 
  supplierId?: string; // Link al fornitore
}

export interface Supplier {
  id: string;
  name: string;
  vat: string; // P.IVA
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  barcode: string;
  productName: string;
  variantDetails: string; // Es: "L / Rosso"
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
  status: 'DRAFT' | 'COMPLETED'; // COMPLETED aggiorna il magazzino
}

export interface StatData {
  name: string;
  sales: number;
  visitors: number;
}
