import React, { useState, useRef } from 'react';
import { Product, ProductVariant } from '../types';
import { 
  Plus, Search, Edit2, Trash2, X, Save, Package, 
  Upload, ScanLine, Filter, Loader2, ArrowUpCircle, ArrowDownCircle,
  Copy, Grid3X3, Wand2
} from 'lucide-react';
import { analyzeProductImage } from '../services/geminiService';

// Initial Mock Data with Variants
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
      { id: 'v3', size: 'XL', color: 'Nero', stock: 2, barcode: '8001003' },
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
      { id: 'v4', size: 'S', color: 'Fiori Blu', stock: 15, barcode: '8002001' },
      { id: 'v5', size: 'M', color: 'Fiori Blu', stock: 17, barcode: '8002002' }
    ]
  }
];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Edit State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  // Helper state for the matrix generator in the modal
  const [matrixSizes, setMatrixSizes] = useState('');
  const [matrixColors, setMatrixColors] = useState('');
  
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

  // --- CRUD Handlers ---

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(JSON.parse(JSON.stringify(product))); // Deep copy
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

    // Ensure variants exist
    const productToSave = {
      ...currentProduct,
      variants: currentProduct.variants || []
    } as Product;

    if (currentProduct.id) {
      setProducts(products.map(p => p.id === currentProduct.id ? productToSave : p));
    } else {
      const newProduct = {
        ...productToSave,
        id: Date.now().toString()
      };
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
    
    // Create Cartesian Product
    let counter = 1;
    for (const size of sizes) {
      for (const color of colors) {
        // Check if exists to avoid duplicates (optional, simplistic check)
        const exists = existingVariants.find(v => v.size === size && v.color === color);
        if (!exists) {
          newVariants.push({
            id: `new_${Date.now()}_${counter++}`,
            size,
            color,
            stock: 0,
            barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() // Random EAN-13 ish
          });
        }
      }
    }

    setCurrentProduct({
      ...currentProduct,
      variants: [...existingVariants, ...newVariants]
    });
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    const updatedVariants = currentProduct.variants?.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    );
    setCurrentProduct({ ...currentProduct, variants: updatedVariants });
  };

  const removeVariant = (id: string) => {
    setCurrentProduct({
      ...currentProduct,
      variants: currentProduct.variants?.filter(v => v.id !== id)
    });
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
          // Auto-generate variants from AI suggestions
          const suggestedVariants: ProductVariant[] = [];
          const sizes = analysis.suggested_sizes || ['One Size'];
          const colors = analysis.detected_colors || ['Standard'];
          
          let vCount = 1;
          sizes.slice(0, 3).forEach((s: string) => { // Limit to 3 sizes for demo
            colors.slice(0, 2).forEach((c: string) => { // Limit to 2 colors
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
      } catch (e) {
        console.error("Error analyzing file", e);
      }
    }

    setProducts(prev => [...prev, ...newProducts]);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`${newProducts.length} prodotti importati con varianti suggerite!`);
  };

  // --- Barcode Scanner Logic (Variant Aware) ---

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode) return;

    // Find product AND specific variant
    let foundProduct: Product | undefined;
    let foundVariant: ProductVariant | undefined;

    for (const p of products) {
      const v = p.variants.find(v => v.barcode === scannedCode);
      if (v) {
        foundProduct = p;
        foundVariant = v;
        break;
      }
    }
    
    if (foundProduct && foundVariant) {
      let newStock = foundVariant.stock;
      if (scanMode === 'SELL') {
        if (newStock > 0) newStock--;
        else {
          alert("Attenzione: Variante esaurita!");
          setScannedCode('');
          return;
        }
      } else {
        newStock++;
      }

      // Update State Deeply
      const updatedProducts = products.map(p => {
        if (p.id === foundProduct!.id) {
          return {
            ...p,
            variants: p.variants.map(v => v.id === foundVariant!.id ? { ...v, stock: newStock } : v)
          };
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
      alert("Codice a barre non trovato nel sistema!");
      setScannedCode('');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some(v => v.barcode.includes(searchTerm)) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFilesSelected} />

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Magazzino Intelligente</h2>
          <p className="text-slate-500">Gestione prodotti con varianti (Taglie/Colori) e AI.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsScannerOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition flex items-center gap-2">
            <ScanLine size={20} />
            Scanner Barcode
          </button>
          
          <button onClick={handleBulkUploadClick} disabled={isAnalyzing} className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2">
            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            {isAnalyzing ? 'Analisi in corso...' : 'Import AI Multiplo'}
          </button>

          <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
            <Plus size={20} />
            Nuovo Prodotto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cerca nome, EAN variante, colore..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-slate-700 bg-transparent"
          />
        </div>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="All">Tutte le Categorie</option>
          <option value="Uomo">Uomo</option>
          <option value="Donna">Donna</option>
          <option value="Bambino">Bambino</option>
          <option value="Accessori">Accessori</option>
        </select>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-slate-600 text-sm">Prodotto</th>
              <th className="p-4 text-slate-600 text-sm">Varianti (Taglie/Colori)</th>
              <th className="p-4 text-slate-600 text-sm">Prezzo Base</th>
              <th className="p-4 text-slate-600 text-sm">Giacenza Tot.</th>
              <th className="p-4 text-right text-slate-600 text-sm">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const totalStock = calculateTotalStock(product);
              const uniqueColors = Array.from(new Set(product.variants.map(v => v.color))).join(', ');
              const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size))).join(', ');

              return (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-12 h-16 rounded bg-slate-200 overflow-hidden relative border border-slate-200">
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.category} • {product.material}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex gap-2">
                        <span className="font-semibold w-10">Col:</span> 
                        <span className="text-slate-800">{uniqueColors || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-semibold w-10">Tg:</span> 
                        <span className="bg-slate-100 px-1 rounded">{uniqueSizes || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {product.variants.length} SKU attivi
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">€{product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${totalStock > 10 ? 'bg-green-500' : totalStock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span className="font-bold text-slate-700">{totalStock}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal - Advanced Product & Variants */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800">
                {currentProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Section 1: General Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Image */}
                 <div className="md:col-span-1">
                    <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                       <img src={currentProduct.imageUrl} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button className="bg-white text-slate-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Cambia Foto</button>
                       </div>
                    </div>
                 </div>

                 {/* Fields */}
                 <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nome Prodotto</label>
                        <input 
                          type="text" 
                          value={currentProduct.name} 
                          onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg mt-1 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                        <select 
                          value={currentProduct.category}
                          onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg mt-1 outline-none bg-white"
                        >
                          <option>Uomo</option><option>Donna</option><option>Bambino</option><option>Accessori</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Materiale</label>
                        <input 
                          type="text" 
                          value={currentProduct.material || ''} 
                          onChange={e => setCurrentProduct({...currentProduct, material: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg mt-1 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Prezzo Base (€)</label>
                        <input 
                          type="number" 
                          value={currentProduct.price} 
                          onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                          className="w-full p-2 border border-slate-200 rounded-lg mt-1 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Descrizione</label>
                        <textarea 
                          value={currentProduct.description || ''} 
                          onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg mt-1 outline-none h-20 resize-none text-sm"
                        />
                    </div>
                 </div>
              </div>

              {/* Section 2: Rapid Variant Generator */}
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
                  <Grid3X3 size={20} /> Generatore Matrice Varianti
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                   <div>
                     <label className="text-xs font-bold text-indigo-700 uppercase mb-1 block">Taglie (CSV)</label>
                     <input 
                       type="text" 
                       placeholder="Es. S, M, L, XL" 
                       value={matrixSizes}
                       onChange={e => setMatrixSizes(e.target.value)}
                       className="w-full p-2 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-indigo-700 uppercase mb-1 block">Colori (CSV)</label>
                     <input 
                       type="text" 
                       placeholder="Es. Rosso, Blu, Verde" 
                       value={matrixColors}
                       onChange={e => setMatrixColors(e.target.value)}
                       className="w-full p-2 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                     />
                   </div>
                   <button 
                    onClick={generateVariants}
                    className="bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                   >
                     Genera Combinazioni
                   </button>
                </div>
                <p className="text-xs text-indigo-500 mt-2">
                  L'AI può suggerire questi valori se importi un'immagine. Questo strumento creerà una riga per ogni combinazione Taglia x Colore.
                </p>
              </div>

              {/* Section 3: Variants Table */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Lista Varianti & Stock</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3">Taglia</th>
                        <th className="p-3">Colore</th>
                        <th className="p-3">Barcode (EAN)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentProduct.variants?.map((v) => (
                        <tr key={v.id}>
                          <td className="p-3">
                            <input 
                              value={v.size} 
                              onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                              className="w-16 p-1 border border-slate-200 rounded bg-transparent" 
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              value={v.color} 
                              onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                              className="w-24 p-1 border border-slate-200 rounded bg-transparent" 
                            />
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            <input 
                              value={v.barcode} 
                              onChange={(e) => updateVariant(v.id, 'barcode', e.target.value)}
                              className="w-32 p-1 border border-slate-200 rounded bg-transparent" 
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="number"
                              value={v.stock} 
                              onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value))}
                              className="w-20 p-1 border border-slate-200 rounded text-center font-bold text-slate-700" 
                            />
                          </td>
                          <td className="p-3 text-right">
                             <button onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600">
                               <X size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {(!currentProduct.variants || currentProduct.variants.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            Nessuna variante. Usa il generatore sopra o aggiungi manualmente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="p-2 bg-slate-50 border-t border-slate-200">
                    <button 
                      onClick={() => setCurrentProduct({
                        ...currentProduct, 
                        variants: [...(currentProduct.variants || []), { id: `manual_${Date.now()}`, size: 'UNI', color: 'Base', stock: 0, barcode: Math.floor(Math.random()*1000000).toString() }]
                      })}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Aggiungi Riga Manuale
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Annulla</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <Save size={18} /> Salva Prodotto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[600px]">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><ScanLine /> Terminale Veloce</h3>
                <p className="text-slate-400 text-sm">Pronto a scansionare EAN Varianti</p>
              </div>
              <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 hover:text-white"><X size={28} /></button>
            </div>

            <div className="flex p-4 gap-4 bg-slate-100 border-b border-slate-200">
              <button onClick={() => setScanMode('SELL')} className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${scanMode === 'SELL' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-slate-500'}`}>
                <ArrowDownCircle size={32} /> <span className="font-bold">VENDITA</span>
              </button>
              <button onClick={() => setScanMode('STOCK')} className={`flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${scanMode === 'STOCK' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-slate-500'}`}>
                <ArrowUpCircle size={32} /> <span className="font-bold">CARICO</span>
              </button>
            </div>

            <div className="p-8 flex-1 flex flex-col items-center justify-center space-y-6">
               <form onSubmit={handleBarcodeSubmit} className="w-full relative">
                  <input autoFocus type="text" value={scannedCode} onChange={(e) => setScannedCode(e.target.value)} placeholder="Spara barcode qui..." className="w-full text-center text-3xl font-mono tracking-widest p-4 border-2 border-indigo-500 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none" />
               </form>

               {lastScannedResult && (
                 <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 flex gap-4">
                    <img src={lastScannedResult.imageUrl} className="w-20 h-24 object-cover rounded bg-white" />
                    <div className="flex-1">
                      <div className="font-bold text-lg text-slate-800">{lastScannedResult.productName}</div>
                      <div className="text-sm font-mono bg-slate-200 inline-block px-2 rounded mb-1">{lastScannedResult.variantInfo}</div>
                      <div className={`font-bold text-xl ${lastScannedResult.action.includes('+') ? 'text-green-600' : 'text-red-600'}`}>{lastScannedResult.action}</div>
                      <div className="text-sm text-slate-500">Nuova giacenza variante: <b>{lastScannedResult.newStock}</b></div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;