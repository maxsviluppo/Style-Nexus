import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Eye, X, Scale } from 'lucide-react';

interface StorefrontProps {
  products?: Product[];
}

const Storefront: React.FC<StorefrontProps> = ({ products = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('Tutte le categorie');

  const filteredProducts = activeCategory === 'Tutte le categorie' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vetrina Digitale</h2>
          <p className="text-slate-500">Catalogo pubblico aggiornato in tempo reale.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option>Tutte le categorie</option>
            <option>Uomo</option>
            <option>Donna</option>
            <option>Bambino</option>
            <option>Accessori</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
          return (
            <div key={product.id} className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {product.category}
                </div>
                {totalStock < 5 && totalStock > 0 && (
                  <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm animate-pulse">
                    Ultimi pezzi
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white text-slate-800 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                    <Eye size={16}/> Vedi Dettagli
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-indigo-600">€{product.price.toFixed(2)}</span>
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="md:w-1/2 bg-slate-100 relative">
                 <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" />
                 <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full md:hidden"><X size={24}/></button>
              </div>
              <div className="md:w-1/2 p-8 overflow-y-auto">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{selectedProduct.category}</span>
                      <h2 className="text-3xl font-bold text-slate-900 mt-1">{selectedProduct.name}</h2>
                    </div>
                    <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 hidden md:block"><X size={28}/></button>
                 </div>
                 
                 <div className="text-2xl font-bold text-slate-800 mb-6">€{selectedProduct.price.toFixed(2)}</div>
                 
                 <div className="prose prose-slate text-sm text-slate-600 mb-8">
                    <p>{selectedProduct.description || "Nessuna descrizione disponibile."}</p>
                 </div>

                 <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <span className="font-semibold text-slate-700">Materiale:</span> {selectedProduct.material || 'N/A'}
                    </div>
                    {selectedProduct.weight && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Scale size={16} />
                        <span className="font-semibold text-slate-700">Peso:</span> {selectedProduct.weight} kg
                      </div>
                    )}
                 </div>

                 <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-800 mb-4">Varianti Disponibili</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {selectedProduct.variants.map(v => (
                         <div key={v.id} className={`p-3 rounded-lg border flex justify-between items-center ${v.stock > 0 ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
                            <div>
                               <div className="font-bold text-sm text-slate-800">{v.size} - {v.color}</div>
                               <div className="text-xs text-slate-400">EAN: {v.barcode}</div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded ${v.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {v.stock > 0 ? `${v.stock} pz` : 'Esaurito'}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-8 hover:bg-slate-800 transition">
                    Aggiungi al Carrello
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Storefront;