
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Shirt, 
  Plus, 
  ChevronRight,
  LogOut,
  User,
  Bell,
  Trash2
} from 'lucide-react';
import { Dress } from './types';
import SelectionManager from './views/SelectionManager';
import Dashboard from './views/Dashboard';

const STORAGE_KEY = 'm9_planner_data_v2';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'manager'>('dashboard');
  const [selectedDressId, setSelectedDressId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dresses, setDresses] = useState<Dress[]>([]);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setDresses(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    } else {
      setDresses([
        {
          id: 1,
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
        }
      ]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dresses));
    }
  }, [dresses, isLoaded]);

  const updateDress = (id: number, field: string | object, value?: any) => {
    setDresses(prevDresses => prevDresses.map(d => {
      if (d.id !== id) return d;
      if (typeof field === 'object' && field !== null) {
        return { ...d, ...field };
      }
      return { ...d, [field as string]: value };
    }));
  };

  const handleAddDress = () => {
    const newId = dresses.length > 0 ? Math.max(...dresses.map(d => d.id)) + 1 : 1;
    const newDress: Dress = {
      id: newId,
      code: `CODE-${newId}`,
      name: 'New Product',
      category: 'Top',
      fabrication: 'TBD',
      isChecked: true,
      config: { sizes: ['FREE'], colors: ['White'], fabrics: [] },
      orders: {},
      consumption: {},
      costs: { fixedSalary: 0, profitTargetPct: 30, marketingPct: 5, wastagePct: 2, opsPct: 5, sewingCost: 0, accessoriesCost: 0 },
      salesPrices: {}
    };
    setDresses([...dresses, newDress]);
    setSelectedDressId(newId);
    setActiveView('manager');
  };

  const deleteDress = (id: number) => {
    if (window.confirm("Delete production line?")) {
      setDresses(prev => prev.filter(d => d.id !== id));
      if (selectedDressId === id) {
        setSelectedDressId(null);
        setActiveView('dashboard');
      }
    }
  };

  const selectedDress = dresses.find(d => d.id === selectedDressId);

  if (!isLoaded) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic">M9 ECOSYSTEM...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <aside className="w-20 md:w-64 bg-[#0f172a] text-white flex-shrink-0 flex flex-col shadow-xl z-20 sticky top-0 h-screen">
        <div className="p-4 md:p-6 font-bold text-xl flex items-center gap-3 border-b border-slate-800 h-20">
          <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-black italic">M9</span>
          </div>
          <span className="hidden md:inline font-black tracking-tight uppercase text-xs">Financial Ecosystem</span>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <div className="px-3 mt-8 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">Selection Manager</div>
          {dresses.map(dress => (
            <div key={dress.id} className="flex items-center gap-1 group px-1">
              <button
                onClick={() => { setSelectedDressId(dress.id); setActiveView('manager'); }}
                className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeView === 'manager' && selectedDressId === dress.id ? 'bg-slate-800 border-l-2 border-cyan-400 text-white' : 'text-slate-400 hover:bg-slate-800/30'}`}
              >
                <Shirt size={18} />
                <div className="hidden md:flex flex-col items-start overflow-hidden">
                  <span className="font-bold text-xs truncate w-full uppercase">{dress.code}</span>
                  <span className="text-[10px] opacity-40 truncate w-full uppercase">{dress.category}</span>
                </div>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteDress(dress.id); }}
                className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Product"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button onClick={handleAddDress} className="w-full mt-6 flex items-center gap-2 px-4 py-3 text-cyan-400 hover:text-white border border-dashed border-cyan-400/30 rounded-xl transition-all">
            <Plus size={16} />
            <span className="hidden md:inline text-xs font-black uppercase tracking-wider">Add New Product</span>
          </button>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
            <span>M9</span> <ChevronRight size={14}/> <span>{activeView}</span>
            {activeView === 'manager' && selectedDress && <><ChevronRight size={14}/> <span className="text-slate-900">{selectedDress.code}</span></>}
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="text-slate-400"/>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block"><p className="text-xs font-black">Production Lead</p><p className="text-[10px] text-slate-400">manager@m9.studio</p></div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-200"><User size={20}/></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8"><div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' ? <Dashboard dresses={dresses} onEditDress={(id) => { setSelectedDressId(id); setActiveView('manager'); }} /> : (selectedDress && <SelectionManager dress={selectedDress} updateDress={updateDress} onBack={() => setActiveView('dashboard')} />)}
        </div></main>
      </div>
    </div>
  );
};

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      <Icon size={20} /><span className="hidden md:inline font-black text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  );
}

export default App;
