
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Shirt, 
  Plus, 
  ChevronRight,
  LogOut,
  User,
  Bell,
  Trash2,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  CloudUpload,
  Cloud
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Dress } from './types';
import SelectionManager from './views/SelectionManager';
import Dashboard from './views/Dashboard';
import { Button, Input, Card } from './components';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeView, setActiveView] = useState<'dashboard' | 'manager'>('dashboard');
  const [selectedDressId, setSelectedDressId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dresses, setDresses] = useState<Dress[]>([]);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setIsLoaded(true);
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`Auth Event: ${event}`);
      setSession(currentSession);
      
      if (!currentSession) {
        // Absolute cleanup on sign-out
        setDresses([]);
        setSelectedDressId(null);
        setActiveView('dashboard');
        setLoginError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchDresses();
    }
  }, [session]);

  const fetchDresses = async () => {
    if (!session) return;
    
    setIsSyncing(true);
    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching dresses:', error);
    } else if (data && data.length > 0) {
      const fetchedDresses: Dress[] = data.map(row => ({
        ...row.content,
        id: row.id
      }));
      setDresses(fetchedDresses);
    } else {
      // Create a default dress if none exist for the new user
      const defaultDress: Partial<Dress> = {
        code: 'FL-TOP-01',
        name: 'FirstLove Summer Top',
        category: 'Sleeveless Crop Top',
        fabrication: '22-01',
        isChecked: true,
        config: {
          sizes: ['FREE', 'M', 'XL'],
          colors: ['White', 'Navy'],
          fabrics: [
            { id: 1, type: 'Shell', code: 'C-POP-01', color: 'White', price: 4500, colorMode: 'Matched' },
            { id: 2, type: 'Accessories', code: 'BTN-01', color: 'Silver', price: 500, colorMode: 'Fixed' }
          ]
        },
        orders: { 'FREE': { 'White': 100, 'Navy': 50 }, 'M': { 'White': 20 }, 'XL': { 'White': 10 } },
        consumption: { 1: { 'FREE': 1.2, 'M': 1.4, 'XL': 1.6 } },
        costs: { fixedSalary: 500000, profitTargetPct: 35, marketingPct: 8, wastagePct: 3, opsPct: 5, sewingCost: 4000, accessoriesCost: 500 },
        salesPrices: { 'FREE': { retail: 28000, ws: 21000, flash: 19000 } }
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('dresses')
        .insert([{ content: defaultDress, user_id: session.user.id }])
        .select();
      
      if (inserted) {
        setDresses([{ ...defaultDress, id: inserted[0].id } as Dress]);
      }
    }
    setIsSyncing(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        setLoginError(error.message);
      } else {
        setLoginForm({ email: '', password: '' });
      }
    } catch (err) {
      setLoginError("An unexpected error occurred during sign in.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Confirm system logout?")) {
      try {
        // 1. Immediate local UI reset for responsiveness
        setSession(null);
        setDresses([]);
        setSelectedDressId(null);
        setActiveView('dashboard');
        setLoginForm({ email: '', password: '' });
        setLoginError('');

        // 2. Perform the actual Supabase sign-out
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Sign out error:", error);
        // We still consider ourselves logged out locally
        setSession(null);
      }
    }
  };

  const updateDress = async (id: number, field: string | object, value?: any) => {
    let updatedDress: Dress | undefined;

    setDresses(prevDresses => {
      const next = prevDresses.map(d => {
        if (d.id !== id) return d;
        let newD;
        if (typeof field === 'object' && field !== null) {
          newD = { ...d, ...field };
        } else {
          newD = { ...d, [field as string]: value };
        }
        updatedDress = newD;
        return newD;
      });
      return next;
    });

    if (updatedDress) {
      setIsSaving(true);
      const { error } = await supabase
        .from('dresses')
        .update({ content: updatedDress })
        .eq('id', id);
      
      if (error) console.error('Sync error:', error);
      setIsSaving(false);
    }
  };

  const handleAddDress = async () => {
    if (!session) return;
    setIsSyncing(true);
    const newDressBase: Partial<Dress> = {
      code: `CODE-${Date.now().toString().slice(-4)}`,
      name: 'New Product Line',
      category: 'Top',
      fabrication: 'TBD',
      isChecked: true,
      config: { sizes: ['FREE'], colors: ['White'], fabrics: [] },
      orders: {},
      consumption: {},
      costs: { fixedSalary: 0, profitTargetPct: 30, marketingPct: 5, wastagePct: 2, opsPct: 5, sewingCost: 0, accessoriesCost: 0 },
      salesPrices: {}
    };

    const { data, error } = await supabase
      .from('dresses')
      .insert([{ content: newDressBase, user_id: session.user.id }])
      .select();

    if (error) {
      console.error('Error creating dress:', error);
    } else if (data) {
      const created: Dress = { ...newDressBase, id: data[0].id } as Dress;
      setDresses(prev => [...prev, created]);
      setSelectedDressId(created.id);
      setActiveView('manager');
    }
    setIsSyncing(false);
  };

  const deleteDress = async (id: number) => {
    if (window.confirm("Delete production line? This cannot be undone.")) {
      setIsSyncing(true);
      const { error } = await supabase
        .from('dresses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting dress:', error);
      } else {
        setActiveView('dashboard');
        setSelectedDressId(null);
        setDresses(prev => prev.filter(d => d.id !== id));
      }
      setIsSyncing(false);
    }
  };

  const selectedDress = dresses.find(d => d.id === selectedDressId);

  if (!isLoaded) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic animate-pulse">M9 ECOSYSTEM...</div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden font-inter">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full"></div>

        <div className="w-full max-w-md animate-fadeIn z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl mb-6 transform hover:rotate-6 transition-transform">
              <span className="text-white text-3xl font-black italic tracking-tighter">M9</span>
            </div>
            <h1 className="text-white text-2xl font-black uppercase tracking-[0.3em] text-center">Money Maker Planner</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Financial Ecosystem v2.0</p>
          </div>

          <Card className="p-8 bg-white/5 backdrop-blur-xl border-white/10" accentColor="cyan">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} className="text-cyan-400" /> Email Address
                </label>
                <input 
                  type="email"
                  required
                  placeholder="name@m9production.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={12} className="text-fuchsia-400" /> Password
                </label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all placeholder:text-slate-600"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest text-center animate-fadeIn">
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </Card>
          
          <p className="text-center mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Authorized Personnel Only • M9 Production Group
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-inter">
      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex-shrink-0 flex flex-col z-40 border-r border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
              <span className="text-white text-xl font-black italic tracking-tighter">M9</span>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest leading-none">ECOSYSTEM</h2>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1">Production Lead</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'dashboard' ? 'bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 text-cyan-400 border border-white/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={18} />
              Portfolio Dashboard
            </button>
            <button 
              onClick={() => {
                if (dresses.length > 0) {
                  setSelectedDressId(dresses[0].id);
                  setActiveView('manager');
                } else {
                  handleAddDress();
                }
              }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'manager' ? 'bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 text-cyan-400 border border-white/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Shirt size={18} />
              Product Manager
            </button>
          </nav>

          <div className="mt-10 pt-10 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Production Lines</p>
              {isSyncing && <Loader2 size={10} className="text-cyan-400 animate-spin" />}
            </div>
            <div className="space-y-1 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
              {dresses.map(d => (
                <button 
                  key={d.id}
                  onClick={() => { setSelectedDressId(d.id); setActiveView('manager'); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between group ${selectedDressId === d.id && activeView === 'manager' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <span className="truncate">{d.code}</span>
                  <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedDressId === d.id && activeView === 'manager' ? 'opacity-100' : ''}`} />
                </button>
              ))}
              <button 
                onClick={handleAddDress}
                disabled={isSyncing}
                className="w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 hover:bg-fuchsia-400/5 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={12} />
                New Line Item
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
               <User size={20} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[140px]">{session?.user?.email}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase">System Operator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
          >
            <LogOut size={14} />
            Logout Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen custom-scrollbar">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="md:hidden w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black italic">M9</span>
             </div>
             <h1 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">
               {activeView === 'dashboard' ? 'Global Portfolio Analysis' : 'Product Selection Manager'}
             </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                {isSaving ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <CloudUpload size={12} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Cloud size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cloud Ready</span>
                  </div>
                )}
             </div>
             <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden lg:block"></div>
             <Button onClick={handleAddDress} disabled={isSyncing} variant="primary" icon={Plus} className="h-9 px-4 text-[10px] uppercase tracking-widest font-black">
               New Production
             </Button>
          </div>
        </header>

        <div className="p-8">
          {activeView === 'dashboard' ? (
            <Dashboard dresses={dresses} onEditDress={(id) => { setSelectedDressId(id); setActiveView('manager'); }} />
          ) : (
            selectedDress && (
              <SelectionManager 
                dress={selectedDress} 
                updateDress={updateDress} 
                onBack={() => setActiveView('dashboard')} 
                onDelete={deleteDress}
                isSyncing={isSyncing}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
