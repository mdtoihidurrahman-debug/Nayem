/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Diamond, 
  History, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  ShoppingBag,
  CreditCard,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { SEED_BUNDLES } from './constants';
import { Bundle, Order, OrderStatus } from './types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function App() {
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [view, setView] = useState<'shop' | 'history' | 'admin'>('shop');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // For admin

  // Subscriptions
  useState(() => {
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));
    }
  });

  useState(() => {
    if (profile?.role === 'admin') {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        setAllOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));
    }
  });

  const handleOrder = async () => {
    if (!user || !selectedBundle || !playerId) return;
    setIsOrdering(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        playerId,
        bundleId: selectedBundle.id,
        amount: selectedBundle.price,
        status: 'pending',
        paymentMethod: 'bKash/Nagad (Manual)',
        createdAt: serverTimestamp(),
      });
      alert('Order placed! Please wait for manual verification.');
      setSelectedBundle(null);
      setPlayerId('');
      setView('history');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsOrdering(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Diamond className="text-orange-500 w-12 h-12" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('shop')}>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase italic">FireTop</span>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => setView('shop')}
              className={`transition-colors ${view === 'shop' ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
            >
              Shop
            </button>
            {user && (
              <button 
                onClick={() => setView('history')}
                className={`transition-colors ${view === 'history' ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
              >
                Orders
              </button>
            )}
            {profile?.role === 'admin' && (
              <button 
                onClick={() => setView('admin')}
                className={`flex items-center gap-1 transition-colors ${view === 'admin' ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
              >
                <ShieldCheck className="w-4 h-4" /> Admin
              </button>
            )}
            
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">Welcome,</p>
                  <p className="text-sm truncate max-w-[120px]">{user.displayName || user.email}</p>
                </div>
                <button onClick={logout} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-orange-500 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'shop' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero */}
              <div className="text-center space-y-4">
                <motion.h1 
                  className="text-6xl sm:text-8xl font-black uppercase italic tracking-tighter"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Level Up</span> Your Game
                </motion.h1>
                <p className="text-gray-400 max-w-xl mx-auto text-lg">
                  Instant diamond top-up for Free Fire. Fast, secure, and reliable service for players who want to stand out.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Bundle Grid */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                       <ShoppingBag className="text-orange-500" /> Select Bundle
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {SEED_BUNDLES.map((bundle, i) => (
                      <motion.button
                        key={bundle.id}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedBundle(bundle)}
                        className={`relative group p-6 rounded-2xl border transition-all ${
                          selectedBundle?.id === bundle.id 
                          ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20' 
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            {bundle.category === 'diamonds' ? <Diamond className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg">{bundle.name}</p>
                            <p className="text-orange-500 font-mono text-xl">{bundle.price} {bundle.currency}</p>
                          </div>
                        </div>
                        {selectedBundle?.id === bundle.id && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle2 className="w-5 h-5 text-orange-500 fill-black" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Checkout Section */}
                <div className="space-y-8 h-fit lg:sticky lg:top-28">
                  <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <CreditCard className="text-orange-500" /> Checkout
                    </h2>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Player ID</label>
                        <input 
                          type="text" 
                          placeholder="Enter FF Player ID"
                          value={playerId}
                          onChange={(e) => setPlayerId(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors font-mono tracking-widest"
                        />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center text-gray-400">
                          <span>Selected Bundle</span>
                          <span className="text-white font-medium">{selectedBundle?.name || 'None'}</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-bold">
                          <span>Total</span>
                          <span className="text-orange-500">{selectedBundle ? `${selectedBundle.price} ${selectedBundle.currency}` : '--'}</span>
                        </div>
                      </div>

                      <button 
                        disabled={!selectedBundle || !playerId || isOrdering || !user}
                        onClick={handleOrder}
                        className="w-full bg-orange-500 text-black py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-orange-400 disabled:opacity-50 disabled:grayscale transition-all text-lg"
                      >
                        {isOrdering ? 'Processing...' : (user ? 'Top Up Now' : 'Sign In to Order')}
                      </button>

                      {!user && (
                        <p className="text-center text-xs text-gray-500 italic">Sign in to complete your transaction</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Guide */}
                  <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                      <div className="text-sm space-y-1">
                        <p className="font-bold text-orange-500">Payment Notice</p>
                        <p className="text-gray-400 leading-relaxed">
                          We currently accept manual payments via <span className="text-white font-bold">bKash (017XXXXXXXX)</span> or <span className="text-white font-bold">Nagad</span>. Please mention your TID in the order.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">My Orders</h2>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg text-sm border border-white/10">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-400">Past Orders</span>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="py-24 text-center space-y-4 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-medium">No orders found yet. Start gaming!</p>
                  <button onClick={() => setView('shop')} className="text-orange-500 font-bold border-b border-orange-500">Browse Shop</button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-orange-500">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">{SEED_BUNDLES.find(b => b.id === order.bundleId)?.name || 'Diamond Bundle'}</p>
                          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">ID: {order.playerId}</p>
                        </div>
                      </div>
                      
                      <div className="text-center sm:text-right">
                        <p className="text-xl font-bold">{order.amount} BDT</p>
                        <p className="text-xs text-gray-500">{order.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</p>
                      </div>

                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                        'bg-orange-500/20 text-orange-500 animate-pulse'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'admin' && profile?.role === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Admin Dashboard</h2>
                  <p className="text-gray-500">Fulfilling game dreams one diamond at a time.</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-orange-500/10 border border-orange-500/20 px-6 py-4 rounded-2xl text-center">
                    <p className="text-xs text-orange-500/60 uppercase font-bold tracking-widest">Total Orders</p>
                    <p className="text-2xl font-black">{allOrders.length}</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-2xl text-center">
                    <p className="text-xs text-green-500/60 uppercase font-bold tracking-widest">Completed</p>
                    <p className="text-2xl font-black">{allOrders.filter(o => o.status === 'completed').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-gray-500 font-bold">
                      <th className="p-6">Order ID</th>
                      <th className="p-6">Player Info</th>
                      <th className="p-6 text-center">Amount</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/10 transition-colors">
                        <td className="p-6 align-top">
                          <p className="font-mono text-xs opacity-50">{order.id.slice(0, 12)}...</p>
                        </td>
                        <td className="p-6">
                          <p className="font-bold flex items-center gap-2">
                             <Gamepad2 className="w-4 h-4 text-orange-500" /> {order.playerId}
                          </p>
                          <p className="text-xs text-gray-500">{SEED_BUNDLES.find(b => b.id === order.bundleId)?.name}</p>
                        </td>
                        <td className="p-6 text-center">
                          <span className="font-bold text-lg">{order.amount} BDT</span>
                        </td>
                        <td className="p-6">
                          {order.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <span className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${
                                order.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Stats / Features Footer */}
      <footer className="border-t border-white/10 py-12 mt-12 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Gamepad2 className="w-5 h-5 text-orange-500" />
               <span className="font-bold uppercase tracking-widest italic">FireTop</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Premium diamond top-up service specializing in Free Fire. Bringing you the best deals and fastest delivery.
            </p>
          </div>
          <div className="flex items-center gap-4 p-6 bg-black rounded-2xl">
             <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
               <TrendingUp className="w-6 h-6" />
             </div>
             <div>
               <p className="font-bold">Fast Delivery</p>
               <p className="text-xs text-gray-500">Under 15 minutes</p>
             </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-black rounded-2xl">
             <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <p className="font-bold">100% Secure</p>
               <p className="text-xs text-gray-500">Safe and Verified</p>
             </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-black rounded-2xl">
             <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
               <UserIcon className="w-6 h-6" />
             </div>
             <div>
               <p className="font-bold">24/7 Support</p>
               <p className="text-xs text-gray-500">Always here to help</p>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
