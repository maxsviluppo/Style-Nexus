import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant, Sale, SaleItem } from '../types';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Package, ScanLine, X, Wifi, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';

interface SalesProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const Sales: React.FC<SalesProps> = ({ products, setProducts, sales, setSales }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('Tutte');
    
    // POS States
    const [isScannerMode, setIsScannerMode] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const scannerInputRef = useRef<HTMLInputElement>(null);

    // SumUp Simulation State
    const [sumUpState, setSumUpState] = useState<'IDLE' | 'CONNECTING' | 'WAITING_CARD' | 'PROCESSING' | 'SUCCESS'>('IDLE');

    // --- Categoy Filter ---
    const categories = ['Tutte', ...Array.from(new Set(products.map(p => p.category)))];

    // --- Cart Logic ---
    const addToCart = (product: Product, variant: ProductVariant) => {
        if (variant.stock <= 0) {
            // Audio feedback error could go here
            return;
        }

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
                setScannedCode(''); // Reset for next scan
                break;
            }
        }
        if (!found) {
            alert("Codice a barre non riconosciuto.");
            setScannedCode('');
        }
    };

    // --- Payment Logic ---
    const processSale = (method: 'CASH' | 'CARD' | 'SUMUP') => {
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const newSale: Sale = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: [...cart],
            total,
            paymentMethod: method
        };

        // Reduce Stock
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
        if (method !== 'SUMUP') alert("Vendita registrata!");
    };

    // --- SumUp Flow ---
    const startSumUpTransaction = async () => {
        if (cart.length === 0) return;
        setSumUpState('CONNECTING');
        
        // Simulating API Connection to Terminal
        setTimeout(() => {
            setSumUpState('WAITING_CARD');
            // Simulating User Tapping Card
            setTimeout(() => {
                setSumUpState('PROCESSING');
                // Simulating Bank Authorization
                setTimeout(() => {
                    setSumUpState('SUCCESS');
                    setTimeout(() => {
                        processSale('SUMUP');
                        setSumUpState('IDLE');
                    }, 1500);
                }, 2000);
            }, 3000);
        }, 1500);
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

                {/* Products Grid */}
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
                            
                            {/* Variants - Quick Add */}
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {p.variants.map(v => (
                                    <button 
                                        key={v.id} 
                                        onClick={() => addToCart(p, v)}
                                        disabled={v.stock === 0}
                                        className={`flex-1 text-xs py-2 rounded-lg font-bold border transition-colors ${v.stock > 0 ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                                    >
                                        {v.size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT: VIRTUAL RECEIPT --- */}
            <div className="w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
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
                        <button 
                            onClick={() => processSale('CASH')} 
                            disabled={cart.length===0} 
                            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-emerald-200 shadow-lg"
                        >
                            <Banknote size={28} /> CONTANTI
                        </button>
                        <button 
                            onClick={startSumUpTransaction} 
                            disabled={cart.length===0} 
                            className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                        >
                            <div className="absolute top-2 right-2"><Wifi size={14} className="text-slate-300"/></div>
                            <CreditCard size={28} /> SUMUP AIR
                        </button>
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
                        {/* Simulation of Camera Viewfinder */}
                        <div className="w-full max-w-sm aspect-[3/4] border-2 border-white/30 rounded-3xl relative overflow-hidden bg-slate-800 flex flex-col items-center justify-center">
                             <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
                             <div className="w-64 h-1 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse z-10"></div>
                             <p className="text-white/50 text-sm mt-8">Inquadra il codice a barre</p>
                             
                             {/* Invisible input that keeps focus to capture scanner gun input */}
                             <form onSubmit={handleBarcodeScan} className="absolute inset-0 opacity-0 z-20 cursor-pointer">
                                <input 
                                    ref={scannerInputRef}
                                    value={scannedCode} 
                                    onChange={e => setScannedCode(e.target.value)} 
                                    className="w-full h-full cursor-pointer"
                                    autoComplete="off"
                                />
                                <button type="submit" className="hidden"></button>
                             </form>
                        </div>
                        <p className="text-white mt-6 font-mono text-xl">{scannedCode || 'In attesa di scansione...'}</p>
                        <p className="text-slate-400 text-sm mt-2">Usa la fotocamera o digita il codice</p>
                    </div>
                </div>
            )}

            {/* --- MODAL: SUMUP SIMULATION --- */}
            {sumUpState !== 'IDLE' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center p-8 text-center">
                        <div className="w-16 h-16 mb-6 relative">
                            {sumUpState === 'CONNECTING' && <Loader2 className="w-full h-full text-indigo-600 animate-spin" />}
                            {sumUpState === 'WAITING_CARD' && <Wifi className="w-full h-full text-indigo-600 animate-pulse" />}
                            {sumUpState === 'PROCESSING' && <Loader2 className="w-full h-full text-indigo-600 animate-spin" />}
                            {sumUpState === 'SUCCESS' && <CheckCircle2 className="w-full h-full text-green-500 animate-bounce" />}
                        </div>
                        
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {sumUpState === 'CONNECTING' && 'Cerco terminale SumUp...'}
                            {sumUpState === 'WAITING_CARD' && 'Avvicina la carta'}
                            {sumUpState === 'PROCESSING' && 'Autorizzazione in corso...'}
                            {sumUpState === 'SUCCESS' && 'Pagamento Riuscito!'}
                        </h3>
                        
                        <p className="text-slate-500 text-lg mb-8">Totale: <b>€{cartTotal.toFixed(2)}</b></p>
                        
                        {/* Visual representation of SumUp Solo/Air */}
                        <div className="w-32 h-48 bg-slate-900 rounded-xl border-4 border-slate-800 flex flex-col items-center justify-center relative shadow-xl">
                             <div className="text-white font-bold text-xs absolute top-4">SumUp</div>
                             <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                                 {sumUpState === 'WAITING_CARD' && <div className="w-12 h-8 border-2 border-slate-300 rounded bg-indigo-100 animate-pulse"></div>}
                                 {sumUpState === 'SUCCESS' && <CheckCircle2 className="text-green-500"/>}
                             </div>
                        </div>

                        <button onClick={() => setSumUpState('IDLE')} className="mt-8 text-slate-400 text-sm hover:text-slate-600 underline">Annulla Transazione</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Sales;