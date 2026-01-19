import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant, Sale, SaleItem, StoreSettings } from '../types';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Package, ScanLine, X, Wifi, Smartphone, Loader2, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';
import { printFiscalReceipt, initSumUpPayment } from '../services/hardwareService';

interface SalesProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
    settings: StoreSettings;
}

const Sales: React.FC<SalesProps> = ({ products, setProducts, sales, setSales, settings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('Tutte');
    
    // POS States
    const [isScannerMode, setIsScannerMode] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const scannerInputRef = useRef<HTMLInputElement>(null);

    // Hardware States
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // --- Categoy Filter ---
    const categories = ['Tutte', ...Array.from(new Set(products.map(p => p.category)))];

    // --- Cart Logic ---
    const addToCart = (product: Product, variant: ProductVariant) => {
        if (variant.stock <= 0) return;

        const existingItem = cart.find(item => item.variantId === variant.id);
        
        if (existingItem) {
            if (existingItem.quantity >= variant.stock) {
                alert("Stock insufficiente per questa variante!");
                return;
            }
            setCart(cart.map(item => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, {
                productId: product.id,
                variantId: variant.id,
                name: product.name,
                details: `${variant.size} - ${variant.color}`,
                price: product.price,
                quantity: 1
            }]);
        }
    };

    const removeFromCart = (variantId: string) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    const handleBarcodeScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedCode) return;

        let found = false;
        for (const p of products) {
            const v = p.variants.find(va => va.barcode === scannedCode);
            if (v) {
                addToCart(p, v);
                found = true;
                setScannedCode(''); 
                break;
            }
        }
        if (!found) {
            alert("Codice a barre non riconosciuto.");
            setScannedCode('');
        }
    };

    // --- Payment Logic & Hardware ---
    const processSale = async (method: 'CASH' | 'CARD' | 'SUMUP') => {
        if (cart.length === 0) return;

        // SUMUP Integration Logic
        if (method === 'SUMUP') {
            if (!settings.integrations.sumUpEnabled || !settings.integrations.sumUpEmail) {
                alert("Errore: SumUp non configurato nelle impostazioni.");
                return;
            }
            setIsProcessingPayment(true);
            setStatusMessage("In attesa del terminale SumUp...");
            
            const sumUpResult = await initSumUpPayment(cartTotal, settings.integrations.sumUpEmail);
            
            if (!sumUpResult.success) {
                alert(sumUpResult.message);
                setIsProcessingPayment(false);
                setStatusMessage('');
                return;
            }
        }

        // Finalize Sale Record
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const newSale: Sale = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: [...cart],
            total,
            paymentMethod: method
        };

        // Fiscal Printer Logic
        if (settings.integrations.printerEnabled && settings.integrations.printerIp) {
            setStatusMessage("Stampa Scontrino Fiscale in corso...");
            setIsProcessingPayment(true); // Keep loading UI
            const printResult = await printFiscalReceipt(newSale, settings.integrations.printerIp, settings.integrations.printerBrand);
            if (!printResult.success) {
                alert(`ATTENZIONE: ${printResult.message}. La vendita è stata comunque salvata.`);
            }
        }

        // Update Stock
        const updatedProducts = products.map(p => {
            const productInCart = cart.filter(item => item.productId === p.id);
            if (productInCart.length > 0) {
                const updatedVariants = p.variants.map(v => {
                    const variantInCart = productInCart.find(item => item.variantId === v.id);
                    if (variantInCart) {
                        return { ...v, stock: v.stock - variantInCart.quantity };
                    }
                    return v;
                });
                return { ...p, variants: updatedVariants };
            }
            return p;
        });

        setProducts(updatedProducts);
        setSales([...sales, newSale]);
        setCart([]);
        setIsProcessingPayment(false);
        setStatusMessage('');
        
        if (method === 'CASH') alert("Vendita Registrata (Contanti)");
        if (method === 'SUMUP') alert("Transazione Eseguita & Vendita Registrata");
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.variants.some(v => v.barcode.includes(searchTerm));
        const matchesCat = activeCategory === 'Tutte' || p.category === activeCategory;
        return matchesSearch && matchesCat;
    });

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Auto-focus scanner input when mode is active
    useEffect(() => {
        if (isScannerMode && scannerInputRef.current) {
            scannerInputRef.current.focus();
        }
    }, [isScannerMode]);

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 animate-fade-in pb-4 relative">
            
            {/* --- LEFT: POS REGISTER INTERFACE --- */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Search & Categories */}
                <div className="flex gap-4">
                     <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 flex gap-2 items-center shadow-sm">
                        <Search className="text-slate-400"/>
                        <input 
                            className="flex-1 outline-none text-lg" 
                            placeholder="Cerca prodotto..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsScannerMode(true)}
                        className="bg-slate-800 text-white px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 shadow-md transition-all active:scale-95"
                    >
                        <ScanLine /> SCANNER
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all shadow-sm border ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid - Showing ALL items neatly */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start pr-2">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer flex flex-col h-fit group">
                            <div className="relative h-32 bg-slate-100 rounded-xl mb-3 overflow-hidden">
                                <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-800 backdrop-blur-sm">
                                    {p.category}
                                </div>
                            </div>
                            <div className="font-bold text-slate-800 text-sm leading-tight mb-1">{p.name}</div>
                            <div className="text-indigo-600 font-extrabold text-lg mb-3">€{p.price.toFixed(2)}</div>
                            
                            {/* Variants - Quick Add Grid */}
                            <div className="flex flex-wrap gap-1 mt-auto">
                                {p.variants.map(v => (
                                    <button 
                                        key={v.id} 
                                        onClick={() => addToCart(p, v)}
                                        disabled={v.stock === 0}
                                        className={`flex-1 min-w-[30%] text-[10px] py-1.5 px-1 rounded-md font-bold border transition-colors ${v.stock > 0 ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                                        title={`Stock: ${v.stock}`}
                                    >
                                        {v.size} {v.stock<=2 && v.stock>0 && '⚠️'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT: VIRTUAL RECEIPT --- */}
            <div className="w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden relative">
                
                {/* Fiscal Printer Status Indicator */}
                {settings.integrations.printerEnabled && (
                    <div className="absolute top-0 right-0 m-2 z-10">
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border border-green-200">
                            <Printer size={10} /> RT {settings.integrations.printerBrand} ONLINE
                        </div>
                    </div>
                )}

                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="text-indigo-600" /> Scontrino
                    </div>
                    <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                        {cart.length} Articoli
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                            <Package size={64} strokeWidth={1} />
                            <p className="mt-4 font-medium">In attesa prodotti...</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.variantId} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl group transition-colors border-b border-dashed border-slate-100 last:border-0">
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                    <div className="text-xs text-slate-500 font-medium">{item.details}</div>
                                    <div className="text-xs text-indigo-600 font-bold mt-1">€{item.price.toFixed(2)} x {item.quantity}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="font-bold text-slate-800">€{(item.price * item.quantity).toFixed(2)}</div>
                                    <button onClick={() => removeFromCart(item.variantId)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Total & Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4 shadow-inner">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 font-medium text-sm">Totale Complessivo</span>
                        <span className="text-4xl font-extrabold text-slate-800 tracking-tight">€{cartTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 h-28">
                        {/* Cash Button - Always Visible */}
                        <button 
                            onClick={() => processSale('CASH')} 
                            disabled={cart.length===0 || isProcessingPayment} 
                            className={`bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-emerald-200 shadow-lg ${!settings.integrations.sumUpEnabled ? 'col-span-2' : ''}`}
                        >
                            <Banknote size={28} /> CONTANTI
                        </button>
                        
                        {/* SumUp Button - Conditional */}
                        {settings.integrations.sumUpEnabled ? (
                            <button 
                                onClick={() => processSale('SUMUP')} 
                                disabled={cart.length===0 || isProcessingPayment} 
                                className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                            >
                                <div className="absolute top-2 right-2"><Wifi size={14} className="text-slate-300"/></div>
                                <CreditCard size={28} /> SUMUP AIR
                            </button>
                        ) : (
                             // If SumUp disabled, show a placeholder or disabled generic card button (optional) or nothing (grid-span handled above)
                             null
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL: SCANNER MODE (SMARTPHONE STYLE) --- */}
            {isScannerMode && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center text-white bg-slate-900">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Smartphone /> Modalità Scanner</h3>
                        <button onClick={() => setIsScannerMode(false)} className="bg-white/20 p-2 rounded-full"><X /></button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                         {/* Viewfinder logic remains same */}
                         <div className="w-full max-w-sm aspect-[3/4] border-2 border-white/30 rounded-3xl relative overflow-hidden bg-slate-800 flex flex-col items-center justify-center">
                             <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
                             <div className="w-64 h-1 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse z-10"></div>
                             <p className="text-white/50 text-sm mt-8">Inquadra il codice a barre</p>
                             <form onSubmit={handleBarcodeScan} className="absolute inset-0 opacity-0 z-20 cursor-pointer">
                                <input ref={scannerInputRef} value={scannedCode} onChange={e => setScannedCode(e.target.value)} className="w-full h-full cursor-pointer" autoComplete="off"/>
                                <button type="submit" className="hidden"></button>
                             </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PROCESSING OVERLAY --- */}
            {isProcessingPayment && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-6 animate-pulse">
                        <Loader2 className="animate-spin text-indigo-600 w-16 h-16"/>
                        <h3 className="text-xl font-bold text-slate-800">{statusMessage}</h3>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Sales;