import React, { useState, useRef, useEffect } from 'react';
import { Supplier, Invoice, InvoiceItem, Product, Installment, FinancialRecord } from '../types';
import { Users, FileText, Plus, Truck, Package, Search, CheckCircle, Save, X, Upload, Loader2, Sparkles, AlertCircle, CalendarClock, PieChart, AlertTriangle } from 'lucide-react';
import { parseInvoiceImage } from '../services/geminiService';

interface SupplyChainProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  financialRecords: FinancialRecord[];
  setFinancialRecords: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
}

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Fashion Distribuzione SRL', vat: '12345678901', email: 'info@fashiondist.it', phone: '021234567', address: 'Via Milano 10' },
  { id: '2', name: 'Tessuti & Co', vat: '98765432109', email: 'ordini@tessuti.com', phone: '069876543', address: 'Roma Est 5' },
];

const SupplyChain: React.FC<SupplyChainProps> = ({ products, setProducts, invoices, setInvoices, financialRecords, setFinancialRecords }) => {
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'INVOICES' | 'DEBT'>('INVOICES');
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  
  // Invoice UI State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    items: [], status: 'DRAFT', date: new Date().toISOString().split('T')[0], paymentStatus: 'UNPAID', installments: []
  });
  
  // Installment Generation State in Modal
  const [numInstallments, setNumInstallments] = useState(1);
  const [installmentFrequency, setInstallmentFrequency] = useState(30); // days
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Supplier UI State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
      name: '', vat: '', email: '', phone: '', address: ''
  });
  
  // AI Parsing State
  const [isParsingInvoice, setIsParsingInvoice] = useState(false);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  // Helper for invoice item entry
  const [newItemEan, setNewItemEan] = useState('');
  const [newItemName, setNewItemName] = useState(''); 
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);

  // --- KPI Calculation ---
  const totalDebt = invoices.filter(i => i.paymentStatus !== 'PAID').reduce((acc, i) => {
     // Sum unpaid installments or total if no installments
     if (i.installments && i.installments.length > 0) {
         return acc + i.installments.filter(inst => !inst.isPaid).reduce((sum, inst) => sum + inst.amount, 0);
     }
     return acc + (i.paymentStatus === 'UNPAID' ? i.totalAmount : 0);
  }, 0);
  
  const overdueDebt = financialRecords
     .filter(r => r.category === 'SUPPLIER' && !r.isPaid && r.dueDate && new Date(r.dueDate) < new Date())
     .reduce((acc, r) => acc + r.amount, 0);


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

  // --- Installment Logic ---
  const generateInstallments = () => {
    const total = currentInvoice.items?.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0) || 0;
    if (total <= 0) { alert("Aggiungi articoli prima di calcolare le rate"); return; }
    
    const newInstallments: Installment[] = [];
    const amountPerInstallment = total / numInstallments;
    
    for (let i = 0; i < numInstallments; i++) {
        const date = new Date(firstInstallmentDate);
        date.setDate(date.getDate() + (i * installmentFrequency));
        
        newInstallments.push({
            id: `inst_${Date.now()}_${i}`,
            dueDate: date.toISOString().split('T')[0],
            amount: parseFloat(amountPerInstallment.toFixed(2)),
            isPaid: false,
            note: `Rata ${i+1}/${numInstallments}`
        });
    }
    setCurrentInvoice({...currentInvoice, installments: newInstallments, paymentStatus: 'UNPAID'});
  };

  const removeInstallment = (id: string) => {
      setCurrentInvoice({
          ...currentInvoice, 
          installments: currentInvoice.installments?.filter(i => i.id !== id)
      });
  };

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

    const total = currentInvoice.items?.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0) || 0;
    
    const newInvoice = {
        ...currentInvoice,
        id: Date.now().toString(),
        totalAmount: total
    } as Invoice;

    // 1. Save Invoice to Local List
    setInvoices([...invoices, newInvoice]);
    
    // 2. Update Stock if needed
    if (newInvoice.status === 'COMPLETED') {
        updateStockFromInvoice(newInvoice);
    }

    // 3. Generate Financial Records (Expenses) for Accounting
    const supplierName = suppliers.find(s => s.id === newInvoice.supplierId)?.name || 'Fornitore';
    const newRecords: FinancialRecord[] = [];

    if (newInvoice.installments && newInvoice.installments.length > 0) {
        // Create a record for EACH installment
        newInvoice.installments.forEach((inst) => {
            newRecords.push({
                id: `fin_${inst.id}`,
                date: newInvoice.date, // Transaction date is invoice date
                amount: inst.amount,
                type: 'OUT',
                category: 'SUPPLIER',
                description: `Fatt. ${newInvoice.invoiceNumber} - ${supplierName} (${inst.note})`,
                dueDate: inst.dueDate,
                isPaid: false,
                paymentMethod: 'BANK_TRANSFER',
                invoiceId: newInvoice.id,
                installmentId: inst.id,
                isEditable: false // Generated automatically
            });
        });
    } else {
        // Single Payment (Full)
        newRecords.push({
            id: `fin_${newInvoice.id}`,
            date: newInvoice.date,
            amount: newInvoice.totalAmount,
            type: 'OUT',
            category: 'SUPPLIER',
            description: `Fatt. ${newInvoice.invoiceNumber} - ${supplierName}`,
            dueDate: newInvoice.date, // Due immediately if no installments
            isPaid: false,
            paymentMethod: 'BANK_TRANSFER',
            invoiceId: newInvoice.id,
            isEditable: false
        });
    }

    setFinancialRecords([...financialRecords, ...newRecords]);
    
    setIsInvoiceModalOpen(false);
    alert("Fattura salvata e piano rateale inviato in Contabilità.");
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
  };

  const handleSaveSupplier = () => {
    if (!newSupplier.name || !newSupplier.vat) {
      alert("Nome e Partita IVA sono obbligatori.");
      return;
    }
    const supplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name,
      vat: newSupplier.vat,
      email: newSupplier.email || '',
      phone: newSupplier.phone || '',
      address: newSupplier.address || ''
    };
    setSuppliers([...suppliers, supplier]);
    setIsSupplierModalOpen(false);
    setNewSupplier({ name: '', vat: '', email: '', phone: '', address: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('INVOICES')} className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'INVOICES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}><FileText size={20} /> Carico Merce</button>
        <button onClick={() => setActiveTab('SUPPLIERS')} className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'SUPPLIERS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}><Users size={20} /> Anagrafica Fornitori</button>
        <button onClick={() => setActiveTab('DEBT')} className={`pb-4 font-medium flex items-center gap-2 ${activeTab === 'DEBT' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}><PieChart size={20} /> Situazione Debitoria</button>
      </div>

      {activeTab === 'DEBT' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <h3 className="text-slate-500 text-sm font-bold">Debito Totale Residuo</h3>
                      <div className="text-3xl font-bold text-slate-800 mt-2">€{totalDebt.toFixed(2)}</div>
                      <p className="text-xs text-slate-400 mt-1">Verso tutti i fornitori</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <h3 className="text-slate-500 text-sm font-bold">Scadute & Non Pagate</h3>
                      <div className="text-3xl font-bold text-rose-600 mt-2">€{overdueDebt.toFixed(2)}</div>
                      <p className="text-xs text-rose-400 mt-1">Attenzione: Sollecitare pagamenti</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center">
                      <div className="text-center">
                          <CalendarClock size={40} className="mx-auto text-indigo-600 mb-2"/>
                          <p className="font-bold text-slate-700">Gestione Cash Flow</p>
                          <p className="text-xs text-slate-400">Controlla lo scadenziario in Contabilità</p>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Dettaglio Fatture Non Saldate</div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Fornitore</th><th className="p-4">Fattura</th><th className="p-4">Totale</th><th className="p-4">Rate</th><th className="p-4">Stato</th></tr></thead>
                      <tbody>
                          {invoices.filter(i => i.paymentStatus !== 'PAID').map(inv => {
                              const paidInstallments = inv.installments?.filter(i => i.isPaid).length || 0;
                              const totalInstallments = inv.installments?.length || 0;
                              return (
                                <tr key={inv.id} className="border-b border-slate-100">
                                    <td className="p-4 font-medium">{suppliers.find(s => s.id === inv.supplierId)?.name || 'N/A'}</td>
                                    <td className="p-4 font-mono">{inv.invoiceNumber} <span className="text-xs text-slate-400">({inv.date})</span></td>
                                    <td className="p-4 font-bold">€{inv.totalAmount.toFixed(2)}</td>
                                    <td className="p-4">
                                        {totalInstallments > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-indigo-600 h-full" style={{width: `${(paidInstallments/totalInstallments)*100}%`}}></div>
                                                </div>
                                                <span className="text-xs">{paidInstallments}/{totalInstallments}</span>
                                            </div>
                                        ) : <span className="text-xs text-slate-400">Unica Soluzione</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${inv.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                            {inv.paymentStatus === 'PARTIAL' ? 'In Corso' : 'Non Pagata'}
                                        </span>
                                    </td>
                                </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-slate-800">Storico Carichi</h2><p className="text-slate-500">Registra fatture e carica magazzino.</p></div>
            <button onClick={() => { setCurrentInvoice({ items: [], status: 'COMPLETED', date: new Date().toISOString().split('T')[0], installments: [], paymentStatus: 'UNPAID' }); setIsInvoiceModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Plus size={20} /> Nuova Fattura</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Data</th><th className="p-4">Fornitore</th><th className="p-4">Nr. Doc</th><th className="p-4">Totale</th><th className="p-4">Stock</th><th className="p-4">Pagamento</th></tr></thead>
                <tbody>
                    {invoices.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nessuna fattura registrata</td></tr> : 
                     invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-slate-100">
                            <td className="p-4">{inv.date}</td>
                            <td className="p-4">{suppliers.find(s => s.id === inv.supplierId)?.name || 'N/A'}</td>
                            <td className="p-4 font-mono">{inv.invoiceNumber}</td>
                            <td className="p-4">€{inv.totalAmount.toFixed(2)}</td>
                            <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> {inv.status}</span></td>
                            <td className="p-4">
                                {inv.installments && inv.installments.length > 0 ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-600"><CalendarClock size={12}/> {inv.installments.length} Rate</span>
                                ) : (
                                    <span className="text-xs text-slate-500">Unica Sol.</span>
                                )}
                            </td>
                        </tr>
                     ))
                    }
                </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'SUPPLIERS' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h2 className="text-xl font-bold text-slate-800">Rubrica Fornitori</h2><p className="text-slate-500">Gestisci i tuoi partner commerciali.</p></div>
                <button onClick={() => setIsSupplierModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Plus size={20} /> Nuovo Fornitore</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative group hover:shadow-md transition">
                        <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><Truck /></div><div><h3 className="font-bold text-slate-800">{s.name}</h3><div className="text-xs text-slate-400">P.IVA: {s.vat}</div></div></div>
                        <div className="text-sm text-slate-600 space-y-2"><div className="flex gap-2"><span>📧</span> {s.email}</div><div className="flex gap-2"><span>📞</span> {s.phone}</div><div className="flex gap-2"><span>📍</span> {s.address}</div></div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {isInvoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[95vh] flex flex-col">
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
                
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT COLUMN: Data Entry */}
                    <div className="w-2/3 border-r border-slate-100 overflow-y-auto flex flex-col">
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
                                </div>
                                <div className="w-24"><label className="text-xs font-bold text-slate-700">Quantità</label><input type="number" className="w-full p-2 border border-slate-200 rounded-lg mt-1 text-center" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value))} /></div>
                                <div className="w-32"><label className="text-xs font-bold text-slate-700">Costo Unit (€)</label><input type="number" step="0.01" className="w-full p-2 border border-slate-200 rounded-lg mt-1 text-right" value={newItemCost} onChange={e => setNewItemCost(parseFloat(e.target.value))} /></div>
                                <button type="submit" disabled={!newItemName} className="bg-indigo-600 text-white p-2 rounded-lg h-[42px] px-4 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Aggiungi</button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto">
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
                    </div>
                    
                    {/* RIGHT COLUMN: Installment Plan */}
                    <div className="w-1/3 bg-slate-50 p-6 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarClock size={20} className="text-indigo-600"/> Piano Rateale</h4>
                            <p className="text-xs text-slate-500 mb-4">Genera un piano di pagamento. Le scadenze verranno aggiunte automaticamente in Contabilità.</p>
                            
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Numero Rate</label>
                                    <input type="number" min="1" max="12" className="w-full p-2 border rounded mt-1" value={numInstallments} onChange={e => setNumInstallments(parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Frequenza (Giorni)</label>
                                    <select className="w-full p-2 border rounded mt-1 bg-white" value={installmentFrequency} onChange={e => setInstallmentFrequency(parseInt(e.target.value))}>
                                        <option value="30">30 Giorni (Mensile)</option>
                                        <option value="60">60 Giorni (Bimestrale)</option>
                                        <option value="90">90 Giorni (Trimestrale)</option>
                                        <option value="15">15 Giorni</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Data Prima Rata</label>
                                    <input type="date" className="w-full p-2 border rounded mt-1" value={firstInstallmentDate} onChange={e => setFirstInstallmentDate(e.target.value)} />
                                </div>
                                <button onClick={generateInstallments} className="w-full py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 mt-2">Calcola Rate</button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {currentInvoice.installments?.map((inst, idx) => (
                                    <div key={inst.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                                        <div>
                                            <div className="font-bold text-slate-700">Rata {idx + 1}</div>
                                            <div className="text-xs text-slate-500">{inst.dueDate}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">€{inst.amount.toFixed(2)}</span>
                                            <button onClick={() => removeInstallment(inst.id)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                                {(!currentInvoice.installments || currentInvoice.installments.length === 0) && (
                                    <div className="text-center text-xs text-slate-400 italic py-4">Nessuna rata generata. Pagamento unica soluzione.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-lg">
                            <div className="text-sm opacity-80 mb-1">Totale Fattura</div>
                            <div className="text-3xl font-bold mb-4">€{currentInvoice.items?.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0).toFixed(2)}</div>
                            <button onClick={handleSaveInvoice} className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2">
                                <Save size={20} /> Conferma Tutto
                            </button>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      )}

      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Nuovo Fornitore</h3>
                    <button onClick={() => setIsSupplierModalOpen(false)}><X className="text-slate-400"/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500">Ragione Sociale</label><input className="w-full p-2 border rounded mt-1" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Es. Mario Rossi SRL" /></div>
                    <div><label className="text-xs font-bold text-slate-500">P.IVA</label><input className="w-full p-2 border rounded mt-1" value={newSupplier.vat} onChange={e => setNewSupplier({...newSupplier, vat: e.target.value})} placeholder="11 cifre" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Email</label><input className="w-full p-2 border rounded mt-1" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="amministrazione@fornitore.it" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Telefono</label><input className="w-full p-2 border rounded mt-1" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="+39 ..." /></div>
                    <div><label className="text-xs font-bold text-slate-500">Indirizzo</label><input className="w-full p-2 border rounded mt-1" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="Via Roma 1, Milano" /></div>
                    
                    <button onClick={handleSaveSupplier} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 mt-2">Salva Fornitore</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChain;