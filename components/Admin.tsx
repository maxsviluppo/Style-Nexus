import React, { useState } from 'react';
import { StoreSettings, Sale } from '../types';
import { Settings, Save, BarChart } from 'lucide-react';

interface AdminProps {
    settings: StoreSettings;
    setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
    sales: Sale[];
}

const Admin: React.FC<AdminProps> = ({ settings, setSettings, sales }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleSave = () => {
        setSettings(localSettings);
        alert("Impostazioni salvate!");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <Settings className="text-slate-800" size={32} />
                <h2 className="text-2xl font-bold text-slate-800">Amministrazione Negozio</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configurazione */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-700">Configurazione Generale</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Nome Negozio</label>
                            <input 
                                type="text" 
                                value={localSettings.storeName}
                                onChange={e => setLocalSettings({...localSettings, storeName: e.target.value})}
                                className="w-full p-2 border border-slate-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Indirizzo</label>
                            <input 
                                type="text" 
                                value={localSettings.address}
                                onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
                                className="w-full p-2 border border-slate-200 rounded-lg"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Valuta</label>
                                <input 
                                    type="text" 
                                    value={localSettings.currency}
                                    onChange={e => setLocalSettings({...localSettings, currency: e.target.value})}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Aliquota IVA %</label>
                                <input 
                                    type="number" 
                                    value={localSettings.vatRate}
                                    onChange={e => setLocalSettings({...localSettings, vatRate: parseFloat(e.target.value)})}
                                    className="w-full p-2 border border-slate-200 rounded-lg text-center"
                                />
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900 flex justify-center items-center gap-2">
                            <Save size={18} /> Salva Configurazioni
                        </button>
                    </div>
                </div>

                {/* Storico Vendite Recente */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2"><BarChart size={20}/> Ultime Vendite</h3>
                    <div className="flex-1 overflow-y-auto max-h-[300px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                <tr>
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Totale</th>
                                    <th className="p-3">Metodo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.slice().reverse().slice(0, 10).map(sale => (
                                    <tr key={sale.id} className="border-b border-slate-100">
                                        <td className="p-3 text-slate-600">{new Date(sale.date).toLocaleString()}</td>
                                        <td className="p-3 font-bold">€{sale.total.toFixed(2)}</td>
                                        <td className="p-3 text-xs">{sale.paymentMethod}</td>
                                    </tr>
                                ))}
                                {sales.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400">Nessuna vendita registrata</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 text-right font-bold text-indigo-600">
                        Totale Incassato: €{sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;