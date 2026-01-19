import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { 
  Plus, Search, Edit2, Trash2, X, Save, Package, 
  Upload, ScanLine, Filter, Loader2, ArrowUpCircle, ArrowDownCircle 
} from 'lucide-react';
import { analyzeProductImage } from '../services/geminiService';

const initialProducts: Product[] = [
  { 
    id: '1', 
    name: 'Cappotto Lana Merino', 
    category: 'Uomo', 
    price: 129.99, 
    stock: 15, 
    imageUrl: 'https://picsum.photos/400/500?random=1',
    size: 'M, L, XL',
    color: 'Nero',
    material: '100% Lana Merino',
    barcode: '8001001001'
  },
  { 
    id: '2', 
    name: 'Vestito Floreale Estivo', 
    category: 'Donna', 
    price: 59.99, 
    stock: 32, 
    imageUrl: 'https://picsum.photos/400/500?random=2',
    size: 'S, M',
    color: 'Multicolor',
    material: 'Cotone',
    barcode: '8001001002'
  },
  { 
    id: '3', 
    name: 'Jeans Slim Fit', 
    category: 'Uomo', 
    price: 49.99, 
    stock: 5, 
    imageUrl: 'https://picsum.photos/400/500?random=3',
    size: '30, 32, 34',
    color: 'Blu Denim',
    material: 'Denim',
    barcode: '8001001003'
  }
];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStock, setFilterStock] = useState('All');

  // AI & Upload States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner States
  const [scanMode, setScanMode] = useState<'SELL' | 'STOCK'>('SELL');
  const [scannedCode, setScannedCode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct({ ...product });
    } else {
      setCurrentProduct({
        name: '',
        category: 'Uomo',
        price: 0,
        stock: 0,
        imageUrl: 'https://picsum.photos/400/500?random=' + Math.floor(Math.random() * 1000),
        size: '',
        color: '',
        material: '',
        barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString()
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!currentProduct.name) return;

    if (currentProduct.id) {
      setProducts(products.map(p => p.id === currentProduct.id ? currentProduct as Product : p));
    } else {
      const newProduct = {
        ...currentProduct,
        id: Date.now().toString()
      } as Product;
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    const newProducts: Product[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await convertFileToBase64(file);
        const analysis = await analyzeProductImage(base64);
        
        const previewUrl = URL.createObjectURL(file);

        if (analysis) {
          newProducts.push({
            id: Date.now().toString() + i,
            name: analysis.name || 'Prodotto Importato',
            description: analysis.description || '',
            category: analysis.category || 'Accessori',
            price: 0,
            stock: 1,
            imageUrl: previewUrl,
            size: '',
            color: analysis.color || '',
            material: analysis.material || '',
            barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString()
          });
        }
      } catch (e) {
        console.error("Skipped file due to error", e);
      }
    }

    setProducts(prev => [...prev, ...newProducts]);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`${newProducts.length} prodotti importati e analizzati con successo! Controlla prezzi e taglie.`);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode) return;

    const product = products.find(p => p.barcode === scannedCode);
    
    if (product) {
      let newStock = product.stock;
      if (scanMode === 'SELL') {
        if (newStock > 0) newStock--;
        else {
          alert("Attenzione: Prodotto esaurito!");
          setScannedCode('');
          return;
        }
      } else {
        newStock++;
      }

      const updatedProduct = { ...product, stock: newStock };
      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
      setLastScannedProduct(updatedProduct);
      setScannedCode('');
    } else {
      alert("Prodotto non trovato!");
      setScannedCode('');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    
    let matchesStock = true;
    if (filterStock === 'Low') matchesStock = p.stock > 0 && p.stock < 10;
    if (filterStock === 'Out') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFilesSelected}
      />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestione Magazzino</h2>
          <p className="text-slate-500">Prodotti, giacenze e carico/scarico merci.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition flex items-center gap-2"
          >
            <ScanLine size={20} />
            Scanner Barcode
          </button>
          
          <button 
            onClick={handleBulkUploadClick}
            disabled={isAnalyzing}
            className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {isAnalyzing ? 'Analisi AI in corso...' : 'Smart Import Foto'}
          </button>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Nuovo
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cerca nome, barcode, colore..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-slate-700 bg-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="All">Tutte le Categorie</option>
            <option value="Uomo">Uomo</option>
            <option value="Donna">Donna</option>
            <option value="Bambino">Bambino</option>
            <option value="Accessori">Accessori</option>
          </select>
        </div>

        <select 
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="All">Tutte le Giacenze</option>
          <option value="Low">In Esaurimento (&lt; 10)</option>
          <option value="Out">Esauriti (0)</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600 text-sm">Articolo</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Info & Barcode</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Attributi</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Prezzo</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Giacenza</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-12 h-16 rounded bg-slate-200 overflow-hidden relative border border-slate-200">
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.category}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded inline-block text-slate-600">
                        {product.barcode || 'N/A'}
                      </div>
                      {product.description && <div className="text-xs text-slate-400 truncate max-w-[150px]">{product.description}</div>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-500 space-y-1">
                      {product.size && <div><span className="font-medium">Tg:</span> {product.size}</div>}
                      {product.color && <div><span className="font-medium">Col:</span> {product.color}</div>}
                      {product.material && <div><span className="font-medium">Mat:</span> {product.material}</div>}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">€{product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-500' : 'text-slate-600'}`}>
                        {product.stock} pz.
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    Nessun prodotto trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {currentProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Prodotto</label>
                  <input 
                    type="text" 
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Es. Maglione Cashmere"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Barcode (EAN/UPC)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={currentProduct.barcode || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, barcode: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      placeholder="Scansiona o digita..."
                    />
                    <button 
                      onClick={() => setCurrentProduct({...currentProduct, barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString()})}
                      className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600"
                      title="Genera random"
                    >
                      <ScanLine size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select 
                    value={currentProduct.category}
                    onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Uomo">Uomo</option>
                    <option value="Donna">Donna</option>
                    <option value="Bambino">Bambino</option>
                    <option value="Neonati">Neonati</option>
                    <option value="Accessori">Accessori</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prezzo (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock (Quantità)</label>
                  <input 
                    type="number" 
                    value={currentProduct.stock}
                    onChange={(e) => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                 <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                  <textarea 
                    value={currentProduct.description || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                    placeholder="Breve descrizione..."
                  />
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Package size={16} />
                    Dettagli Specifici
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Taglia</label>
                      <input 
                        type="text" 
                        value={currentProduct.size || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, size: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Es. S, M, L"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Colore</label>
                      <input 
                        type="text" 
                        value={currentProduct.color || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, color: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Es. Rosso"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Materiale</label>
                      <input 
                        type="text" 
                        value={currentProduct.material || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, material: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Es. Cotone"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition"
              >
                Annulla
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
              >
                <Save size={18} />
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[600px]">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ScanLine /> Terminale Barcode
                </h3>
                <p className="text-slate-400 text-sm">Usa una pistola barcode o digita il codice</p>
              </div>
              <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 hover:text-white">
                <X size={28} />
              </button>
            </div>

            <div className="flex p-4 gap-4 bg-slate-100 border-b border-slate-200">
              <button 
                onClick={() => setScanMode('SELL')}
                className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${scanMode === 'SELL' ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                <ArrowDownCircle size={32} />
                <span className="font-bold">SCARICO / VENDITA</span>
              </button>
              <button 
                onClick={() => setScanMode('STOCK')}
                className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${scanMode === 'STOCK' ? 'bg-green-500 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                <ArrowUpCircle size={32} />
                <span className="font-bold">CARICO MERCE</span>
              </button>
            </div>

            <div className="p-8 flex-1 flex flex-col items-center justify-center space-y-8">
               <form onSubmit={handleBarcodeSubmit} className="w-full relative">
                  <input 
                    autoFocus
                    type="text"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    placeholder="Spara codice qui..."
                    className="w-full text-center text-3xl font-mono tracking-widest p-4 border-2 border-indigo-500 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-pulse">
                    <ScanLine size={24} />
                  </div>
               </form>

               {lastScannedProduct && (
                 <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4">
                      <img src={lastScannedProduct.imageUrl} className="w-16 h-20 object-cover rounded-lg bg-white shadow-sm" />
                      <div>
                        <div className="text-sm text-slate-500">Ultimo aggiornamento:</div>
                        <div className="font-bold text-lg text-slate-800">{lastScannedProduct.name}</div>
                        <div className={`font-mono font-bold ${scanMode === 'SELL' ? 'text-red-600' : 'text-green-600'}`}>
                           {scanMode === 'SELL' ? '-1' : '+1'} Unità
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Nuova Giacenza: <b>{lastScannedProduct.stock}</b>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="bg-slate-50 p-4 text-center text-slate-400 text-xs border-t border-slate-200">
              Premi INVIO per confermare se non usi uno scanner automatico
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;