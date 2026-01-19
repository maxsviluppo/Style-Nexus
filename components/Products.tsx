import React, { useState, useRef } from 'react';
import { Product, ProductVariant } from '../types';
import { 
  Plus, Search, Edit2, Trash2, X, Save, Package, 
  Upload, ScanLine, Loader2, ArrowUpCircle, ArrowDownCircle,
  Grid3X3, Wand2, Sparkles
} from 'lucide-react';
import { analyzeProductImage, generateProductDescription } from '../services/geminiService';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Edit State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [matrixSizes, setMatrixSizes] = useState('');
  const [matrixColors, setMatrixColors] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // AI & Upload States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner States
  const [scanMode, setScanMode] = useState<'SELL' | 'STOCK'>('SELL');
  const [scannedCode, setScannedCode] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    productName: string;
    variantInfo: string;
    action: string;
    newStock: number;
    imageUrl: string;
  } | null>(null);

  // --- Helpers ---
  const calculateTotalStock = (p: Product) => p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;

  // --- AI Description Generator ---
  const handleGenerateDescription = async () => {
    if (!currentProduct.name) {
      alert("Inserisci almeno il nome del prodotto.");
      return;
    }
    setIsGeneratingDesc(true);
    const desc = await generateProductDescription(currentProduct);
    if (desc) {
      setCurrentProduct(prev => ({ ...prev, description: desc }));
    }
    setIsGeneratingDesc(false);
  };

  // --- CRUD Handlers ---
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(JSON.parse(JSON.stringify(product))); 
    } else {
      setCurrentProduct({
        name: '',
        category: 'Uomo',
        price: 0,
        imageUrl: 'https://picsum.photos/400/500?random=' + Math.floor(Math.random() * 1000),
        material: '',
        variants: []
      });
    }
    setMatrixSizes('');
    setMatrixColors('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!currentProduct.name) return;
    const productToSave = {
      ...currentProduct,
      variants: currentProduct.variants || []
    } as Product;

    if (currentProduct.id) {
      setProducts(products.map(p => p.id === currentProduct.id ? productToSave : p));
    } else {
      const newProduct = { ...productToSave, id: Date.now().toString() };
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Eliminare prodotto e tutte le varianti?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // --- Matrix Generator Logic ---
  const generateVariants = () => {
    const sizes = matrixSizes.split(',').map(s => s.trim()).filter(s => s);
    const colors = matrixColors.split(',').map(c => c.trim()).filter(c => c);

    if (sizes.length === 0 || colors.length === 0) {
      alert("Inserisci almeno una taglia e un colore separati da virgola.");
      return;
    }
    const newVariants: ProductVariant[] = [];
    const existingVariants = currentProduct.variants || [];
    let counter = 1;
    for (const size of sizes) {
      for (const color of colors) {
        const exists = existingVariants.find(v => v.size === size && v.color === color);
        if (!exists) {
          newVariants.push({
            id: `new_${Date.now()}_${counter++}`,
            size,
            color,
            stock: 0,
            barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() 
          });
        }
      }
    }
    setCurrentProduct({ ...currentProduct, variants: [...existingVariants, ...newVariants] });
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    const updatedVariants = currentProduct.variants?.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    );
    setCurrentProduct({ ...currentProduct, variants: updatedVariants });
  };

  const removeVariant = (id: string) => {
    setCurrentProduct({ ...currentProduct, variants: currentProduct.variants?.filter(v => v.id !== id) });
  };

  // --- AI & Bulk Upload ---
  const handleBulkUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsAnalyzing(true);
    const newProducts: Product[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        const analysis = await analyzeProductImage(base64);
        if (analysis) {
          const suggestedVariants: ProductVariant[] = [];
          const sizes = analysis.suggested_sizes || ['One Size'];
          const colors = analysis.detected_colors || ['Standard'];
          let vCount = 1;
          sizes.slice(0, 3).forEach((s: string) => { 
            colors.slice(0, 2).forEach((c: string) => { 
               suggestedVariants.push({
                 id: `${Date.now()}_${i}_${vCount++}`,
                 size: s,
                 color: c,
                 stock: 5,
                 barcode: Math.floor(Math.random() * 1000000000000).toString()
               });
            });
          });
          newProducts.push({
            id: Date.now().toString() + i,
            name: analysis.name || 'Prodotto Importato',
            description: analysis.description || '',
            category: analysis.category || 'Accessori',
            price: 0,
            imageUrl: URL.createObjectURL(file),
            material: analysis.material || '',
            variants: suggestedVariants
          });
        }
      } catch (e) { console.error("Error analyzing file", e); }
    }
    setProducts(prev => [...prev, ...newProducts]);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`${newProducts.length} prodotti importati!`);
  };

  // --- Barcode Scanner Logic ---
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode) return;
    let foundProduct: Product | undefined;
    let foundVariant: ProductVariant | undefined;
    for (const p of products) {
      const v = p.variants.find(v => v.barcode === scannedCode);
      if (v) { foundProduct = p; foundVariant = v; break; }
    }
    if (foundProduct && foundVariant) {
      let newStock = foundVariant.stock;
      if (scanMode === 'SELL') {
        if (newStock > 0) newStock--;
        else { alert("Esaurito!"); setScannedCode(''); return; }
      } else { newStock++; }
      const updatedProducts = products.map(p => {
        if (p.id === foundProduct!.id) {
          return { ...p, variants: p.variants.map(v => v.id === foundVariant!.id ? { ...v, stock: newStock } : v) };
        }
        return p;
      });
      setProducts(updatedProducts);
      setLastScannedResult({
        productName: foundProduct.name,
        variantInfo: `${foundVariant.color} / ${foundVariant.size}`,
        action: scanMode === 'SELL' ? '-1 (Vendita)' : '+1 (Carico)',
        newStock: newStock,
        imageUrl: foundProduct.imageUrl
      });
      setScannedCode('');
    } else {
      alert("Codice non trovato!");
      setScannedCode('');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.variants.some(v => v.barcode.includes(searchTerm));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFilesSelected} />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Magazzino & Prodotti</h2>
          <p className="text-slate-500">Gestione inventario, anagrafica e analisi AI.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsScannerOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition flex items-center gap-2">
            <ScanLine size={20} /> Scanner Rapido
          </button>
          <button onClick={handleBulkUploadClick} disabled={isAnalyzing} className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2">
            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />} {isAnalyzing ? 'Analisi...' : 'Import AI'}
          </button>
          <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
            <Plus size={20} /> Nuovo
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <Search className="text-slate-400" size={20} />
          <input type="text" placeholder="Cerca prodotto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 outline-none bg-transparent" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none">
          <option value="All">Tutte</option><option value="Uomo">Uomo</option><option value="Donna">Donna</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr><th className="p-4 text-sm text-slate-600">Prodotto</th><th className="p-4 text-sm text-slate-600">Varianti</th><th className="p-4 text-sm text-slate-600">Stock Totale</th><th className="p-4 text-right text-sm text-slate-600">Azioni</th></tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 flex items-center gap-3">
                  <img src={p.imageUrl} className="w-10 h-12 object-cover rounded bg-slate-200" alt="" />
                  <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.category}</div></div>
                </td>
                <td className="p-4 text-xs text-slate-500">{p.variants.length} Varianti</td>
                <td className="p-4 font-bold">{calculateTotalStock(p)}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800">{currentProduct.id ? 'Modifica' : 'Nuovo'} Prodotto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1">
                    <img src={currentProduct.imageUrl} className="w-full aspect-[3/4] object-cover rounded-xl border border-slate-200" />
                 </div>
                 <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500">Nome</label>
                        <input type="text" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500">Cat</label>
                        <select value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                          <option>Uomo</option><option>Donna</option><option>Bambino</option><option>Accessori</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500">Materiale</label>
                        <input type="text" value={currentProduct.material || ''} onChange={e => setCurrentProduct({...currentProduct, material: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                      </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-500">Descrizione</label>
                          <button 
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc || !currentProduct.name}
                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-100 transition disabled:opacity-50"
                          >
                            {isGeneratingDesc ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            Genera Descrizione AI
                          </button>
                        </div>
                        <textarea value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg h-24 text-sm" placeholder="Scrivi o genera con AI..." />
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-4"><Grid3X3 size={20} /> Generatore Matrice Varianti</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                   <input type="text" placeholder="Taglie (S, M, L)" value={matrixSizes} onChange={e => setMatrixSizes(e.target.value)} className="w-full p-2 border border-indigo-200 rounded-lg" />
                   <input type="text" placeholder="Colori (Rosso, Blu)" value={matrixColors} onChange={e => setMatrixColors(e.target.value)} className="w-full p-2 border border-indigo-200 rounded-lg" />
                   <button onClick={generateVariants} className="bg-indigo-600 text-white p-2 rounded-lg font-bold">Genera Combinazioni</button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Lista Varianti & Stock (EAN Specifico)</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Taglia</th><th className="p-3">Colore</th><th className="p-3">Barcode</th><th className="p-3">Stock</th><th className="p-3 text-right">Del</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentProduct.variants?.map((v) => (
                        <tr key={v.id}>
                          <td className="p-3"><input value={v.size} onChange={(e) => updateVariant(v.id, 'size', e.target.value)} className="w-16 p-1 border rounded" /></td>
                          <td className="p-3"><input value={v.color} onChange={(e) => updateVariant(v.id, 'color', e.target.value)} className="w-24 p-1 border rounded" /></td>
                          <td className="p-3"><input value={v.barcode} onChange={(e) => updateVariant(v.id, 'barcode', e.target.value)} className="w-32 p-1 border rounded font-mono" /></td>
                          <td className="p-3"><input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value))} className="w-20 p-1 border rounded text-center font-bold" /></td>
                          <td className="p-3 text-right"><button onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600"><X size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 bg-slate-50 border-t border-slate-200">
                    <button onClick={() => setCurrentProduct({...currentProduct, variants: [...(currentProduct.variants || []), { id: `m_${Date.now()}`, size: 'U', color: 'Base', stock: 0, barcode: Math.floor(Math.random()*100000).toString() }]})} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={14} /> Riga Manuale</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Annulla</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Save size={18} /> Salva</button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 flex flex-col gap-6 items-center">
             <h3 className="text-xl font-bold flex items-center gap-2"><ScanLine /> Scanner Rapido</h3>
             <div className="flex gap-2 w-full">
               <button onClick={() => setScanMode('SELL')} className={`flex-1 py-3 rounded-lg border font-bold ${scanMode==='SELL'?'bg-red-500 text-white':'bg-slate-50 text-slate-500'}`}>VENDITA</button>
               <button onClick={() => setScanMode('STOCK')} className={`flex-1 py-3 rounded-lg border font-bold ${scanMode==='STOCK'?'bg-green-500 text-white':'bg-slate-50 text-slate-500'}`}>CARICO</button>
             </div>
             <form onSubmit={handleBarcodeSubmit} className="w-full"><input autoFocus value={scannedCode} onChange={(e) => setScannedCode(e.target.value)} placeholder="Barcode..." className="w-full text-center text-2xl p-4 border-2 border-indigo-500 rounded-xl" /></form>
             <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 underline">Chiudi</button>
             {lastScannedResult && <div className="text-center"><div>{lastScannedResult.productName}</div><div className="font-bold text-lg">{lastScannedResult.action}</div></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;