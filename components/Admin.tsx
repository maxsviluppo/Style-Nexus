import React, { useState } from 'react';
import { StoreSettings, Sale, Invoice } from '../types';
import { 
    Settings, Save, BarChart, FileText, Briefcase, 
    Upload, PieChart, TrendingUp, TrendingDown,
    BrainCircuit, Loader2
} from 'lucide-react';
import { analyzeFinancialContext } from '../services/geminiService';

interface AdminProps {
    settings: StoreSettings;
    setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
    sales: Sale[];
    invoices: Invoice[];
}

const Admin: React.FC<AdminProps> = ({ settings, setSettings, sales, invoices }) => {
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'ACCOUNTING' | 'AI'>('PROFILE');
    const [localSettings, setLocalSettings] = useState(settings);

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- Helpers for Accounting ---
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenses = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // Unified Transactions List (Statement of Account)
    const transactions = [
        ...sales.map(s => ({ 
            id: s.id, date: s.date, type: 'IN' as const, amount: s.total, 
            desc: `Vendita ${s.items.length} articoli`, ref: 'Scontrino' 
        })),
        ...invoices.map(i => ({ 
            id: i.id, date: i.date, type: 'OUT' as const, amount: i.totalAmount, 
            desc: `Fattura Fornitore`, ref: i.invoiceNumber 
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSave = () => {
        setSettings(localSettings);
        alert("Impostazioni salvate!");
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setLocalSettings({...localSettings, logoUrl: url});
        }
    };

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        const result = await analyzeFinancialContext(
            totalRevenue, 
            totalExpenses, 
            transactions.length, 
            "Abbigliamento Retail"
        );
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-slate-800" /> Amministrazione & Contabilità
                    </h2>
                    <p className="text-slate-500">Gestione aziendale, fiscale e analisi performance.</p>
                </div>
                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                    <button onClick={() => setActiveTab('PROFILE')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='PROFILE'?'bg-indigo-100 text-indigo-700':'text-slate-500'}`}>Profilo Azienda</button>
                    <button onClick={() => setActiveTab('ACCOUNTING')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='ACCOUNTING'?'bg-indigo-100 text-indigo-700':'text-slate-500'}`}>Contabilità</button>
                    <button onClick={() => setActiveTab('AI')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab==='AI'?'bg-indigo-100 text-indigo-700':'text-slate-500'}`}>CFO AI</button>
                </div>
            </div>

            {/* TAB: PROFILE */}
            {activeTab === 'PROFILE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: General & Logo */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center">
                            <div className="w-32 h-32 mx-auto bg-slate-50 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 overflow-hidden relative group">
                                {localSettings.logoUrl ? (
                                    <img src={localSettings.logoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-400 text-xs">Nessun Logo</span>
                                )}
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-xs font-bold">
                                    <Upload size={20} className="mb-1 block mx-auto"/> Carica
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                                </label>
                            </div>
                            <h3 className="font-bold text-slate-800">{localSettings.storeName}</h3>
                            <p className="text-xs text-slate-500">Logo Aziendale</p>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                             <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Briefcase size={18}/> Dati Generali</h4>
                             <div className="space-y-3">
                                <div><label className="text-xs font-bold text-slate-500">Insegna Negozio</label><input type="text" value={localSettings.storeName} onChange={e=>setLocalSettings({...localSettings, storeName: e.target.value})} className="w-full p-2 border rounded"/></div>
                                <div><label className="text-xs font-bold text-slate-500">Valuta (€)</label><input type="text" value={localSettings.currency} onChange={e=>setLocalSettings({...localSettings, currency: e.target.value})} className="w-full p-2 border rounded"/></div>
                                <div><label className="text-xs font-bold text-slate-500">IVA Default (%)</label><input type="number" value={localSettings.vatRate} onChange={e=>setLocalSettings({...localSettings, vatRate: parseFloat(e.target.value)})} className="w-full p-2 border rounded"/></div>
                             </div>
                        </div>
                    </div>

                    {/* Center: Fiscal Data */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                         <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><FileText size={18}/> Dati Fiscali & Fatturazione</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500">Ragione Sociale Completa</label><input type="text" value={localSettings.companyName} onChange={e=>setLocalSettings({...localSettings, companyName: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Partita IVA</label><input type="text" value={localSettings.vatNumber} onChange={e=>setLocalSettings({...localSettings, vatNumber: e.target.value})} className="w-full p-2 border rounded font-mono"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Codice Fiscale</label><input type="text" value={localSettings.fiscalCode} onChange={e=>setLocalSettings({...localSettings, fiscalCode: e.target.value})} className="w-full p-2 border rounded font-mono"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Codice Univoco (SDI)</label><input type="text" value={localSettings.sdiCode || ''} onChange={e=>setLocalSettings({...localSettings, sdiCode: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">PEC</label><input type="email" value={localSettings.pec || ''} onChange={e=>setLocalSettings({...localSettings, pec: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500">Sede Legale (Via, Civico)</label><input type="text" value={localSettings.address} onChange={e=>setLocalSettings({...localSettings, address: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Città</label><input type="text" value={localSettings.city} onChange={e=>setLocalSettings({...localSettings, city: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">CAP</label><input type="text" value={localSettings.zip} onChange={e=>setLocalSettings({...localSettings, zip: e.target.value})} className="w-full p-2 border rounded"/></div>
                         </div>
                         
                         <h4 className="font-bold text-slate-700 mt-8 mb-4 flex items-center gap-2 border-b pb-2">Contatti & Social</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="text-xs font-bold text-slate-500">Email Pubblica</label><input type="email" value={localSettings.email} onChange={e=>setLocalSettings({...localSettings, email: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Telefono</label><input type="text" value={localSettings.phone} onChange={e=>setLocalSettings({...localSettings, phone: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Sito Web</label><input type="text" value={localSettings.website || ''} onChange={e=>setLocalSettings({...localSettings, website: e.target.value})} className="w-full p-2 border rounded"/></div>
                             <div><label className="text-xs font-bold text-slate-500">Instagram URL</label><input type="text" value={localSettings.instagram || ''} onChange={e=>setLocalSettings({...localSettings, instagram: e.target.value})} className="w-full p-2 border rounded"/></div>
                         </div>

                         <div className="mt-8 flex justify-end">
                             <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
                                 <Save size={20}/> Salva Modifiche
                             </button>
                         </div>
                    </div>
                </div>
            )}

            {/* TAB: ACCOUNTING */}
            {activeTab === 'ACCOUNTING' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                             <div>
                                 <p className="text-sm font-medium text-slate-500">Totale Ricavi (Vendite)</p>
                                 <h3 className="text-2xl font-bold text-emerald-600 mt-1">+ €{totalRevenue.toFixed(2)}</h3>
                             </div>
                             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp /></div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                             <div>
                                 <p className="text-sm font-medium text-slate-500">Totale Costi (Fatture)</p>
                                 <h3 className="text-2xl font-bold text-rose-600 mt-1">- €{totalExpenses.toFixed(2)}</h3>
                             </div>
                             <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown /></div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                             <div>
                                 <p className="text-sm font-medium text-slate-500">Utile Netto (Profitto)</p>
                                 <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>€{netProfit.toFixed(2)}</h3>
                             </div>
                             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><PieChart /></div>
                        </div>
                    </div>

                    {/* Statement of Account */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><FileText size={20}/> Estratto Conto Unificato</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Descrizione</th>
                                        <th className="p-4">Riferimento</th>
                                        <th className="p-4 text-right">Entrate</th>
                                        <th className="p-4 text-right">Uscite</th>
                                        <th className="p-4 text-right">Saldo Op.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nessuna transazione registrata</td></tr>}
                                    {transactions.map((t) => (
                                        <tr key={t.id + t.type} className="hover:bg-slate-50">
                                            <td className="p-4 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium text-slate-800">{t.desc}</td>
                                            <td className="p-4 font-mono text-xs text-slate-500">{t.ref}</td>
                                            <td className="p-4 text-right font-bold text-emerald-600">{t.type === 'IN' ? `€${t.amount.toFixed(2)}` : '-'}</td>
                                            <td className="p-4 text-right font-bold text-rose-600">{t.type === 'OUT' ? `€${t.amount.toFixed(2)}` : '-'}</td>
                                            <td className="p-4 text-right text-slate-400">...</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: AI ANALYSIS */}
            {activeTab === 'AI' && (
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-white/20 p-3 rounded-xl"><BrainCircuit size={32} className="text-white"/></div>
                            <div>
                                <h3 className="text-2xl font-bold">CFO Virtuale AI</h3>
                                <p className="text-indigo-200">Analisi finanziaria automatizzata e consigli strategici.</p>
                            </div>
                        </div>

                        {!aiAnalysis ? (
                            <div className="text-center py-12 bg-white/10 rounded-xl border border-white/10">
                                <p className="mb-6 text-lg">Clicca per analizzare entrate, uscite e margini attuali.</p>
                                <button 
                                    onClick={handleRunAnalysis} 
                                    disabled={isAnalyzing}
                                    className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition flex items-center gap-2 mx-auto disabled:opacity-70"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin"/> : <BrainCircuit />}
                                    {isAnalyzing ? 'Analisi in corso...' : 'Esegui Analisi Finanziaria'}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/10 rounded-xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-4">
                                <h4 className="font-bold text-xl mb-4 text-emerald-300">Report Strategico</h4>
                                <div className="prose prose-invert max-w-none text-indigo-50 whitespace-pre-wrap leading-relaxed">
                                    {aiAnalysis}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={() => setAiAnalysis('')} className="text-sm underline text-indigo-300 hover:text-white">Nuova Analisi</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;