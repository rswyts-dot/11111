export interface Product {
  id: string;
  barcode: string;
  nameEn: string;
  nameAr: string;
  price: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
}

export type View = 'pos' | 'products' | 'reports';
export type Language = 'en' | 'ar';

export interface Translation {
  [key: string]: {
    en: string;
    ar: string;
  };
}