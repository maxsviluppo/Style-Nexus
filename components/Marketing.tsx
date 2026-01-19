import React, { useState } from 'react';
import { Wand2, Copy, Check, Tag, Gift, Percent } from 'lucide-react';
import { generateMarketingCopy } from '../services/geminiService';
import { Product } from '../types';

interface MarketingProps {
  products?: Product[];
}

const Marketing: React.FC<MarketingProps> = ({ products = [] }) => {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'PROMO'>('CONTENT');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Content Generation State
  const [customSubject, setCustomSubject] = useState('');
  const [target, setTarget] = useState('Giovani adulti (18-30)');
  const [tone, setTone] = useState('Divertente e informale');
  
  // Promo State
  const [discountType, setDiscountType] = useState('PERCENT');
  const [discountValue, setDiscountValue] = useState('20%');
  
  // Output State
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    let subject = customSubject;
    if (selectedProductId) {
       const p = products.find(p => p.id === selectedProductId);
       if (p) subject = p.name;
    }

    if (!subject) return;

    setLoading(true);
    setGeneratedCopy('');
    
    const type = activeTab === 'PROMO' ? 'PROMO' : 'POST';
    const promoDetails = activeTab === 'PROMO' ? `${discountValue} ${discountType === 'BONUS' ? 'Bonus' : 'Sconto'}` : undefined;

    const result = await generateMarketingCopy(subject, target, tone, type, promoDetails);
    
    setGeneratedCopy(result);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Wand2 className="text-indigo-600" />
             Marketing & Promozioni AI
           </h2>
           <p className="text-slate-500">Crea post social, campagne sconti e bonus fedeltà.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200">
           <button onClick={() => setActiveTab('CONTENT')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'CONTENT' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>Content Creator</button>
           <button onClick={() => setActiveTab('PROMO')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'PROMO' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>Generatore Promo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Cosa vuoi promuovere?</label>
            <select 
              value={selectedProductId} 
              onChange={e => { setSelectedProductId(e.target.value); setCustomSubject(''); }}
              className="w-full p-3 border border-slate-200 rounded-lg outline-none bg-white mb-2"
            >
               <option value="">-- Seleziona un prodotto dal magazzino --</option>
               {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="text-center text-xs text-slate-400 my-1">- OPPURE -</div>
            <input 
              type="text" 
              value={customSubject}
              onChange={(e) => { setCustomSubject(e.target.value); setSelectedProductId(''); }}
              placeholder="Scrivi argomento manuale (es. Saldi Estivi)"
              className="w-full p-3 border border-slate-200 rounded-lg outline-none"
            />
          </div>

          {activeTab === 'PROMO' && (
             <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-3">
                <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Tag size={16}/> Dettagli Offerta</h4>
                <div className="flex gap-2">
                   <button onClick={() => setDiscountType('PERCENT')} className={`flex-1 py-2 text-sm border rounded-lg ${discountType === 'PERCENT' ? 'bg-white border-indigo-500 text-indigo-700 font-bold' : 'border-transparent text-slate-500'}`}><Percent size={14} className="inline mr-1"/> Sconto %</button>
                   <button onClick={() => setDiscountType('BONUS')} className={`flex-1 py-2 text-sm border rounded-lg ${discountType === 'BONUS' ? 'bg-white border-indigo-500 text-indigo-700 font-bold' : 'border-transparent text-slate-500'}`}><Gift size={14} className="inline mr-1"/> Bonus / Omaggi</button>
                </div>
                <input 
                  type="text" 
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENT' ? "Es. 20%, 3x2" : "Es. Buono 10€, Sciarpa Omaggi"}
                  className="w-full p-2 border border-indigo-200 rounded outline-none"
                />
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Target</label>
               <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
                 <option>Giovani (18-25)</option><option>Adulti (25-45)</option><option>Famiglie</option><option>Luxury</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">Tono</label>
               <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
                 <option>Hype / Urgente</option><option>Elegante</option><option>Amichevole</option><option>Professionale</option>
               </select>
             </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || (!customSubject && !selectedProductId)}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
          >
            {loading ? 'L\'AI sta scrivendo...' : `Genera ${activeTab === 'PROMO' ? 'Promozione' : 'Post'}`}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700">Anteprima Testo</h3>
            {generatedCopy && (
              <button onClick={handleCopy} className="text-slate-500 hover:text-indigo-600 transition-colors" title="Copia">
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-white p-6 rounded-lg border border-slate-100 overflow-y-auto whitespace-pre-wrap text-slate-700 shadow-inner font-medium text-lg leading-relaxed">
            {generatedCopy || <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2"><Wand2 size={32}/><span className="text-sm">Configura e clicca Genera</span></div>}
          </div>
          
          <div className="mt-4 flex gap-2">
             <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Condividi FB</button>
             <button className="flex-1 bg-pink-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-pink-700">Condividi IG</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;