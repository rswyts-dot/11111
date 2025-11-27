import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Languages, 
  Printer, 
  Download,
  Save,
  Menu,
  X,
  CreditCard,
  ScanBarcode
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { INITIAL_PRODUCTS, STRINGS, TAX_RATE, STORE_NAME, TAX_NUMBER } from './constants';
import { Product, CartItem, Transaction, View, Language } from './types';

// --- Local Storage Helper ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

// --- Components ---

// 1. Invoice Component (Hidden except for Print)
const Invoice = ({ transaction, lang }: { transaction: Transaction | null, lang: Language }) => {
  if (!transaction) return null;

  const t = (key: string) => STRINGS[key][lang];

  return (
    <div className="hidden print:flex flex-col fixed inset-0 z-[100] bg-white p-8 text-black" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6 border-b pb-4 border-gray-300">
        <h1 className="text-2xl font-bold mb-2">{lang === 'ar' ? STORE_NAME.ar : STORE_NAME.en}</h1>
        <h2 className="text-xl font-semibold text-gray-700">{t('invoice')}</h2>
        <p className="text-sm mt-1">{t('taxNo')}: {TAX_NUMBER}</p>
        <p className="text-sm text-gray-500 mt-1">{new Date(transaction.date).toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-US')}</p>
        <p className="text-xs text-gray-400 mt-1">ID: {transaction.id.slice(-8)}</p>
      </div>

      <div className="flex-1 overflow-visible">
        <table className="w-full text-sm mb-6">
          <thead className="border-b-2 border-gray-800">
            <tr>
              <th className="py-2 text-start">{t('item')}</th>
              <th className="py-2 text-center">{t('qty')}</th>
              <th className="py-2 text-end">{t('price')}</th>
              <th className="py-2 text-end">{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, idx) => (
              <tr key={idx} className="border-b border-dashed border-gray-300">
                <td className="py-2 text-start">{lang === 'ar' ? item.nameAr : item.nameEn}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-end">{item.price.toFixed(2)}</td>
                <td className="py-2 text-end">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col gap-2 w-full max-w-xs ml-auto rtl:mr-auto rtl:ml-0">
          <div className="flex justify-between font-medium">
            <span>{t('subtotal')}</span>
            <span>{transaction.subtotal.toFixed(2)} {t('currency')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t('vat')}</span>
            <span>{transaction.vat.toFixed(2)} {t('currency')}</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t border-gray-800 pt-2 mt-2">
            <span>{t('total')}</span>
            <span>{transaction.total.toFixed(2)} {t('currency')}</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 border-t pt-4 border-gray-300">
        <p className="font-semibold mb-2">{t('thankYou')}</p>
        {/* Simple Barcode representation of ID */}
        <div className="w-full h-12 bg-gray-200 mt-2 flex items-center justify-center font-mono text-xs tracking-widest">
          ||| || ||| || {transaction.id.slice(-6).toUpperCase()} || |||
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [lang, setLang] = useLocalStorage<Language>('pos_lang', 'en');
  const [view, setView] = useState<View>('pos');
  const [products, setProducts] = useLocalStorage<Product[]>('pos_products', INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('pos_transactions', []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  
  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App is already installed or not installable in this browser.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDownloadData = () => {
    const data = { products, transactions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const t = (key: string) => STRINGS[key] ? STRINGS[key][lang] : key;

  // --- POS Logic ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const vat = subtotal * TAX_RATE;
    const total = subtotal + vat;

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      vat,
      total
    };

    setTransactions(prev => [...prev, transaction]);
    setLastTransaction(transaction);
    setCart([]);
    
    // Trigger Print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.nameEn.toLowerCase().includes(q) || 
      p.nameAr.includes(q) || 
      p.barcode.includes(q)
    );
  }, [products, searchQuery]);

  // Barcode Listener
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = searchQuery.trim();
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        addToCart(product);
        setSearchQuery(''); // Clear after scan
      }
    }
  };

  // --- Reports Logic ---
  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
    const totalTx = transactions.length;
    
    // Daily Sales for Chart
    const salesByDate = transactions.reduce((acc, t) => {
      const date = new Date(t.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + t.total;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount
    })).slice(-7); // Last 7 days

    return { totalRevenue, totalTx, chartData };
  }, [transactions]);


  // --- Sub-components ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: View, icon: any, label: string }) => (
    <button
      onClick={() => setView(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        view === id 
          ? 'bg-primary text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // --- Products Page Logic ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      barcode: formData.get('barcode') as string,
      nameEn: formData.get('nameEn') as string,
      nameAr: formData.get('nameAr') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === p.id && p.id === newProduct.id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // --- Render ---

  const isRTL = lang === 'ar';
  
  return (
    <div className={`min-h-screen bg-gray-50 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} font-sans`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Print Component */}
      <Invoice transaction={lastTransaction} lang={lang} />

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-x border-gray-200 flex flex-col sticky top-0 h-screen z-10 transition-all">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
          <div className="bg-primary text-white p-2 rounded-lg">
            <LayoutDashboard size={24} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight text-gray-800">POS<span className="text-primary">Pro</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem id="pos" icon={ShoppingCart} label={t('pos')} />
          <SidebarItem id="products" icon={Package} label={t('products')} />
          <SidebarItem id="reports" icon={BarChart3} label={t('reports')} />
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
           <button 
             onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
             className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
           >
             <Languages size={20} />
             <span className="hidden lg:inline">{lang === 'en' ? 'العربية' : 'English'}</span>
           </button>
           
           <button 
             onClick={handleInstallClick}
             className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
             title={t('installApp')}
           >
             <Download size={20} />
             <span className="hidden lg:inline">{t('installApp')}</span>
           </button>

           <button 
             onClick={handleDownloadData}
             className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
             title={t('downloadData')}
           >
             <Save size={20} />
             <span className="hidden lg:inline">{t('downloadData')}</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8">
        {/* POS View */}
        {view === 'pos' && (
          <div className="h-full flex flex-col lg:flex-row gap-6">
            {/* Product Grid */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-4 items-center">
                <Search className="text-gray-400" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  placeholder={t('searchPlaceholder')}
                  className="flex-1 bg-transparent outline-none text-lg"
                  autoFocus
                />
                <ScanBarcode className="text-gray-400 hidden sm:block" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
                {filteredProducts.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary transition-all text-start flex flex-col h-full"
                  >
                    <div className="h-24 w-full bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-3xl select-none">
                      {/* Placeholder icon based on category logic could go here, sticking to emoji/text for speed */}
                      <span className="text-4xl">📦</span>
                    </div>
                    <h3 className="font-bold text-gray-800 line-clamp-2">{isRTL ? product.nameAr : product.nameEn}</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-2">{product.category}</p>
                    <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center w-full">
                      <span className="font-bold text-primary text-lg">{product.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-400">{t('currency')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-full lg:w-96 bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col h-[calc(100vh-4rem)] lg:h-auto lg:sticky lg:top-8">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <ShoppingCart className="text-primary" /> {t('pos')}
                </h2>
                <button 
                  onClick={() => setCart([])}
                  className="text-red-500 text-sm hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
                >
                  {t('clearCart')}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50">
                    <ShoppingCart size={48} />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800">{isRTL ? item.nameAr : item.nameEn}</h4>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-emerald-600"
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                        <X size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-gray-50 rounded-b-3xl border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>{t('subtotal')}</span>
                  <span>{cart.reduce((a,c) => a + c.price * c.quantity, 0).toFixed(2)} {t('currency')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('vat')}</span>
                  <span>{(cart.reduce((a,c) => a + c.price * c.quantity, 0) * TAX_RATE).toFixed(2)} {t('currency')}</span>
                </div>
                <div className="flex justify-between font-bold text-2xl text-gray-900 pt-3 border-t border-gray-200">
                  <span>{t('total')}</span>
                  <span>
                    {(cart.reduce((a,c) => a + c.price * c.quantity, 0) * (1 + TAX_RATE)).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500 ml-1">{t('currency')}</span>
                  </span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  <CreditCard size={20} />
                  {t('checkout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products View */}
        {view === 'products' && (
          <div className="max-w-6xl mx-auto">
             <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">{t('products')}</h1>
              <button 
                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                className="bg-primary hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-emerald-200"
              >
                <Plus size={20} />
                {t('addProduct')}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-start font-medium">{t('barcode')}</th>
                      <th className="px-6 py-4 text-start font-medium">{t('nameEn')}</th>
                      <th className="px-6 py-4 text-start font-medium">{t('nameAr')}</th>
                      <th className="px-6 py-4 text-start font-medium">{t('price')}</th>
                      <th className="px-6 py-4 text-start font-medium">{t('category')}</th>
                      <th className="px-6 py-4 text-end font-medium">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600">{product.barcode}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{product.nameEn}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 font-arabic">{product.nameAr}</td>
                        <td className="px-6 py-4 text-primary font-bold">{product.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports View */}
        {view === 'reports' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">{t('reports')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-gray-500 mb-2">{t('totalRevenue')}</div>
                <div className="text-3xl font-bold text-primary">{stats.totalRevenue.toFixed(2)} <span className="text-sm text-gray-400">{t('currency')}</span></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-gray-500 mb-2">{t('totalTransactions')}</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalTx}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6 text-gray-800">{t('dailySales')}</h2>
              <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingProduct ? t('edit') : t('addProduct')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('barcode')}</label>
                  <input required name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
                  <input required type="number" step="0.01" name="price" defaultValue={editingProduct?.price} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameEn')}</label>
                  <input required name="nameEn" defaultValue={editingProduct?.nameEn} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
                <div dir="rtl">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameAr')}</label>
                  <input required name="nameAr" defaultValue={editingProduct?.nameAr} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-arabic" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
                <select name="category" defaultValue={editingProduct?.category || 'General'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white">
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Household">Household</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}