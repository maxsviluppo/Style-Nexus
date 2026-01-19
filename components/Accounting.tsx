import React, { useState, useEffect } from 'react';
import { Sale, Invoice, FinancialRecord, TransactionCategory, DetailedPaymentMethod } from '../types';
import { TrendingUp, TrendingDown, PieChart, FileText, Plus, X, Calendar, Zap, Home, DollarSign, Briefcase, AlertCircle, CheckCircle, CalendarRange, ChevronDown, Filter, AlertTriangle } from 'lucide-react';

interface AccountingProps {
    sales: Sale[];
    invoices: Invoice[];
    financialRecords: FinancialRecord[];
    setFinancialRecords: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
}

const Accounting: React.FC<AccountingProps> = ({ sales, invoices, financialRecords, setFinancialRecords }) => {
    // --- State ---
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    
    // Date Filter State
    const [dateRange, setDateRange] = useState<{ label: string; start: Date | null; end: Date | null }>({
        label: 'Questo Mese',
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    });

    // Custom Date Inputs State (for the modal)
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [newTransaction, setNewTransaction] = useState<Partial<FinancialRecord>>({
        type: 'OUT',
        category: 'OTHER_EXPENSE',
        date: new Date().toISOString().split('T')[0],
        isPaid: true,
        paymentMethod: 'BANK_TRANSFER'
    });

    // --- Helpers ---
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

    // --- Data Merging ---
    // 1. Merge all sources into one list
    const rawTransactions = [
        ...sales.map(s => ({ 
            id: s.id, date: s.date, type: 'IN' as const, amount: s.total, 
            desc: `Vendita POS (${s.items.length} art.)`, ref: 'Scontrino', category: 'SALES', isPaid: true, method: s.paymentMethod 
        })),
        ...invoices.map(i => ({ 
            id: i.id, date: i.date, type: 'OUT' as const, amount: i.totalAmount, 
            desc: `Fattura Fornitore`, ref: i.invoiceNumber, category: 'SUPPLIER', isPaid: true, method: 'BANK_TRANSFER' 
        })),
        ...financialRecords.map(r => ({
            id: r.id, date: r.date, type: r.type, amount: r.amount,
            desc: r.description, ref: r.category, category: r.category, isPaid: r.isPaid, method: r.paymentMethod
        }))
    ];

    // 2. Filter by Date Range
    const filteredTransactions = rawTransactions.filter(t => {
        if (!dateRange.start || !dateRange.end) return true;
        
        // Normalize transaction date to midnight for comparison
        const tDate = new Date(t.date);
        tDate.setHours(0,0,0,0);
        
        const start = new Date(dateRange.start);
        start.setHours(0,0,0,0);
        
        const end = new Date(dateRange.end);
        end.setHours(23,59,59,999);

        return tDate >= start && tDate <= end;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Calculate Totals based on FILTERED data
    const totalRevenue = filteredTransactions
        .filter(t => t.type === 'IN' && t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'OUT' && t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    // 4. Global Debt Calculation (Unpaid Expenses from ALL history, not just filtered)
    const totalDebt = rawTransactions
        .filter(t => t.type === 'OUT' && !t.isPaid)
        .reduce((acc, t) => acc + t.amount, 0);

    // Deadlines are independent of the view filter (always show upcoming)
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
            isPaid: newTransaction.isPaid!,
            paymentMethod: newTransaction.paymentMethod as DetailedPaymentMethod
        };
        setFinancialRecords([...financialRecords, record]);
        setIsTransactionModalOpen(false);
        setNewTransaction({ type: 'OUT', category: 'OTHER_EXPENSE', date: new Date().toISOString().split('T')[0], isPaid: true, amount: 0, description: '', paymentMethod: 'BANK_TRANSFER' });
    };

    const markAsPaid = (id: string) => {
        setFinancialRecords(financialRecords.map(r => r.id === id ? { ...r, isPaid: true, paymentMethod: 'BANK_TRANSFER' } : r));
    };

    const applyDatePreset = (preset: 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL') => {
        const now = new Date();
        let start = new Date();
        let end = new Date();
        let label = '';

        switch(preset) {
            case 'TODAY':
                label = 'Oggi';
                break;
            case 'YESTERDAY':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                label = 'Ieri';
                break;
            case 'THIS_MONTH':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                label = 'Questo Mese';
                break;
            case 'LAST_MONTH':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                label = 'Mese Scorso';
                break;
            case 'THIS_YEAR':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                label = 'Anno Corrente';
                break;
            case 'ALL':
                setDateRange({ label: 'Tutto lo storico', start: null, end: null });
                setIsDateModalOpen(false);
                return;
        }
        setDateRange({ label, start, end });
        setIsDateModalOpen(false);
    };

    const applyCustomDate = () => {
        if (customStart && customEnd) {
            setDateRange({
                label: `${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()}`,
                start: new Date(customStart),
                end: new Date(customEnd)
            });
            setIsDateModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PieChart className="text-indigo-600" /> Contabilità
                    </h2>
                    <p className="text-slate-500">Gestione flussi di cassa, spese fisse e tasse.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    {/* DATE SELECTOR BUTTON */}
                    <button 
                        onClick={() => setIsDateModalOpen(true)}
                        className="flex-1 md:flex-none bg-white border border-slate-300 px-4 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition flex items-center justify-between gap-3 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <CalendarRange size={18} className="text-slate-500" />
                            <span>{dateRange.label}</span>
                        </div>
                        <ChevronDown size={16} className="text-slate-400" />
                    </button>

                    <button onClick={() => setIsTransactionModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 whitespace-nowrap">
                        <Plus size={20}/> <span className="hidden md:inline">Registra</span> Movimento
                    </button>
                </div>
            </div>

            {/* KPI Cards (Filtered) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Entrate ({dateRange.label})</p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">+ €{totalRevenue.toFixed(2)}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp /></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Uscite ({dateRange.label})</p>
                            <h3 className="text-2xl font-bold text-rose-600 mt-1">- €{totalExpenses.toFixed(2)}</h3>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown /></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Utile Netto</p>
                            <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>€{netProfit.toFixed(2)}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><PieChart /></div>
                </div>
                
                {/* Situation Debitoria Card */}
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 bg-white/20 rounded-full -mr-5 -mt-5"></div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12}/> Situazione Debitoria</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">- €{totalDebt.toFixed(2)}</h3>
                            <p className="text-xs text-amber-700 mt-1">Totale da saldare</p>
                        </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Transaction List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><FileText size={20}/> Movimenti</h3>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{filteredTransactions.length} righe</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Descrizione</th>
                                    <th className="p-4 hidden sm:table-cell">Metodo</th>
                                    <th className="p-4 text-right">Importo</th>
                                    <th className="p-4 text-center">Stato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nessun movimento in questo periodo</td></tr>}
                                {filteredTransactions.map((t) => (
                                    <tr key={t.id + t.type} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {t.desc}
                                            {t.ref && <div className="text-xs text-slate-400 font-mono hidden sm:block">{t.ref}</div>}
                                            <div className="flex sm:hidden items-center gap-1 text-[10px] font-bold text-slate-500 mt-1">
                                                {getCategoryIcon(t.category)} {t.category}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 uppercase hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                {getCategoryIcon(t.category)}
                                                <span>{t.method || '-'}</span>
                                            </div>
                                        </td>
                                        <td className={`p-4 text-right font-bold whitespace-nowrap ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'IN' ? '+' : '-'}€{t.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {t.isPaid ? <CheckCircle size={16} className="text-green-500 inline"/> : <AlertCircle size={16} className="text-amber-500 inline"/>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Deadlines Side Panel (Always visible independent of filter) */}
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
                        <h4 className="font-bold mb-1 flex items-center gap-2"><Briefcase size={16}/> Nota Fiscale</h4>
                        <p className="mb-2">I KPI visualizzati dipendono dal periodo selezionato. Le scadenze mostrano sempre i debiti futuri.</p>
                    </div>
                </div>
            </div>

            {/* --- MODAL: DATE RANGE PICKER (Native Style) --- */}
            {isDateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Filter size={20} className="text-indigo-600"/> Filtra Periodo</h3>
                            <button onClick={() => setIsDateModalOpen(false)} className="bg-white p-2 rounded-full hover:bg-slate-200 transition"><X size={20} className="text-slate-500"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Rapidi</label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button onClick={() => applyDatePreset('TODAY')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-xl font-bold text-slate-600 transition text-sm">Oggi</button>
                                <button onClick={() => applyDatePreset('YESTERDAY')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-xl font-bold text-slate-600 transition text-sm">Ieri</button>
                                <button onClick={() => applyDatePreset('THIS_MONTH')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-xl font-bold text-slate-600 transition text-sm">Questo Mese</button>
                                <button onClick={() => applyDatePreset('LAST_MONTH')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-xl font-bold text-slate-600 transition text-sm">Mese Scorso</button>
                                <button onClick={() => applyDatePreset('THIS_YEAR')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-xl font-bold text-slate-600 transition text-sm">Quest'anno</button>
                                <button onClick={() => applyDatePreset('ALL')} className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-xl font-bold text-slate-600 transition text-sm">Tutto</button>
                            </div>

                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block border-t pt-4">Personalizzato</label>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Dal</label>
                                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-100"/>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Al</label>
                                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-100"/>
                                </div>
                            </div>
                            <button onClick={applyCustomDate} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                                Applica Date
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add Transaction */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Registra Movimento</h3>
                            <button onClick={() => setIsTransactionModalOpen(false)}><X className="text-slate-400"/></button>
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

                            {!newTransaction.isPaid ? (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 text-amber-600">Data Scadenza Pagamento</label>
                                    <input type="date" className="w-full p-2 border rounded mt-1 border-amber-200 bg-amber-50" value={newTransaction.dueDate || ''} onChange={e => setNewTransaction({...newTransaction, dueDate: e.target.value})} />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 text-green-600">Metodo di Pagamento</label>
                                    <select className="w-full p-2 border rounded mt-1 bg-green-50 border-green-200" value={newTransaction.paymentMethod} onChange={e => setNewTransaction({...newTransaction, paymentMethod: e.target.value as any})}>
                                        <option value="BANK_TRANSFER">Bonifico Bancario</option>
                                        <option value="CREDIT_CARD">Carta di Credito</option>
                                        <option value="DEBIT_CARD">Bancomat / Debito</option>
                                        <option value="CASH">Contanti</option>
                                        <option value="PAYPAL">PayPal / Satispay</option>
                                        <option value="CHECK">Assegno</option>
                                        <option value="RIBA">Ri.Ba.</option>
                                    </select>
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