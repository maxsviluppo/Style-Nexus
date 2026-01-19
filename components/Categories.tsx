import React, { useState } from 'react';
import { Category } from '../types';
import { ToggleLeft, ToggleRight, FolderTree } from 'lucide-react';

const initialCategories: Category[] = [
  { id: '1', name: 'Uomo', isActive: true },
  { id: '2', name: 'Donna', isActive: true },
  { id: '3', name: 'Bambino', isActive: false },
  { id: '4', name: 'Neonati', isActive: false },
  { id: '5', name: 'Accessori', isActive: true },
  { id: '6', name: 'Outlet', isActive: true },
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const toggleCategory = (id: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestione Categorie</h2>
          <p className="text-slate-500">Configura la visibilità delle macro-categorie in negozio.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          + Nuova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className={`p-6 rounded-xl border transition-all ${cat.isActive ? 'bg-white border-indigo-100 shadow-md' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${cat.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                  <FolderTree size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{cat.name}</h3>
                  <p className={`text-xs font-medium ${cat.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                    {cat.isActive ? 'Attiva' : 'Disattivata'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => toggleCategory(cat.id)}
                className={`transition-colors duration-200 ${cat.isActive ? 'text-indigo-600 hover:text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {cat.isActive ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 flex justify-between">
              <span>Prodotti: 124</span>
              <span>Visite: 1.2k</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;