import React, { useState } from 'react';
import { Product, ProductVariant, Sale, SaleItem } from '../types';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, CheckCircle, Package } from 'lucide-react';

interface SalesProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const Sales: React.FC<SalesProps> = ({ products, setProducts, sales, setSales }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    
    // POS Functions
    const addToCart = (product: Product, variant: ProductVariant) => {
        if (variant.stock <= 0) {
            alert("Prodotto esaurito!");
            return;
        }

        const existingItem = cart.find(item => item.variantId === variant.id);
        
        if (existingItem) {
            if (existingItem.quantity >= variant.stock) {
                alert("Stock insufficiente!");
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

    const completeSale = (method: 'CASH' | 'CARD') => {
        if (cart.length === 0) return;

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
        alert("Vendita registrata con successo!");
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.variants.some(v => v.barcode.includes(searchTerm))
    );

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
            {/* Product Grid */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-2">
                    <Search className="text-slate-400"/>
                    <input 
                        className="flex-1 outline-none" 
                        placeholder="Cerca per nome o barcode..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-100 hover:shadow-md transition flex flex-col">
                            <div className="h-32 bg-slate-100 rounded-lg mb-2 overflow-hidden">
                                <img src={p.imageUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="font-bold text-slate-800 text-sm truncate">{p.name}</div>
                            <div className="text-indigo-600 font-bold mb-2">€{p.price.toFixed(2)}</div>
                            <div className="flex-1 flex flex-wrap gap-1 content-end">
                                {p.variants.map(v => (
                                    <button 
                                        key={v.id} 
                                        onClick={() => addToCart(p, v)}
                                        disabled={v.stock === 0}
                                        className={`text-xs px-2 py-1 rounded border ${v.stock > 0 ? 'bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {v.size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Section */}
            <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 font-bold text-lg flex items-center gap-2">
                    <ShoppingCart /> Carrello Attuale
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <Package size={48} />
                            <p className="mt-2 text-sm">Il carrello è vuoto</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.variantId} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">{item.name}</div>
                                    <div className="text-xs text-slate-500">{item.details}</div>
                                    <div className="text-xs text-indigo-600 font-bold">€{item.price.toFixed(2)} x {item.quantity}</div>
                                </div>
                                <div className="font-bold text-slate-800 flex items-center gap-3">
                                    €{(item.price * item.quantity).toFixed(2)}
                                    <button onClick={() => removeFromCart(item.variantId)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-500 font-medium">Totale Da Pagare</span>
                        <span className="text-3xl font-bold text-slate-800">€{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => completeSale('CASH')} disabled={cart.length===0} className="py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                            <Banknote size={20} /> CONTANTI
                        </button>
                        <button onClick={() => completeSale('CARD')} disabled={cart.length===0} className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                            <CreditCard size={20} /> CARTA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sales;