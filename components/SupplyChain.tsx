import React, { useState, useRef, useEffect } from 'react';
import { Supplier, Invoice, InvoiceItem, Product } from '../types';
import { Users, FileText, Plus, Truck, Package, Search, CheckCircle, Save, X, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { parseInvoiceImage } from '../services/geminiService';

interface SupplyChainProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Fashion Distribuzione SRL', vat: '12345678901', email: 'info@fashiondist.it', phone: '021234567', address: 'Via Milano 10' },
  { id: '2', name: 'Tessuti & Co', vat: '98765432109', email: 'ordini@tessuti.com', phone: '069876543', address: 'Roma Est 5' },
];

const SupplyChain: React.FC<SupplyChainProps> = ({ products, setProducts, invoices, setInvoices }) => {
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'INVOICES'>('INVOICES');
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  
  // Invoice UI State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    items: [], status: 'DRAFT', date: new Date().toISOString().split('T')[0]
  });
  
  // AI Parsing State
  const [isParsingInvoice, setIsParsingInvoice] = useState(false);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  // Helper for invoice item entry
  const [newItemEan, setNewItemEan] = useState('');
  const [newItemName, setNewItemName] = useState(''); 
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);

  // --- Real-time EAN Lookup Effect ---
  useEffect(() => {
    if (!newItemEan) {
        setNewItemName('');
        return;
    }

    let found = false;
    for (const p of products) {
        const v = p.variants.find(v => v.barcode === newItemEan);
        if (v) {
            setNewItemName(`${p.name} (${v.size} - ${v.color})`);
            found = true;
            break;
        }
    }
    if (!found) {
        setNewItemName('');
    }
  }, [newItemEan, products]);

  // --- AI Invoice Handler ---
  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingInvoice(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;
      const parsedData = await parseInvoiceImage(base64);

      if (parsedData) {
        const newItems: InvoiceItem[] = parsedData.items?.map((item: any) => {
           let dbName = item.productName || 'Articolo Rilevato';
           let dbVariant = 'Da verificare';
           const barcode = item.barcode || '';

           if (barcode) {
             for (const p of products) {
                 const v = p.variants.find(v => v.barcode === barcode);
                 if (v) {
                     dbName = p.name;
                     dbVariant = `${v.color} / ${v.size}`;
                     break;
                 }
             }
           }

           return {
             barcode: barcode || 'DA_ASSOCIARE',
             productName: dbName,
             variantDetails: dbVariant,
             quantity: item.quantity || 1,
             costPrice: item.costPrice || 0
           };
        }) || [];

        setCurrentInvoice(prev => ({
          ...prev,
          invoiceNumber: parsedData.invoiceNumber || prev.invoiceNumber,
          date: parsedData.date || prev.date,
          items: [...(prev.items || []), ...newItems]
        }));
        alert("Fattura scansionata con AI e incrociata con il database prodotti!");
      }
    } catch (err) {
      console.error(err);
      alert("Errore durante l'analisi della fattura.");
    } finally {
      setIsParsingInvoice(false);
      if (invoiceFileInputRef.current) invoiceFileInputRef.current.value = '';
    }
  };

  // --- Invoice Logic ---
  const handleAddItemToInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemEan) return;

    let foundProduct: Product | undefined;
    let foundVariant: any;

    for (const p of products) {
      const v = p.variants.find(v => v.barcode === newItemEan);
      if (v) { foundProduct = p; foundVariant = v; break; }
    }

    if (foundProduct && foundVariant) {
      const newItem: InvoiceItem = {
        barcode: newItemEan,
        productName: foundProduct.name,
        variantDetails: `${foundVariant.color} / ${foundVariant.size}`,
        quantity: newItemQty,
        costPrice: newItemCost
      };
      
      setCurrentInvoice({
        ...currentInvoice,
        items: [...(currentInvoice.items || []), newItem]
      });
      setNewItemEan('');
      setNewItemName('');
      setNewItemQty(1);
    } else {
      alert("Prodotto non trovato! Crea prima il prodotto e la variante nel magazzino con questo EAN.");
    }
  };

  const handleSaveInvoice = () => {
    if (!currentInvoice.supplierId || !currentInvoice.invoiceNumber) {
        alert("Compila fornitore e numero fattura");
        return;
    }

    const newInvoice = {
        ...currentInvoice,
        id: Date.now().toString(),
        totalAmount: currentInvoice.items?.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0) || 0
    } as Invoice;

    setInvoices([...invoices, newInvoice]);
    
    if (newInvoice.status === 'COMPLETED') {
        updateStockFromInvoice(newInvoice);
    }
    
    setIsInvoiceModalOpen(false);
  };

  const updateStockFromInvoice = (inv: Invoice) => {
    const updatedProducts = [...products];
    inv.items.forEach(item => {
       for (const p of updatedProducts) {
         const vIndex = p.variants.findIndex(v => v.barcode === item.barcode);
         if (vIndex !== -1) {
           p.variants[vIndex].stock += item.quantity;
         }
       }
    });
    setProducts(updatedProducts);
    alert("Magazzino aggiornato con successo!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('INVOICES')} className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'INVOICES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}><FileText size={20} /> Carico Merce</button>
        <button onClick={() => setActiveTab('SUPPLIERS')} className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'SUPPLIERS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}><Users size={20} /> Anagrafica Fornitori</button>
      </div>

      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-slate-800">Storico Carichi</h2><p className="text-slate-500">Registra fatture e carica magazzino.</p></div>
            <button onClick={() => { setCurrentInvoice({ items: [], status: 'COMPLETED', date: new Date().toISOString().split('T')[0] }); setIsInvoiceModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Plus size={20} /> Nuova Fattura</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Data</th><th className="p-4">Fornitore</th><th className="p-4">Nr. Doc</th><th className="p-4">Totale</th><th className="p-4">Stato</th></tr></thead>
                <tbody>
                    {invoices.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nessuna fattura registrata</td></tr> : 
                     invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-slate-100">
                            <td className="p-4">{inv.date}</td>
                            <td className="p-4">{suppliers.find(s => s.id === inv.supplierId)?.name || 'N/A'}</td>
                            <td className="p-4 font-mono">{inv.invoiceNumber}</td>
                            <td className="p-4">€{inv.totalAmount.toFixed(2)}</td>
                            <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> {inv.status}</span></td>
                        </tr>
                     ))
                    }
                </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative group hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><Truck /></div><div><h3 className="font-bold text-slate-800">{s.name}</h3><div className="text-xs text-slate-400">P.IVA: {s.vat}</div></div></div>
                    <div className="text-sm text-slate-600 space-y-2"><div className="flex gap-2"><span>📧</span> {s.email}</div><div className="flex gap-2"><span>📞</span> {s.phone}</div><div className="flex gap-2"><span>📍</span> {s.address}</div></div>
                </div>
            ))}
        </div>
      )}

      {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-xl">Registrazione Fattura Acquisto</h3>
                    <button onClick={() => setIsInvoiceModalOpen(false)}><X className="text-slate-400"/></button>
                </div>
                
                <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-indigo-800">
                     <Sparkles size={20}/>
                     <span className="font-bold text-sm">Compilazione Automatica AI</span>
                   </div>
                   <div>
                     <input type="file" accept="image/*" ref={invoiceFileInputRef} className="hidden" onChange={handleInvoiceUpload} />
                     <button onClick={() => invoiceFileInputRef.current?.click()} disabled={isParsingInvoice} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                       {isParsingInvoice ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>}
                       Carica Immagine Fattura
                     </button>
                   </div>
                </div>

                <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-100">
                    <div><label className="text-xs font-bold text-slate-500">Fornitore</label><select className="w-full p-2 border rounded mt-1" value={currentInvoice.supplierId} onChange={e => setCurrentInvoice({...currentInvoice, supplierId: e.target.value})}><option value="">Seleziona...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div><label className="text-xs font-bold text-slate-500">Numero Fattura</label><input type="text" className="w-full p-2 border rounded mt-1" value={currentInvoice.invoiceNumber || ''} onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500">Data</label><input type="date" className="w-full p-2 border rounded mt-1" value={currentInvoice.date} onChange={e => setCurrentInvoice({...currentInvoice, date: e.target.value})} /></div>
                </div>
                
                <div className="p-4 border-b border-slate-100">
                    <form onSubmit={handleAddItemToInvoice} className="flex gap-4 items-end">
                        <div className="flex-1 relative">
                            <label className="text-xs font-bold text-slate-700">Scan EAN Variante</label>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 mt-1 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                                <Search size={16} className="text-slate-400"/>
                                <input 
                                  autoFocus 
                                  type="text" 
                                  placeholder="Spara Barcode..." 
                                  className="w-full p-2 outline-none bg-transparent" 
                                  value={newItemEan} 
                                  onChange={e => setNewItemEan(e.target.value)} 
                                />
                            </div>
                            {newItemName && (
                                <div className="absolute top-full left-0 mt-1 text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                                    <CheckCircle size={12} /> {newItemName}
                                </div>
                            )}
                            {newItemEan && !newItemName && (
                                <div className="absolute top-full left-0 mt-1 text-xs text-slate-400 flex items-center gap-1">
                                    <AlertCircle size={12} /> Prodotto sconosciuto, verrà ignorato.
                                </div>
                            )}
                        </div>
                        <div className="w-24"><label className="text-xs font-bold text-slate-700">Quantità</label><input type="number" className="w-full p-2 border border-slate-200 rounded-lg mt-1 text-center" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value))} /></div>
                        <div className="w-32"><label className="text-xs font-bold text-slate-700">Costo Unit (€)</label><input type="number" step="0.01" className="w-full p-2 border border-slate-200 rounded-lg mt-1 text-right" value={newItemCost} onChange={e => setNewItemCost(parseFloat(e.target.value))} /></div>
                        <button type="submit" disabled={!newItemName} className="bg-indigo-600 text-white p-2 rounded-lg h-[42px] px-4 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Aggiungi</button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0"><tr><th className="p-3 pl-6">EAN</th><th className="p-3">Prodotto</th><th className="p-3">Qta</th><th className="p-3">Costo</th><th className="p-3">Totale Riga</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentInvoice.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-3 pl-6 font-mono text-slate-500">{item.barcode}</td>
                                    <td className="p-3"><div className="font-bold text-slate-700">{item.productName}</div><div className="text-xs text-slate-500">{item.variantDetails}</div></td>
                                    <td className="p-3 font-bold text-green-600">+{item.quantity}</td>
                                    <td className="p-3">€{item.costPrice.toFixed(2)}</td>
                                    <td className="p-3 font-bold">€{(item.costPrice * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
                    <div className="text-xl font-bold text-slate-800">Totale Fattura: €{currentInvoice.items?.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0).toFixed(2)}</div>
                    <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-200 hover:bg-green-700 flex items-center gap-2"><Save size={20} /> Salva & Carica Magazzino</button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default SupplyChain;