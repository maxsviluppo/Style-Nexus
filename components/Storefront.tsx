import React from 'react';
import { Product } from '../types';
import { Tag, ShoppingCart } from 'lucide-react';

const mockProducts: Product[] = [
  { id: '1', name: 'Cappotto Lana Merino', category: 'Uomo', price: 129.99, stock: 15, imageUrl: 'https://picsum.photos/400/500?random=1' },
  { id: '2', name: 'Vestito Floreale Estivo', category: 'Donna', price: 59.99, stock: 32, imageUrl: 'https://picsum.photos/400/500?random=2' },
  { id: '3', name: 'Jeans Slim Fit', category: 'Uomo', price: 49.99, stock: 45, imageUrl: 'https://picsum.photos/400/500?random=3' },
  { id: '4', name: 'T-Shirt Grafica', category: 'Bambino', price: 19.99, stock: 100, imageUrl: 'https://picsum.photos/400/500?random=4' },
  { id: '5', name: 'Borsa in Pelle', category: 'Accessori', price: 89.99, stock: 8, imageUrl: 'https://picsum.photos/400/500?random=5' },
  { id: '6', name: 'Sneakers Urban', category: 'Uomo', price: 79.99, stock: 22, imageUrl: 'https://picsum.photos/400/500?random=6' },
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
        {mockProducts.map((product) => (
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
              {product.stock < 10 && (
                <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm animate-pulse">
                  Ultimi {product.stock}
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
        ))}
      </div>
    </div>
  );
};

export default Storefront;