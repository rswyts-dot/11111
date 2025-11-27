import { Product, Translation } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', barcode: '123456', nameEn: 'Apple', nameAr: 'تفاح', price: 5.50, category: 'Fruits' },
  { id: '2', barcode: '789012', nameEn: 'Orange', nameAr: 'برتقال', price: 4.25, category: 'Fruits' },
  { id: '3', barcode: '345678', nameEn: 'Milk 1L', nameAr: 'حليب 1 لتر', price: 7.00, category: 'Dairy' },
  { id: '4', barcode: '901234', nameEn: 'Bread', nameAr: 'خبز', price: 3.50, category: 'Bakery' },
  { id: '5', barcode: '567890', nameEn: 'Water 500ml', nameAr: 'ماء 500 مل', price: 1.50, category: 'Beverages' },
];

export const STRINGS: Translation = {
  pos: { en: 'POS', ar: 'نقاط البيع' },
  products: { en: 'Products', ar: 'المنتجات' },
  reports: { en: 'Reports', ar: 'التقارير' },
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  searchPlaceholder: { en: 'Scan barcode or search...', ar: 'امسح الباركود أو ابحث...' },
  total: { en: 'Total', ar: 'الإجمالي' },
  subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
  vat: { en: 'VAT (5%)', ar: 'الضريبة (5%)' },
  checkout: { en: 'Checkout & Print', ar: 'دفع وطباعة' },
  clearCart: { en: 'Clear', ar: 'مسح' },
  price: { en: 'Price', ar: 'السعر' },
  qty: { en: 'Qty', ar: 'الكمية' },
  item: { en: 'Item', ar: 'الصنف' },
  addProduct: { en: 'Add Product', ar: 'إضافة منتج' },
  edit: { en: 'Edit', ar: 'تعديل' },
  delete: { en: 'Delete', ar: 'حذف' },
  save: { en: 'Save', ar: 'حفظ' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  nameEn: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' },
  nameAr: { en: 'Name (Arabic)', ar: 'الاسم (عربي)' },
  barcode: { en: 'Barcode', ar: 'الباركود' },
  category: { en: 'Category', ar: 'الفئة' },
  actions: { en: 'Actions', ar: 'الإجراءات' },
  salesReport: { en: 'Sales Report', ar: 'تقرير المبيعات' },
  totalRevenue: { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  totalTransactions: { en: 'Total Transactions', ar: 'إجمالي المعاملات' },
  date: { en: 'Date', ar: 'التاريخ' },
  invoice: { en: 'INVOICE', ar: 'فاتورة ضريبية' },
  taxNo: { en: 'Tax No', ar: 'الرقم الضريبي' },
  thankYou: { en: 'Thank you for shopping!', ar: 'شكراً لتسوقكم معنا!' },
  installApp: { en: 'Install App', ar: 'تثبيت البرنامج' },
  downloadData: { en: 'Download Data', ar: 'تنزيل البيانات' },
  restoreData: { en: 'Restore Data', ar: 'استعادة البيانات' },
  confirmDelete: { en: 'Are you sure?', ar: 'هل أنت متأكد؟' },
  dailySales: { en: 'Daily Sales', ar: 'المبيعات اليومية' },
  currency: { en: 'AED', ar: 'درهم' }
};

export const TAX_RATE = 0.05;
export const STORE_NAME = { en: 'Al-Nujoom Supermarket', ar: 'سوبر ماركت النجوم' };
export const TAX_NUMBER = '123456789012345';
