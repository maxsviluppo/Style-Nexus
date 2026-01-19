import React, { useState } from 'react';
import { Sale, Invoice, FinancialRecord } from '../types';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { analyzeFinancialContext } from '../services/geminiService';

interface CfoAiProps {
    sales: Sale[];
    invoices: Invoice[];
    financialRecords: FinancialRecord[];
}

const CfoAi: React.FC<CfoAiProps> = ({ sales, invoices, financialRecords }) => {
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Calculate Totals including manual entries
    const salesTotal = sales.reduce((acc, s) => acc + s.total, 0);
    const manualIncome = financialRecords.filter(r => r.type === 'IN' && r.isPaid).reduce((acc, r) => acc + r.amount, 0);
    const totalRevenue = salesTotal + manualIncome;

    const invoicesTotal = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const manualExpenses = financialRecords.filter(r => r.type === 'OUT' && r.isPaid).reduce((acc, r) => acc + r.amount, 0);
    const totalExpenses = invoicesTotal + manualExpenses;

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        const result = await analyzeFinancialContext(
            totalRevenue, 
            totalExpenses, 
            sales.length + invoices.length + financialRecords.length, 
            "Abbigliamento Retail"
        );
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in h-full">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BrainCircuit className="text-purple-600" /> Reportistica & CFO AI
                </h2>
                <p className="text-slate-500">Analisi avanzata e consulenza strategica automatizzata.</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden min-h-[500px] flex flex-col">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white/20 p-3 rounded-xl"><BrainCircuit size={32} className="text-white"/></div>
                        <div>
                            <h3 className="text-2xl font-bold">CFO Virtuale AI</h3>
                            <p className="text-indigo-200">Analizzo vendite, fornitori, affitto e tasse per darti strategie reali.</p>
                        </div>
                    </div>

                    {!aiAnalysis ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-white/10 rounded-xl border border-white/10">
                            <p className="mb-6 text-lg max-w-md">Clicca per analizzare il bilancio completo (incluso spese fisse e scadenze) e ricevere consigli.</p>
                            <button 
                                onClick={handleRunAnalysis} 
                                disabled={isAnalyzing}
                                className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition flex items-center gap-2 mx-auto disabled:opacity-70"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin"/> : <BrainCircuit />}
                                {isAnalyzing ? 'Analisi in corso...' : 'Esegui Report Completo'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white/10 rounded-xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-4 overflow-y-auto">
                            <h4 className="font-bold text-xl mb-4 text-emerald-300">Report Strategico Generato</h4>
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
        </div>
    );
};

export default CfoAi;