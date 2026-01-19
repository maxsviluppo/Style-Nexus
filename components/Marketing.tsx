import React, { useState } from 'react';
import { Wand2, Copy, Check } from 'lucide-react';
import { generateMarketingCopy } from '../services/geminiService';

const Marketing: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [target, setTarget] = useState('Giovani adulti (18-30)');
  const [tone, setTone] = useState('Divertente e informale');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!productName) return;
    setLoading(true);
    setGeneratedCopy('');
    
    const result = await generateMarketingCopy(productName, target, tone);
    
    setGeneratedCopy(result);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wand2 className="text-indigo-600" />
          Marketing AI Assistant
        </h2>
        <p className="text-slate-500">Genera descrizioni accattivanti per i tuoi post social o schede prodotto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Prodotto / Campagna</label>
            <input 
              type="text" 
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="es. Giacca Invernale Termica"
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
            <select 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option>Giovani adulti (18-30)</option>
              <option>Professionisti Business</option>
              <option>Genitori con bambini</option>
              <option>Appassionati di sport</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tono di Voce</label>
            <select 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option>Divertente e informale</option>
              <option>Elegante e lussuoso</option>
              <option>Tecnico e preciso</option>
              <option>Urgente (Saldi)</option>
            </select>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !productName}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${loading || !productName ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
          >
            {loading ? 'Generazione in corso...' : 'Genera Contenuto'}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700">Risultato</h3>
            {generatedCopy && (
              <button 
                onClick={handleCopy}
                className="text-slate-500 hover:text-indigo-600 transition-colors"
                title="Copia testo"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-white p-4 rounded-lg border border-slate-100 overflow-y-auto whitespace-pre-wrap text-slate-700">
            {generatedCopy || <span className="text-slate-400 italic">Il contenuto generato apparirà qui...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;