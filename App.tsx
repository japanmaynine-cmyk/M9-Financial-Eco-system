
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Shirt, 
  Plus, 
  ChevronRight,
  LogOut,
  User,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  CloudUpload,
  Cloud,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Dress } from './types';
import SelectionManager from './views/SelectionManager';
import Dashboard from './views/Dashboard';
import PortfolioHubView from './views/PortfolioHub';
import { Button, Card } from './components';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeView, setActiveView] = useState<'dashboard' | 'manager' | 'portfolio'>('dashboard');
  const [selectedDressId, setSelectedDressId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dresses, setDresses] = useState<Dress[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setIsLoaded(true);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
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
    try {
      const { data, error } = await supabase
        .from('dresses')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching dresses:', error);
      } else if (data) {
        setDresses(data.map(row => ({
          ...row.content,
          id: row.id
        })));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsSyncing(false);
    }
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
      setLoginError("An unexpected connection error occurred.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Confirm logout?")) {
      try {
        await supabase.auth.signOut();
        setSession(null);
      } catch (e) {
        setSession(null);
      }
    }
  };

  const updateDress = async (id: number, field: string | object, value?: any) => {
    let updatedDress: Dress | undefined;

    setDresses(prevDresses => {
      return prevDresses.map(d => {
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
    });

    if (updatedDress) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('dresses')
          .update({ content: updatedDress })
          .eq('id', id);
        if (error) console.error('Supabase sync error:', error);
      } catch (e) {
        console.error('Supabase update error:', e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddDress = async () => {
    if (!session || isSyncing) return;
    setIsSyncing(true);
    
    const newDressBase: Partial<Dress> = {
      code: `M9-${Date.now().toString().slice(-4)}`,
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

    try {
      const { data, error } = await supabase
        .from('dresses')
        .insert([{ 
          content: newDressBase,
          user_id: session.user.id 
        }])
        .select();

      if (error) {
        console.error('Error creating dress:', error);
      } else if (data && data.length > 0) {
        const created: Dress = { ...newDressBase, id: data[0].id } as Dress;
        setDresses(prev => [...prev, created]);
        setSelectedDressId(created.id);
        setActiveView('manager');
      }
    } catch (err) {
      console.error('Add product error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDress = async (id: number) => {
    if (window.confirm("Permanently delete this production line?")) {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('dresses')
          .delete()
          .eq('id', id);

        if (!error) {
          setDresses(prev => prev.filter(d => d.id !== id));
          if (selectedDressId === id) {
            setActiveView('dashboard');
            setSelectedDressId(null);
          }
        }
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const selectedDress = dresses.find(d => d.id === selectedDressId);

  if (!isLoaded) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic tracking-widest animate-pulse uppercase">Initializing M9 Secure Core...</div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden font-inter">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-fuchsia-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full"></div>

        <div className="w-full max-w-md animate-fadeIn z-10">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(192,38,211,0.3)] mb-8 transform hover:scale-110 hover:rotate-6 transition-all duration-500">
              <span className="text-white text-4xl font-black italic tracking-tighter">M9</span>
            </div>
            <h1 className="text-white text-3xl font-black uppercase tracking-[0.4em] text-center mb-2">Money Maker</h1>
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em]">Financial Ledger Ecosystem</p>
          </div>

          <Card className="p-8 bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl space-y-8" accentColor="cyan">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} className="text-cyan-400" /> Admin Email
                </label>
                <input 
                  type="email"
                  required
                  placeholder="admin@m9.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-700 text-sm"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={12} className="text-fuchsia-400" /> Access Key
                </label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all placeholder:text-slate-700 text-sm"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>

              {loginError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 animate-fadeIn">
                  <AlertCircle size={14} />
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white font-black uppercase tracking-[0.3em] py-4 rounded-2xl shadow-[0_10px_30px_rgba(8,145,178,0.3)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 text-[11px]"
              >
                {isAuthenticating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Initialize Core
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </Card>
          
          <div className="flex items-center justify-center gap-6 mt-12 opacity-30">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Global v2.6</span>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
              <Globe size={10} /> Cloud Sync
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-inter">
      <aside className="w-full md:w-72 bg-[#0f172a] text-white flex-shrink-0 flex flex-col z-40 border-r border-white/5 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white text-2xl font-black italic tracking-tighter">M9</span>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest leading-none">ECOSYSTEM</h2>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] mt-2">Financials</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'dashboard' ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-white/10 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={20} />
              Financial Hub
            </button>
            <button 
              onClick={() => setActiveView('portfolio')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'portfolio' ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-white/10 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <CloudUpload size={20} />
              Portfolio Ledger
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
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'manager' ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-white/10 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Shirt size={20} />
              Product Editor
            </button>
          </nav>

          <div className="mt-12 pt-10 border-t border-white/10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Lines</p>
              {isSyncing && <Loader2 size={12} className="text-cyan-400 animate-spin" />}
            </div>
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto custom-scrollbar pr-3">
              {dresses.map(d => (
                <button 
                  key={d.id}
                  onClick={() => { setSelectedDressId(d.id); setActiveView('manager'); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between group ${selectedDressId === d.id && activeView === 'manager' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                  <span className="truncate">{d.name || d.code}</span>
                  <ChevronRight size={14} className={`transition-all ${selectedDressId === d.id && activeView === 'manager' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              ))}
              <button 
                onClick={handleAddDress}
                disabled={isSyncing}
                className="w-full flex items-center gap-3 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-fuchsia-400 hover:bg-fuchsia-400/10 rounded-xl transition-all border border-dashed border-fuchsia-400/20 mt-4 group"
              >
                <div className="p-1 rounded-md bg-fuchsia-400/10 group-hover:bg-fuchsia-400/20">
                  <Plus size={14} />
                </div>
                New Line Item
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/10 bg-black/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
               {session?.user?.user_metadata?.avatar_url ? (
                 <img src={session.user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <User size={20} className="text-slate-400" />
               )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-white uppercase tracking-wider truncate">{session?.user?.email}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active Account</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all duration-300"
          >
            <LogOut size={16} />
            Kill Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen custom-scrollbar flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
             <div className="flex flex-col">
               <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Command Control</h1>
               <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                 {activeView === 'dashboard' ? 'Portfolio Performance' : activeView === 'portfolio' ? 'Strategic Ledger' : 'Production Editor'}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                {isSaving ? (
                  <div className="flex items-center gap-3 animate-pulse">
                    <CloudUpload size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Saving Cloud</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Cloud size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synced Secure</span>
                  </div>
                )}
             </div>
             <Button onClick={handleAddDress} disabled={isSyncing} variant="primary" className="h-11 px-6 text-[10px] uppercase tracking-[0.2em] font-black shadow-xl">
               <Plus size={18} className="mr-2" />
               New Production
             </Button>
          </div>
        </header>

        <div className="p-10 flex-1">
          {activeView === 'dashboard' && (
            <Dashboard dresses={dresses} onEditDress={(id) => { setSelectedDressId(id); setActiveView('manager'); }} />
          )}
          {activeView === 'portfolio' && (
            <PortfolioHubView />
          )}
          {activeView === 'manager' && selectedDress && (
            <SelectionManager 
              dress={selectedDress} 
              updateDress={updateDress} 
              onBack={() => setActiveView('dashboard')} 
              onDelete={deleteDress}
              isSyncing={isSyncing}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
