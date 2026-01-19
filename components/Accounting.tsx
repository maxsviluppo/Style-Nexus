import React, { useState } from 'react';
import { Sale, Invoice, FinancialRecord, TransactionCategory } from '../types';
import { TrendingUp, TrendingDown, PieChart, FileText, Plus, X, Calendar, Zap, Home, DollarSign, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';

interface AccountingProps {
    sales: Sale[];
    invoices: Invoice[];
    financialRecords: FinancialRecord[];
    setFinancialRecords: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
}

const Accounting: React.FC<AccountingProps> = ({ sales, invoices, financialRecords, setFinancialRecords }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Partial<FinancialRecord>>({
        type: 'OUT',
        category: 'OTHER_EXPENSE',
        date: new Date().toISOString().split('T')[0],
        isPaid: true
    });

    // --- Math ---
    const salesTotal = sales.reduce((acc, s) => acc + s.total, 0);
    const manualIncome = financialRecords.filter(r => r.type === 'IN' && r.isPaid).reduce((acc, r) => acc + r.amount, 0);
    const totalRevenue = salesTotal + manualIncome;

    const invoicesTotal = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const manualExpenses = financialRecords.filter(r => r.type === 'OUT' && r.isPaid).reduce((acc, r) => acc + r.amount, 0);
    const totalExpenses = invoicesTotal + manualExpenses;

    const netProfit = totalRevenue - totalExpenses;

    // --- Data Merging & Sorting ---
    const allTransactions = [
        ...sales.map(s => ({ 
            id: s.id, date: s.date, type: 'IN' as const, amount: s.total, 
            desc: `Vendita POS (${s.items.length} art.)`, ref: 'Scontrino', category: 'SALES', isPaid: true 
        })),
        ...invoices.map(i => ({ 
            id: i.id, date: i.date, type: 'OUT' as const, amount: i.totalAmount, 
            desc: `Fattura Fornitore`, ref: i.invoiceNumber, category: 'SUPPLIER', isPaid: true 
        })),
        ...financialRecords.map(r => ({
            id: r.id, date: r.date, type: r.type, amount: r.amount,
            desc: r.description, ref: r.category, category: r.category, isPaid: r.isPaid
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const deadlines = financialRecords
        .filter(r => !r.isPaid && r.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    // --- Handlers ---
    const handleAddTransaction = () => {
        if (!newTransaction.amount || !newTransaction.description) return;
        const record: FinancialRecord = {
            id: Date.now().toString(),
            date: newTransaction.date!,
            amount: parseFloat(newTransaction.amount.toString()),
            type: newTransaction.type as 'IN' | 'OUT',
            category: newTransaction.category as TransactionCategory,
            description: newTransaction.description!,
            dueDate: newTransaction.dueDate,
            isPaid: newTransaction.isPaid!
        };
        setFinancialRecords([...financialRecords, record]);
        setIsModalOpen(false);
        setNewTransaction({ type: 'OUT', category: 'OTHER_EXPENSE', date: new Date().toISOString().split('T')[0], isPaid: true, amount: 0, description: '' });
    };

    const markAsPaid = (id: string) => {
        setFinancialRecords(financialRecords.map(r => r.id === id ? { ...r, isPaid: true } : r));
    };

    const getCategoryIcon = (cat: string) => {
        switch(cat) {
            case 'RENT': return <Home size={16} />;
            case 'UTILITIES': return <Zap size={16} />;
            case 'TAXES': return <FileText size={16} />;
            case 'SALARY': return <UsersIcon size={16} />;
            case 'SALES': return <DollarSign size={16} />;
            default: return <Briefcase size={16} />;
        }
    };

    const UsersIcon = ({size}: {size:number}) => (
       <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PieChart className="text-indigo-600" /> Contabilità & Scadenze
                    </h2>
                    <p className="text-slate-500">Gestione flussi di cassa, spese fisse e tasse.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
                    <Plus size={20}/> Registra Spesa/Entrata
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Totale Entrate</p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">+ €{totalRevenue.toFixed(2)}</h3>
                            <p className="text-xs text-slate-400 mt-1">Vendite + Altri Ricavi</p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp /></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Totale Uscite</p>
                            <h3 className="text-2xl font-bold text-rose-600 mt-1">- €{totalExpenses.toFixed(2)}</h3>
                            <p className="text-xs text-slate-400 mt-1">Fornitori + Spese Fisse</p>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown /></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Saldo (Utile)</p>
                            <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>€{netProfit.toFixed(2)}</h3>
                            <p className="text-xs text-slate-400 mt-1">Cashflow netto</p>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><PieChart /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Transaction List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><FileText size={20}/> Estratto Conto Unificato</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Descrizione</th>
                                    <th className="p-4">Cat.</th>
                                    <th className="p-4 text-right">Importo</th>
                                    <th className="p-4">Stato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allTransactions.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nessun movimento</td></tr>}
                                {allTransactions.map((t) => (
                                    <tr key={t.id + t.type} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {t.desc}
                                            {t.ref && <div className="text-xs text-slate-400 font-mono">{t.ref}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                                                {getCategoryIcon(t.category)} {t.category}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-bold ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'IN' ? '+' : '-'}€{t.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            {t.isPaid ? <CheckCircle size={16} className="text-green-500"/> : <AlertCircle size={16} className="text-amber-500"/>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Deadlines Side Panel */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Calendar size={20}/> Scadenze Imminenti</h3>
                    <div className="space-y-3">
                        {deadlines.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4">Nessuna scadenza in sospeso.</p>
                        ) : (
                            deadlines.map(d => (
                                <div key={d.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${new Date(d.dueDate!) < new Date() ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-slate-800">{d.description}</div>
                                            <div className="text-xs text-slate-500">Scadenza: {new Date(d.dueDate!).toLocaleDateString()}</div>
                                        </div>
                                        <div className="font-bold text-rose-600">-€{d.amount}</div>
                                    </div>
                                    <button onClick={() => markAsPaid(d.id)} className="w-full py-1.5 mt-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-100 transition">
                                        Segna come Pagato
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <h4 className="font-bold mb-1 flex items-center gap-2"><Briefcase size={16}/> Gestione Fiscale</h4>
                        <p className="mb-2">Ricorda di scaricare l'estratto conto mensile per il commercialista.</p>
                    </div>
                </div>
            </div>

            {/* Modal Add Transaction */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Registra Movimento</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <button onClick={() => setNewTransaction({...newTransaction, type: 'IN'})} className={`flex-1 py-2 rounded-lg font-bold border ${newTransaction.type === 'IN' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>ENTRATA</button>
                                <button onClick={() => setNewTransaction({...newTransaction, type: 'OUT'})} className={`flex-1 py-2 rounded-lg font-bold border ${newTransaction.type === 'OUT' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-500'}`}>USCITA</button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500">Descrizione</label>
                                <input type="text" className="w-full p-2 border rounded mt-1" value={newTransaction.description || ''} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} placeholder="Es. Bolletta Luce, Affitto..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Importo (€)</label>
                                    <input type="number" className="w-full p-2 border rounded mt-1" value={newTransaction.amount || ''} onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Data</label>
                                    <input type="date" className="w-full p-2 border rounded mt-1" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500">Categoria</label>
                                <select className="w-full p-2 border rounded mt-1 bg-white" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value as any})}>
                                    <option value="RENT">Affitto / Locazione</option>
                                    <option value="UTILITIES">Utenze (Luce, Gas, Internet)</option>
                                    <option value="TAXES">Tasse & Imposte</option>
                                    <option value="SALARY">Stipendi & Personale</option>
                                    <option value="OTHER_EXPENSE">Altre Spese</option>
                                    <option value="OTHER_INCOME">Altri Ricavi</option>
                                    <option value="GRANT">Contributi / Finanziamenti</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <input 
                                    type="checkbox" 
                                    id="paid" 
                                    checked={newTransaction.isPaid} 
                                    onChange={e => setNewTransaction({...newTransaction, isPaid: e.target.checked})}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <label htmlFor="paid" className="text-sm font-medium text-slate-700">Già Pagato?</label>
                            </div>

                            {!newTransaction.isPaid && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 text-amber-600">Data Scadenza Pagamento</label>
                                    <input type="date" className="w-full p-2 border rounded mt-1 border-amber-200 bg-amber-50" value={newTransaction.dueDate || ''} onChange={e => setNewTransaction({...newTransaction, dueDate: e.target.value})} />
                                </div>
                            )}

                            <button onClick={handleAddTransaction} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 mt-2">
                                Salva Movimento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounting;