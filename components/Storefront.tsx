import React from 'react';
import { Product } from '../types';
import { ShoppingCart } from 'lucide-react';

const mockProducts: Product[] = [
  { 
    id: '1', 
    name: 'Cappotto Lana Merino', 
    category: 'Uomo', 
    price: 129.99, 
    imageUrl: 'https://picsum.photos/400/500?random=1',
    material: 'Lana',
    variants: [
      { id: '1a', size: 'M', color: 'Nero', stock: 5, barcode: '8001' },
      { id: '1b', size: 'L', color: 'Nero', stock: 10, barcode: '8002' }
    ]
  },
  { 
    id: '2', 
    name: 'Vestito Floreale', 
    category: 'Donna', 
    price: 59.99, 
    imageUrl: 'https://picsum.photos/400/500?random=2',
    variants: [
      { id: '2a', size: 'S', color: 'Multicolor', stock: 12, barcode: '8003' },
      { id: '2b', size: 'M', color: 'Multicolor', stock: 20, barcode: '8004' }
    ]
  },
  { 
    id: '3', 
    name: 'Jeans Slim Fit', 
    category: 'Uomo', 
    price: 49.99, 
    imageUrl: 'https://picsum.photos/400/500?random=3',
    variants: [
      { id: '3a', size: '32', color: 'Denim', stock: 45, barcode: '8005' }
    ]
  },
  { 
    id: '4', 
    name: 'T-Shirt Grafica', 
    category: 'Bambino', 
    price: 19.99, 
    imageUrl: 'https://picsum.photos/400/500?random=4',
    variants: [
       { id: '4a', size: '10Y', color: 'Bianco', stock: 100, barcode: '8006' }
    ]
  },
];

const Storefront: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vetrina Digitale</h2>
          <p className="text-slate-500">Anteprima di come i clienti vedono i prodotti.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option>Tutte le categorie</option>
            <option>Uomo</option>
            <option>Donna</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockProducts.map((product) => {
          const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
          return (
            <div key={product.id} className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
              <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {product.category}
                </div>
                {totalStock < 10 && (
                  <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm animate-pulse">
                    Ultimi {totalStock}
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-indigo-600">€{product.price}</span>
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Storefront;