import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { 
    Settings, Save, FileText, Briefcase, 
    Upload
} from 'lucide-react';

interface AdminProps {
    settings: StoreSettings;
    setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

const Admin: React.FC<AdminProps> = ({ settings, setSettings }) => {
    const [localSettings, setLocalSettings] = useState(settings);

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

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-slate-800" /> Impostazioni Azienda
                    </h2>
                    <p className="text-slate-500">Gestione profilo, logo e dati fiscali.</p>
                </div>
            </div>

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
        </div>
    );
};

export default Admin;