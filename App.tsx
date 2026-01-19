import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Store, 
  Megaphone, 
  Settings,
  Menu,
  X,
  LogOut,
  Truck,
  CreditCard
} from 'lucide-react';
import { View, Product, Sale, StoreSettings } from './types';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import Marketing from './components/Marketing';
import Storefront from './components/Storefront';
import Products from './components/Products';
import SupplyChain from './components/SupplyChain';
import Sales from './components/Sales';
import Admin from './components/Admin';

// Initial Data
const initialProducts: Product[] = [
  { 
    id: '1', 
    name: 'Cappotto Lana Merino', 
    category: 'Uomo', 
    price: 129.99, 
    imageUrl: 'https://picsum.photos/400/500?random=1',
    material: '100% Lana Merino',
    variants: [
      { id: 'v1', size: 'M', color: 'Nero', stock: 5, barcode: '8001001' },
      { id: 'v2', size: 'L', color: 'Nero', stock: 8, barcode: '8001002' },
    ]
  },
  { 
    id: '2', 
    name: 'Vestito Floreale', 
    category: 'Donna', 
    price: 59.99, 
    imageUrl: 'https://picsum.photos/400/500?random=2',
    material: 'Cotone',
    variants: [
      { id: 'v4', size: 'S', color: 'Blu', stock: 15, barcode: '8002001' }
    ]
  }
];

const initialSettings: StoreSettings = {
    storeName: 'StyleNexus Boutique',
    address: 'Via della Moda 12, Milano',
    vatRate: 22,
    currency: '€'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.PRODUCTS:
        return <Products products={products} setProducts={setProducts} />;
      case View.SUPPLY_CHAIN:
        return <SupplyChain products={products} setProducts={setProducts} />;
      case View.CATEGORIES:
        return <Categories />;
      case View.MARKETING:
        return <Marketing products={products} />;
      case View.STOREFRONT:
        return <Storefront products={products} />;
      case View.SALES:
        return <Sales products={products} setProducts={setProducts} sales={sales} setSales={setSales} />;
      case View.ADMIN:
        return <Admin settings={settings} setSettings={setSettings} sales={sales} />;
      default:
        return <Dashboard />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {settings.storeName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Retail Management v2.1</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem view={View.SALES} icon={CreditCard} label="Vendita (POS)" />
          <NavItem view={View.PRODUCTS} icon={ShoppingBag} label="Magazzino" />
          <NavItem view={View.SUPPLY_CHAIN} icon={Truck} label="Fornitori & Carico" />
          <NavItem view={View.CATEGORIES} icon={Layers} label="Categorie" />
          <NavItem view={View.STOREFRONT} icon={Store} label="Vetrina" />
          <NavItem view={View.MARKETING} icon={Megaphone} label="Marketing AI" />
          <NavItem view={View.ADMIN} icon={Settings} label="Amministrazione" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 transition-colors">
            <LogOut size={20} />
            <span className="font-medium text-sm">Esci</span>
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h1 className="text-xl font-bold text-indigo-600">{settings.storeName}</h1>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
              <NavItem view={View.SALES} icon={CreditCard} label="Vendita" />
              <NavItem view={View.PRODUCTS} icon={ShoppingBag} label="Prodotti" />
              <NavItem view={View.STOREFRONT} icon={Store} label="Vetrina" />
              <NavItem view={View.ADMIN} icon={Settings} label="Admin" />
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600"><Menu size={24} /></button>
          <span className="font-bold text-slate-800">{settings.storeName}</span>
          <div className="w-6" />
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{renderView()}</div>
        </div>
      </main>
    </div>
  );
};

export default App;