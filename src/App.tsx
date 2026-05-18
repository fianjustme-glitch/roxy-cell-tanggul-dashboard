/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Phone, 
  Package, 
  Smartphone, 
  Bike, 
  Search, 
  PlusCircle, 
  X,
  Upload,
  Info,
  RefreshCcw,
  Store,
  ChevronRight,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type QUALITY = 'Baru Garansi Resmi' | 'Bekas Mulus' | 'Bekas Minus' | 'Lainnya';
type CATEGORY = 'Handphone' | 'E-Bike' | 'Aksesoris' | 'Lainnya';

interface Product {
  id: string;
  name: string;
  category: CATEGORY;
  quality: QUALITY;
  price: number;
  stock: number;
  image: string; // Base64
  createdAt: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}

// --- Utils ---

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getQualityColor = (quality: QUALITY) => {
  switch (quality) {
    case 'Baru Garansi Resmi': return 'bg-green-600';
    case 'Bekas Mulus': return 'bg-blue-600';
    case 'Bekas Minus': return 'bg-orange-600';
    default: return 'bg-gray-600';
  }
};

// --- Components ---

export default function App() {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CATEGORY | 'Semua'>('Semua');

  // New Product Form State
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt'>>({
    name: '',
    category: 'Handphone',
    quality: 'Baru Garansi Resmi',
    price: 0,
    stock: 0,
    image: '',
  });

  // --- Effects ---
  useEffect(() => {
    const savedProducts = localStorage.getItem('roxy_products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Failed to load products from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('roxy_products', JSON.stringify(products));
  }, [products]);

  // --- Actions ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      ...newProduct,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setProducts([product, ...products]);
    setIsAddingProduct(false);
    setNewProduct({
      name: '',
      category: 'Handphone',
      quality: 'Baru Garansi Resmi',
      price: 0,
      stock: 0,
      image: '',
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStock = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, stock: Math.max(0, p.stock + delta) };
      }
      return p;
    }));
  };

  const deleteProduct = (id: string) => {
    if (confirm('Hapus barang ini dari display?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => prev.filter(c => c.productId !== id));
    }
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        // Find current quantity in cart vs stock
        if (existing.quantity < product.stock) {
          return prev.map(item => 
            item.productId === productId 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
        return prev;
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > product.stock) return item;
          return { ...item, quantity: nextQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const resetCalculator = () => {
    setCart([]);
  };

  const finalizeTransaction = () => {
    // Kurangi stok permanen saat transaksi selesai
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.productId === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));
    setCart([]);
    alert('Transaksi berhasil diselesaikan. Stok telah diperbarui.');
  };

  const sendWhatsAppReceipt = () => {
    if (cart.length === 0) return;

    const itemsText = cart.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return `• ${p?.name} (${p?.quality}) - ${item.quantity}x @ ${formatIDR(p?.price || 0)}`;
    }).join('\n');

    const total = cart.reduce((acc, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);

    const message = `Halo Roxy Cell Tanggul!\n\n*RINCIAN BELANJAAN*\n------------------\n${itemsText}\n------------------\n*Total: ${formatIDR(total)}*\n\nTerima kasih!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/6281357066070?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- Derived State ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const cartTotalPrice = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);
  }, [cart, products]);

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  }, [products]);

  return (
    <div className="min-h-screen bg-roxy-black text-white font-sans selection:bg-roxy-red selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-roxy-red px-6 py-4 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-roxy-red px-2 py-1.5 rounded-lg flex items-center justify-center shadow-lg font-black text-2xl italic">
              R
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tighter leading-none uppercase italic">
                ROXY CELL <span className="text-black/30">TANGGUL</span>
              </h1>
              <p className="text-[10px] text-white/70 mt-1 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                ADMIN PANEL V1.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {['Semua', 'Handphone', 'E-Bike', 'Aksesoris', 'Lainnya'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                  activeCategory === cat 
                  ? 'bg-white text-roxy-red border-white shadow-xl shadow-black/10' 
                  : 'bg-transparent text-white/70 border-white/20 hover:border-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content: Products Display */}
          <div className="lg:col-span-8">
            {/* Search and Add Header */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-roxy-red transition-colors" />
                <input 
                  type="text" 
                  placeholder="CARI BARANG..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-roxy-dark border-2 border-roxy-gray rounded-xl py-4 pl-14 pr-4 text-white focus:outline-none focus:border-roxy-red transition-all placeholder:text-white/20 font-black uppercase text-sm tracking-widest"
                />
              </div>
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-roxy-red hover:bg-roxy-red/80 text-white font-black px-10 py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-roxy-red/20 active:scale-95 uppercase tracking-widest text-sm"
              >
                <PlusCircle className="w-5 h-5" />
                TAMBAH BARANG
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-roxy-dark p-5 rounded-2xl border border-roxy-gray">
                <p className="text-[10px] text-roxy-red uppercase font-black tracking-widest mb-1 italic">Varian</p>
                <p className="text-3xl font-black text-white">{products.length}</p>
              </div>
              <div className="bg-roxy-dark p-5 rounded-2xl border border-roxy-gray">
                <p className="text-[10px] text-roxy-red uppercase font-black tracking-widest mb-1 italic">Total Stok</p>
                <p className="text-3xl font-black text-white">{products.reduce((a, b) => a + b.stock, 0)}</p>
              </div>
              <div className="bg-roxy-dark p-5 rounded-2xl border border-roxy-gray col-span-2">
                <p className="text-[10px] text-roxy-red uppercase font-black tracking-widest mb-1 italic">Nilai Aset</p>
                <p className="text-3xl font-black text-white italic">{formatIDR(totalStockValue)}</p>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-roxy-dark border border-roxy-gray rounded-2xl overflow-hidden flex flex-col group hover:border-roxy-red transition-all shadow-2xl"
                  >
                    {/* Badge Quality */}
                    <div className="relative aspect-[4/3] bg-black">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/5 uppercase italic font-black">
                          {p.category === 'Handphone' ? <Smartphone className="w-12 h-12 mb-2" /> : <Bike className="w-12 h-12 mb-2" />}
                          <p className="text-[8px]">No Image</p>
                        </div>
                      )}
                      <div className={`absolute top-4 left-4 ${getQualityColor(p.quality)} text-white text-[9px] font-black uppercase px-2.5 py-1 rounded shadow-lg tracking-widest`}>
                        {p.quality}
                      </div>
                      
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="absolute top-4 right-4 bg-black/60 hover:bg-roxy-red text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[9px] text-white/40 uppercase font-black tracking-widest italic">{p.category}</p>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">STOCK: {p.stock}</span>
                        </div>
                        <h3 className="text-lg font-black text-white leading-none uppercase italic tracking-tighter truncate">{p.name}</h3>
                        <p className="text-2xl font-black text-rose-500 mt-2 tracking-tighter">{formatIDR(p.price)}</p>
                      </div>

                      {/* Stock Controls */}
                      <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 mb-4 border border-white/5">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Manage Stock</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateStock(p.id, -1)}
                            className="w-8 h-8 rounded bg-roxy-gray hover:bg-roxy-red text-white transition-colors flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-black w-6 text-center text-white">
                            {p.stock}
                          </span>
                          <button 
                            onClick={() => updateStock(p.id, 1)}
                            className="w-8 h-8 rounded bg-roxy-gray hover:bg-roxy-red text-white transition-colors flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <button 
                        disabled={p.stock <= 0}
                        onClick={() => addToCart(p.id)}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                          p.stock > 0 
                          ? 'bg-roxy-red hover:bg-white hover:text-roxy-red text-white shadow-lg' 
                          : 'bg-roxy-gray text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {p.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center text-white/5 bg-roxy-dark rounded-[3rem] border-2 border-dashed border-roxy-gray">
                  <Package className="w-20 h-20 mb-4" />
                  <p className="text-xl font-black uppercase tracking-[0.3em] italic">No Products Found</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Calculator Section */}
          <div className="lg:col-span-4">
            <div className="sticky top-32">
              <div className="bg-roxy-dark border-2 border-roxy-gray rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                {/* Calculator Header */}
                <div className="bg-roxy-red p-8 text-white relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Store className="w-16 h-16" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-black italic flex items-center gap-2 uppercase tracking-tighter">
                      Kasir <span className="text-black/30">Roxy</span>
                    </h2>
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest font-mono">CALC_SESSION_V1.2</p>
                </div>

                {/* Items List */}
                <div className="p-6 max-h-[400px] overflow-y-auto custom-scroll bg-black/20">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => {
                      const p = products.find(prod => prod.id === item.productId);
                      if (!p) return null;
                      return (
                        <motion.div 
                          key={item.productId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-4 mb-4 pb-4 border-b border-roxy-gray last:border-0 last:mb-0 last:pb-0"
                        >
                          <div className="w-14 h-14 bg-black/40 rounded-lg overflow-hidden shrink-0 border border-white/5">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black text-[8px]">
                                IMG
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-white truncate uppercase italic">{p.name}</h4>
                            <p className="text-xs text-roxy-red font-black tracking-tighter">{formatIDR(p.price)}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-roxy-black p-1.5 rounded-lg border border-white/5">
                            <button 
                              onClick={() => updateCartQuantity(item.productId, -1)}
                              className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-roxy-red"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.productId, 1)}
                              className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-roxy-red"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {cart.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-white/5">
                      <TrendingDown className="w-12 h-12 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">No active cart items</p>
                    </div>
                  )}
                </div>

                {/* Calculator Footer */}
                <div className="p-8 bg-black/40 border-t-2 border-roxy-gray">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Grand Total</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter">{formatIDR(cartTotalPrice)}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      disabled={cart.length === 0}
                      onClick={sendWhatsAppReceipt}
                      className="w-full py-5 bg-green-600 hover:bg-green-500 disabled:bg-roxy-gray disabled:text-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-green-900/20"
                    >
                      <Phone className="w-5 h-5 fill-current" />
                      SEND WA RECEIPT
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        disabled={cart.length === 0}
                        onClick={finalizeTransaction}
                        className="py-4 bg-roxy-gray/20 hover:bg-roxy-gray/40 disabled:text-white/5 text-roxy-red border-2 border-roxy-gray rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        FINISH
                      </button>
                      <button 
                        disabled={cart.length === 0}
                        onClick={resetCalculator}
                        className="py-4 bg-roxy-gray/20 hover:bg-roxy-gray/40 disabled:text-white/5 text-white/60 border-2 border-roxy-gray rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Tip */}
              <div className="mt-8 flex items-start gap-4 p-6 bg-roxy-red/5 border-2 border-roxy-red/10 rounded-2xl italic">
                <AlertCircle className="w-5 h-5 text-roxy-red shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/40 leading-relaxed font-black uppercase tracking-wider">
                  <span className="text-roxy-red">ADMIN ADVISORY:</span> 
                  Session data persists locally. Clear browser storage only if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Product Modal Overlay */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-roxy-dark border-4 border-roxy-red rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 sm:p-12">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">Tambah <span className="text-roxy-red">Barang</span></h2>
                  <button 
                    onClick={() => setIsAddingProduct(false)}
                    className="p-3 bg-roxy-gray hover:bg-roxy-red rounded-xl text-white transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Info */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-roxy-red uppercase tracking-[0.2em] mb-2 italic">Product Model</label>
                      <input 
                        required
                        type="text" 
                        placeholder="IPHONE 15 PRO MAX"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full bg-black/40 border-2 border-roxy-gray rounded-xl px-5 py-4 text-white focus:outline-none focus:border-roxy-red transition-all font-black uppercase text-xs tracking-widest placeholder:text-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-roxy-red uppercase tracking-[0.2em] mb-2 italic">Category</label>
                        <select 
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                          className="w-full bg-black/40 border-2 border-roxy-gray rounded-xl px-4 py-4 text-white focus:outline-none focus:border-roxy-red transition-all font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
                        >
                          <option value="Handphone">Handphone</option>
                          <option value="E-Bike">E-Bike</option>
                          <option value="Aksesoris">Aksesoris</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-roxy-red uppercase tracking-[0.2em] mb-2 italic">Quality</label>
                        <select 
                          value={newProduct.quality}
                          onChange={(e) => setNewProduct({...newProduct, quality: e.target.value as any})}
                          className="w-full bg-black/40 border-2 border-roxy-gray rounded-xl px-4 py-4 text-white focus:outline-none focus:border-roxy-red transition-all font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer"
                        >
                          <option value="Baru Garansi Resmi">Baru</option>
                          <option value="Bekas Mulus">Bekas Mulus</option>
                          <option value="Bekas Minus">Bekas Minus</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-roxy-red uppercase tracking-[0.2em] mb-2 italic">Price (IDR)</label>
                        <input 
                          required
                          type="number" 
                          placeholder="0"
                          value={newProduct.price || ''}
                          onChange={(e) => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})}
                          className="w-full bg-black/40 border-2 border-roxy-gray rounded-xl px-5 py-4 text-white focus:outline-none focus:border-roxy-red transition-all font-black uppercase text-xs tracking-widest"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-roxy-red uppercase tracking-[0.2em] mb-2 italic">Init Stock</label>
                        <input 
                          required
                          type="number" 
                          placeholder="0"
                          value={newProduct.stock || ''}
                          onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                          className="w-full bg-black/40 border-2 border-roxy-gray rounded-xl px-5 py-4 text-white focus:outline-none focus:border-roxy-red transition-all font-black uppercase text-xs tracking-widest"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Image */}
                  <div className="flex flex-col">
                    <label className="block text-[10px] font-black text-roxy-red uppercase tracking-[0.2em] mb-2 italic">Product Capture</label>
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-roxy-gray bg-black/40 rounded-2xl overflow-hidden relative group cursor-pointer hover:border-roxy-red transition-all">
                      {newProduct.image ? (
                        <>
                          <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <Upload className="w-10 h-10 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4 p-10">
                          <Plus className="w-12 h-12 text-white/5 group-hover:text-roxy-red transition-colors" />
                          <p className="text-[10px] font-black text-white/20 uppercase text-center leading-tight tracking-[0.2em]">Upload <br/>Preview</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6">
                    <button 
                      type="submit"
                      className="w-full py-6 bg-roxy-red hover:bg-white hover:text-roxy-red text-white rounded-xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-roxy-red/30 transition-all active:scale-95"
                    >
                      PUSH TO DISPLAY
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Contact */}
      <footer className="mt-24 border-t border-roxy-gray py-16 px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">ROXY CELL <span className="text-roxy-red">TANGGUL</span></h2>
            <div className="w-1.5 h-1.5 rounded-full bg-roxy-red"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">EST. 2024</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-roxy-red italic">Official Line</p>
              <p className="text-sm font-black text-white">+62 813-5706-6070</p>
            </div>
            <div className="w-12 h-12 bg-roxy-gray/20 rounded-xl flex items-center justify-center border border-roxy-gray">
              <Phone className="w-5 h-5 text-roxy-red" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
