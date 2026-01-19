import React, { useState } from 'react';
import { Supplier, Invoice, InvoiceItem, Product } from '../types';
import { Users, FileText, Plus, Truck, Package, Search, CheckCircle, Save, X } from 'lucide-react';

interface SupplyChainProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Fashion Distribuzione SRL', vat: '12345678901', email: 'info@fashiondist.it', phone: '021234567', address: 'Via Milano 10' },
  { id: '2', name: 'Tessuti & Co', vat: '98765432109', email: 'ordini@tessuti.com', phone: '069876543', address: 'Roma Est 5' },
];

const SupplyChain: React.FC<SupplyChainProps> = ({ products, setProducts }) => {
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'INVOICES'>('INVOICES');
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  
  // Invoice State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    items: [], status: 'DRAFT', date: new Date().toISOString().split('T')[0]
  });
  
  // Helper for invoice item entry
  const [newItemEan, setNewItemEan] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);

  // --- Invoice Logic ---

  const handleAddItemToInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemEan) return;

    // Find Product Variant
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
    
    // If completed immediately, update stock
    if (newInvoice.status === 'COMPLETED') {
        updateStockFromInvoice(newInvoice);
    }
    
    setIsInvoiceModalOpen(false);
  };

  const updateStockFromInvoice = (inv: Invoice) => {
    const updatedProducts = [...products];
    inv.items.forEach(item => {
       // Locate and update
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
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('INVOICES')}
          className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'INVOICES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          <FileText size={20} /> Carico Merce (Fatture)
        </button>
        <button 
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'SUPPLIERS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          <Users size={20} /> Anagrafica Fornitori
        </button>
      </div>

      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-slate-800">Storico Carichi & Fatture</h2>
               <p className="text-slate-500">Registra le fatture di acquisto e carica il magazzino.</p>
            </div>
            <button onClick={() => { setCurrentInvoice({ items: [], status: 'COMPLETED', date: new Date().toISOString().split('T')[0] }); setIsInvoiceModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
               <Plus size={20} /> Nuova Fattura
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                    <tr><th className="p-4">Data</th><th className="p-4">Fornitore</th><th className="p-4">Nr. Doc</th><th className="p-4">Totale</th><th className="p-4">Stato</th></tr>
                </thead>
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
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><Truck /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">{s.name}</h3>
                            <div className="text-xs text-slate-400">P.IVA: {s.vat}</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-600 space-y-2">
                        <div className="flex gap-2"><span>📧</span> {s.email}</div>
                        <div className="flex gap-2"><span>📞</span> {s.phone}</div>
                        <div className="flex gap-2"><span>📍</span> {s.address}</div>
                    </div>
                </div>
            ))}
            <button className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition h-48">
                <Plus size={32} />
                <span className="font-bold mt-2">Aggiungi Fornitore</span>
            </button>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-xl">Registrazione Fattura Acquisto</h3>
                    <button onClick={() => setIsInvoiceModalOpen(false)}><X className="text-slate-400"/></button>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-100">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Fornitore</label>
                        <select 
                          className="w-full p-2 border rounded mt-1"
                          value={currentInvoice.supplierId}
                          onChange={e => setCurrentInvoice({...currentInvoice, supplierId: e.target.value})}
                        >
                            <option value="">Seleziona...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Numero Fattura</label>
                        <input type="text" className="w-full p-2 border rounded mt-1" value={currentInvoice.invoiceNumber || ''} onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Data</label>
                        <input type="date" className="w-full p-2 border rounded mt-1" value={currentInvoice.date} onChange={e => setCurrentInvoice({...currentInvoice, date: e.target.value})} />
                    </div>
                </div>
                
                {/* Scan Area */}
                <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                    <form onSubmit={handleAddItemToInvoice} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-indigo-800">Scan EAN Variante</label>
                            <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-2 mt-1">
                                <Search size={16} className="text-indigo-400"/>
                                <input autoFocus type="text" placeholder="Spara Barcode..." className="w-full p-2 outline-none bg-transparent" value={newItemEan} onChange={e => setNewItemEan(e.target.value)} />
                            </div>
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-indigo-800">Quantità</label>
                            <input type="number" className="w-full p-2 border border-indigo-200 rounded-lg mt-1 text-center" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value))} />
                        </div>
                        <div className="w-32">
                            <label className="text-xs font-bold text-indigo-800">Costo Unit (€)</label>
                            <input type="number" step="0.01" className="w-full p-2 border border-indigo-200 rounded-lg mt-1 text-right" value={newItemCost} onChange={e => setNewItemCost(parseFloat(e.target.value))} />
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg h-[42px] px-4 hover:bg-indigo-700">Aggiungi Riga</button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0"><tr><th className="p-3 pl-6">EAN</th><th className="p-3">Prodotto</th><th className="p-3">Qta</th><th className="p-3">Costo</th><th className="p-3">Totale Riga</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentInvoice.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-3 pl-6 font-mono text-slate-500">{item.barcode}</td>
                                    <td className="p-3">
                                        <div className="font-bold text-slate-700">{item.productName}</div>
                                        <div className="text-xs text-slate-500">{item.variantDetails}</div>
                                    </td>
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
                    <button onClick={handleSaveInvoice} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-200 hover:bg-green-700 flex items-center gap-2">
                        <Save size={20} /> Salva & Carica Magazzino
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default SupplyChain;