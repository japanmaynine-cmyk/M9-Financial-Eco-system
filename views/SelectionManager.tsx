import React, { useState } from 'react';
import { 
  Settings, Scissors, DollarSign, PieChart, CheckCircle, 
  Trash2, Plus, RefreshCw, FileText, List, TrendingUp, Activity,
  ChevronDown, ChevronUp, Loader2, Target, BarChart3,
  CheckSquare, Square, ChevronRight, Tag
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line
} from 'recharts';
import { Dress } from '../types';
import { Card, Button, Input } from '../components';
import { calculateMetrics } from '../logic';

interface SelectionManagerProps {
  dress: Dress;
  updateDress: (id: number, field: string | object, value?: any) => void;
  onBack: () => void;
  onDelete: (id: number) => void;
  isSyncing?: boolean;
}

const SelectionManager: React.FC<SelectionManagerProps> = ({ dress, updateDress, onBack, onDelete, isSyncing = false }) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3>(0); 
  const [notification, setNotification] = useState<string | null>(null);
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);
  
  const metrics = calculateMetrics(dress);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const formatCurrency = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Tab 0 State
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newFabric, setNewFabric] = useState({ type: "", fab: "", price: "" });

  const addSize = () => {
    if(newSize && !dress.config.sizes.includes(newSize)) {
      updateDress(dress.id, 'config', {...dress.config, sizes: [...dress.config.sizes, newSize]});
      setNewSize("");
    }
  };

  const addColor = () => {
    if(newColor && !dress.config.colors.includes(newColor)) {
      updateDress(dress.id, 'config', {...dress.config, colors: [...dress.config.colors, newColor]});
      setNewColor("");
    }
  };

  const addFabric = () => {
    if(newFabric.fab && newFabric.type) {
      updateDress(dress.id, 'config', {
        ...dress.config, 
        fabrics: [...dress.config.fabrics, { 
          id: Date.now(), 
          type: newFabric.type,
          code: newFabric.fab,
          color: "N/A", 
          price: parseFloat(newFabric.price) || 0,
          colorMode: 'Matched'
        }]
      });
      setNewFabric({ type: "", fab: "", price: "" });
    }
  };

  const updateFabricMode = (id: number, mode: 'Matched' | 'Fixed') => {
    const updated = dress.config.fabrics.map(f => f.id === id ? { ...f, colorMode: mode } : f);
    updateDress(dress.id, 'config', { ...dress.config, fabrics: updated });
  };

  const updateFabricFixedColor = (id: number, color: string) => {
    const updated = dress.config.fabrics.map(f => f.id === id ? { ...f, fixedColor: color } : f);
    updateDress(dress.id, 'config', { ...dress.config, fabrics: updated });
  };

  const renderTab0 = () => (
    <div className="space-y-6 animate-fadeIn">
      <Card className="p-8" accentColor="slate">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Settings size={16}/> Section 1: Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Category" value={dress.category} onChange={(v) => updateDress(dress.id, 'category', v)} placeholder="e.g. Sleeveless Crop Top" />
          <Input label="Dress Name" value={dress.name} onChange={(v) => updateDress(dress.id, 'name', v)} />
          <Input label="Fabrication Code" value={dress.fabrication} onChange={(v) => updateDress(dress.id, 'fabrication', v)} placeholder="e.g. 22-01" />
        </div>
      </Card>

      <Card className="p-8" accentColor="indigo">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><List size={16}/> Section 2: Manage Sizes & Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest block">Product Sizes</label>
            <div className="flex gap-2 mb-4">
              <input className="flex-1 bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold" value={newSize} onChange={e => setNewSize(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSize()} placeholder="e.g. FREE" />
              <Button onClick={addSize} variant="secondary" icon={Plus}></Button>
            </div>
            <div className="flex flex-wrap gap-2">{dress.config.sizes.map(s => <span key={s} className="bg-white border px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2">{s} <Trash2 size={12} className="text-slate-300 hover:text-rose-500 cursor-pointer" onClick={() => updateDress(dress.id, 'config', {...dress.config, sizes: dress.config.sizes.filter(x => x !== s)})}/></span>)}</div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest block">Available Colors</label>
            <div className="flex gap-2 mb-4">
              <input className="flex-1 bg-slate-50 border rounded-xl px-4 py-2 text-sm font-bold" value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => e.key === 'Enter' && addColor()} placeholder="e.g. White" />
              <Button onClick={addColor} variant="secondary" icon={Plus}></Button>
            </div>
            <div className="flex flex-wrap gap-2">{dress.config.colors.map(c => <span key={c} className="bg-white border px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2">{c} <Trash2 size={12} className="text-slate-300 hover:text-rose-500 cursor-pointer" onClick={() => updateDress(dress.id, 'config', {...dress.config, colors: dress.config.colors.filter(x => x !== c)})}/></span>)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-8" accentColor="cyan">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Activity size={16}/> Section 3: Fabric Database</h3>
        <table className="w-full text-xs text-left mb-6">
          <thead className="bg-slate-50 text-slate-500 font-black uppercase">
            <tr>
              <th className="p-4 rounded-tl-xl">Type (Component)</th>
              <th className="p-4">Fabrication</th>
              <th className="p-4 text-right">Ref. Price (MMK)</th>
              <th className="p-4 text-center rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {dress.config.fabrics.map(f => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold">{f.type}</td>
                <td className="p-4 font-mono">{f.code}</td>
                <td className="p-4 text-right font-black">{f.price.toLocaleString()}</td>
                <td className="p-4 text-center">
                  <button onClick={() => updateDress(dress.id, 'config', {...dress.config, fabrics: dress.config.fabrics.filter(x => x.id !== f.id)})} className="text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-4 gap-3">
          <input className="border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Component" value={newFabric.type} onChange={e => setNewFabric({...newFabric, type: e.target.value})} />
          <input className="border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Fabrication" value={newFabric.fab} onChange={e => setNewFabric({...newFabric, fab: e.target.value})} />
          <input className="border rounded-xl px-3 py-2 text-xs text-right outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Price" value={newFabric.price} onChange={e => setNewFabric({...newFabric, price: e.target.value})} />
          <Button onClick={addFabric} variant="secondary" icon={Plus}>Add Fabric</Button>
        </div>
      </Card>
      <div className="flex justify-end"><Button onClick={() => setActiveTab(1)} icon={CheckCircle}>Go to Step 1</Button></div>
    </div>
  );

  const renderTab1 = () => {
    const colorTotals: Record<string, number> = {};
    dress.config.colors.forEach(c => {
      colorTotals[c] = dress.config.sizes.reduce((sum, s) => sum + (dress.orders[s]?.[c] || 0), 0);
    });
    const grandTotal = Object.values(colorTotals).reduce((a, b) => a + b, 0);

    return (
      <div className="space-y-6 animate-fadeIn">
        <Card className="p-8" accentColor="cyan">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><TrendingUp size={16}/> Production Order Matrix</h3>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 font-black uppercase text-slate-500">
                <tr>
                  <th className="p-4 border-r">Size \ Color</th>
                  {dress.config.colors.map(c => <th key={c} className="p-4 text-center">{c}</th>)}
                  <th className="p-4 bg-slate-100 text-center">Size Total</th>
                </tr>
              </thead>
              <tbody>
                {dress.config.sizes.map(s => (
                  <tr key={s} className="border-t">
                    <td className="p-4 font-black border-r bg-slate-50/30 uppercase">{s}</td>
                    {dress.config.colors.map(c => (
                      <td key={c} className="p-0 border-r">
                        <input type="number" className="w-full h-full p-4 text-center font-black focus:bg-cyan-50 outline-none" value={dress.orders[s]?.[c] || 0} onChange={e => {
                          const next = {...dress.orders}; if(!next[s]) next[s] = {}; next[s][c] = parseInt(e.target.value) || 0;
                          updateDress(dress.id, 'orders', next);
                        }} />
                      </td>
                    ))}
                    <td className="p-4 text-center font-black bg-cyan-50/30 text-cyan-700">{dress.config.colors.reduce((a,c) => a + (dress.orders[s]?.[c] || 0), 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 font-black text-slate-700">
                <tr>
                  <td className="p-4 border-r uppercase text-[10px]">Color Total</td>
                  {dress.config.colors.map(c => (
                    <td key={c} className="p-4 text-center text-cyan-700">{colorTotals[c]}</td>
                  ))}
                  <td className="p-4 text-center bg-cyan-600 text-white text-lg tracking-tighter">{grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card className="p-8" accentColor="indigo">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Scissors size={16}/> Consumption Rate (Yards per Unit)</h3>
          <div className="space-y-6">
            {dress.config.fabrics.map(fab => (
              <div key={fab.id} className="bg-slate-50 p-6 rounded-2xl border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-slate-700">{fab.type}</span>
                    <span className="opacity-40 text-[10px] font-black uppercase tracking-widest">{fab.code}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-white border px-3 py-1.5 rounded-xl shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Col Mode:</span>
                      <select 
                        className="text-[10px] font-black text-indigo-600 outline-none bg-transparent cursor-pointer"
                        value={fab.colorMode}
                        onChange={(e) => updateFabricMode(fab.id, e.target.value as any)}
                      >
                        <option value="Matched">Matched (All Colors)</option>
                        <option value="Fixed">Fixed (Specific Color)</option>
                      </select>
                    </div>
                    {fab.colorMode === 'Fixed' && (
                      <div className="flex items-center gap-1 bg-white border px-3 py-1.5 rounded-xl shadow-sm animate-fadeIn">
                        <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Select:</span>
                        <select 
                          className="text-[10px] font-black text-rose-600 outline-none bg-transparent cursor-pointer"
                          value={fab.fixedColor || ""}
                          onChange={(e) => updateFabricFixedColor(fab.id, e.target.value)}
                        >
                          <option value="">Choose color...</option>
                          {dress.config.colors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dress.config.sizes.map(s => (
                    <div key={s}>
                      <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">{s} Cons</label>
                      <div className="relative">
                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500" value={dress.consumption[fab.id]?.[s] || 0} onChange={e => {
                          const next = {...dress.consumption}; if(!next[fab.id]) next[fab.id] = {}; next[fab.id][s] = parseFloat(e.target.value) || 0;
                          updateDress(dress.id, 'consumption', next);
                        }} />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-400">yds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 bg-[#0f172a] text-white" accentColor="emerald">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2"><FileText size={16}/> Consumption Report</h3>
            <Button onClick={() => showNotify("Data Regenerated")} variant="secondary" className="bg-white/10 text-white hover:bg-white/20" icon={RefreshCw}>Regenerate</Button>
          </div>
          <table className="w-full text-xs">
            <thead className="text-slate-400 font-black uppercase border-b border-white/10">
              <tr><th className="p-4 text-left">Target / SKUs</th><th className="p-4 text-left">Component</th><th className="p-4 text-right">Total Requirement</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dress.config.fabrics.map(fab => {
                let total = 0;
                dress.config.sizes.forEach(s => {
                  const q = dress.config.colors.reduce((acc,c) => acc + (dress.orders[s]?.[c] || 0), 0);
                  total += q * (dress.consumption[fab.id]?.[s] || 0);
                });
                return (
                  <tr key={fab.id}>
                    <td className="p-4 font-black uppercase">
                      {fab.colorMode === 'Fixed' ? (fab.fixedColor || 'FIXED') : 'MATCHED (ALL)'}
                    </td>
                    <td className="p-4 opacity-70">{fab.type} <span className="text-[9px] block opacity-50 font-mono">{fab.code}</span></td>
                    <td className="p-4 text-right font-black text-emerald-400 text-lg">{total.toFixed(2)} yds</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div className="flex justify-between items-center">
          <Button onClick={() => setActiveTab(0)} variant="secondary">Previous Step</Button>
          <Button onClick={() => setActiveTab(2)} icon={CheckCircle}>Go to Step 2</Button>
        </div>
      </div>
    );
  };

  const renderTab2 = () => {
    // Logic for summary calculations (TFoot)
    const totalFabricBaseCost = metrics.sizeMetrics.reduce((sum, m) => 
      sum + m.fabricRows.reduce((fSum, fSumVal, frIndex) => {
        const fr = m.fabricRows[frIndex];
        return fSum + (fr.unitCost * m.qty);
      }, 0), 0
    );
    const totalSewingAccCost = metrics.sizeMetrics.reduce((sum, m) => sum + m.sewingRowCost + m.accRowCost, 0);
    const totalWastageCost = metrics.sizeMetrics.reduce((sum, m) => 
      sum + m.fabricRows.reduce((fSum, fSumVal, frIndex) => {
        const fr = m.fabricRows[frIndex];
        return fSum + (fr.wastageAmt * m.qty);
      }, 0), 0
    );

    return (
      <div className="space-y-6 animate-fadeIn pb-10">
        <Card className="p-0 overflow-hidden sticky top-20 z-10 shadow-lg border-fuchsia-400" accentColor="fuchsia">
          <div 
            className="bg-slate-50 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-fuchsia-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-700">Global Cost Configuration</span>
            </div>
            <div className="flex items-center gap-4">
               <Button onClick={(e) => { e.stopPropagation(); showNotify("Data Regenerated"); }} icon={RefreshCw} variant="primary" className="h-8 py-0 px-3 text-[10px]">Regenerate</Button>
               {isConfigExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {isConfigExpanded && (
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 bg-white border-t">
              <Input label="Fixed Cost" value={dress.costs.fixedSalary} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, fixedSalary: v})} />
              <Input label="Sewing Cost" value={dress.costs.sewingCost} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, sewingCost: v})} />
              <Input label="Accessories" value={dress.costs.accessoriesCost} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, accessoriesCost: v})} />
              <Input label="Wastage %" value={dress.costs.wastagePct} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, wastagePct: v})} suffix="%" />
              <Input label="Marketing %" value={dress.costs.marketingPct} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, marketingPct: v})} suffix="%" />
              <Input label="Trans & Ops %" value={dress.costs.opsPct} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, opsPct: v})} suffix="%" />
              <Input label="Profit Target %" value={dress.costs.profitTargetPct} onChange={v => updateDress(dress.id, 'costs', {...dress.costs, profitTargetPct: v})} suffix="%" />
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden" accentColor="blue">
           <div className="p-6 bg-white border-b flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                <DollarSign size={18} className="text-blue-500"/> Investment Breakdown Result
              </h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter">
                  <tr className="border-b">
                    <th className="p-4 border-b border-slate-200 font-bold text-left pl-6">Composition</th>
                    <th className="p-4 border-b border-slate-200">Size</th>
                    <th className="p-4 border-b border-slate-200 text-center">Fab Qty (Yds)</th>
                    <th className="p-4 border-b border-slate-200 text-right">Ref Price</th>
                    <th className="p-4 border-b border-slate-200 text-right">Unit Cost</th>
                    <th className="p-4 border-b border-slate-200 text-center">Prod Qty</th>
                    <th className="p-4 border-b border-slate-200 text-right pr-6">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                   {metrics.sizeMetrics.map((m) => {
                     const sizeCodTotal = (m.fabricRows.reduce((acc, fr) => acc + fr.unitCost, 0) + dress.costs.sewingCost + dress.costs.accessoriesCost) * m.qty;
                     
                     return (
                       <React.Fragment key={m.size}>
                         {m.fabricRows.map((fr) => (
                           <tr key={fr.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 pl-6 font-medium text-slate-700">{fr.type} ({fr.code})</td>
                              <td className="p-4 uppercase font-bold text-slate-400">{m.size}</td>
                              <td className="p-4 text-center font-mono">{fr.consRate.toFixed(2)}</td>
                              <td className="p-4 text-right font-medium">{formatCurrency(fr.refPrice)}</td>
                              <td className="p-4 text-right font-medium">{formatCurrency(fr.unitCost)}</td>
                              <td className="p-4 text-center font-black">{m.qty}</td>
                              <td className="p-4 text-right font-black text-slate-900 pr-6">{formatCurrency(fr.unitCost * m.qty)}</td>
                           </tr>
                         ))}
                         <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-medium text-slate-700">Sewing Cost</td>
                            <td className="p-4 uppercase font-bold text-slate-400">{m.size}</td>
                            <td className="p-4 text-center text-slate-300">-</td>
                            <td className="p-4 text-right text-slate-300">-</td>
                            <td className="p-4 text-right font-medium">{formatCurrency(dress.costs.sewingCost)}</td>
                            <td className="p-4 text-center font-black">{m.qty}</td>
                            <td className="p-4 text-right font-black text-slate-900 pr-6">{formatCurrency(m.sewingRowCost)}</td>
                         </tr>
                         <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-medium text-slate-700">Accessories</td>
                            <td className="p-4 uppercase font-bold text-slate-400">{m.size}</td>
                            <td className="p-4 text-center text-slate-300">-</td>
                            <td className="p-4 text-right text-slate-300">-</td>
                            <td className="p-4 text-right font-medium">{formatCurrency(dress.costs.accessoriesCost)}</td>
                            <td className="p-4 text-center font-black">{m.qty}</td>
                            <td className="p-4 text-right font-black text-slate-900 pr-6">{formatCurrency(m.accRowCost)}</td>
                         </tr>
                         <tr className="bg-slate-50 font-black border-t-2 border-slate-200">
                           <td colSpan={6} className="p-4 text-right text-slate-500 uppercase italic text-[9px] tracking-widest">
                             Total Size Cost CODs:
                           </td>
                           <td className="p-4 text-right text-indigo-600 font-black pr-6 text-xs">
                             {formatCurrency(sizeCodTotal)}
                           </td>
                         </tr>
                       </React.Fragment>
                     );
                   })}
                </tbody>
                <tfoot className="bg-white border-t-4 border-slate-900">
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <td colSpan={6} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Total Cost CODs (Fabrics + Sewing + Acc):</td>
                    <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(totalFabricBaseCost + totalSewingAccCost)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <td colSpan={6} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Total Wastage Cost ({dress.costs.wastagePct}%):</td>
                    <td className="p-3 text-right font-black text-rose-500 pr-6">{formatCurrency(totalWastageCost)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Marketing Cost ({dress.costs.marketingPct}%):</td>
                    <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalMarketingCost)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Trans. & Ops. Overhead ({dress.costs.opsPct}%):</td>
                    <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalOpsCost)}</td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={6} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Total Variable Investment:</td>
                    <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalVariableInvestment)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Overhead Fixed Cost:</td>
                    <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalFixedCost)}</td>
                  </tr>
                  <tr className="bg-slate-900 text-white border-t-2 border-indigo-500">
                    <td colSpan={6} className="p-6 text-right uppercase font-black text-xs tracking-[0.2em] italic">TOTAL PROJECT INVESTMENT:</td>
                    <td className="p-6 text-right font-black text-blue-400 pr-6 text-2xl tracking-tighter">
                       {formatCurrency(metrics.totalInvestment)} MMK
                    </td>
                  </tr>
                </tfoot>
             </table>
           </div>
        </Card>

        {/* Sales result table */}
        <Card className="p-0 overflow-hidden" accentColor="emerald">
          <div className="p-6 bg-white border-b flex items-center justify-between">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
              <PieChart size={18} className="text-emerald-500"/> Sales & Profitability Result
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter">
                <tr className="border-b">
                  <th className="p-4 border-b border-slate-200 pl-6">Size</th>
                  <th className="p-4 border-b border-slate-200 text-right">Var Cost</th>
                  <th className="p-4 border-b border-slate-200 text-center">% Profit</th>
                  <th className="p-4 border-b border-slate-200 text-right">Profit Amt</th>
                  <th className="p-4 border-b border-slate-200 text-right">Sales Margin</th>
                  <th className="p-4 border-b border-slate-200 text-right">Retail Price (Editable)</th>
                  <th className="p-4 border-b border-slate-200 text-center">Qty</th>
                  <th className="p-4 border-b border-slate-200 text-right pr-6">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {metrics.sizeMetrics.map(m => (
                  <tr key={m.size} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-black uppercase text-slate-700">{m.size}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(m.varUnitCost)}</td>
                    <td className="p-4 text-center font-bold text-slate-400">{dress.costs.profitTargetPct}%</td>
                    <td className="p-4 text-right font-bold text-green-600">{formatCurrency(m.profitAmt)}</td>
                    <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(m.calcPrice)}</td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border rounded-lg p-2 text-right font-black focus:ring-2 focus:ring-emerald-500 outline-none" 
                        value={m.retailPrice} 
                        onChange={e => {
                          const next = {...dress.salesPrices};
                          if (!next[m.size]) next[m.size] = { retail: 0, ws: 0 };
                          next[m.size].retail = parseFloat(e.target.value) || 0;
                          updateDress(dress.id, 'salesPrices', next);
                        }} 
                      />
                    </td>
                    <td className="p-4 text-center font-black">{m.qty}</td>
                    <td className="p-4 text-right pr-6 font-black text-slate-900">{formatCurrency(m.totalSales)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white">
                <tr className="font-black">
                  <td colSpan={7} className="p-6 text-right uppercase text-xs tracking-[0.2em] italic">Total Portfolio Revenue:</td>
                  <td className="p-6 text-right text-emerald-400 pr-6 text-2xl tracking-tighter">
                    {formatCurrency(metrics.totalRevenue)} <span className="text-[10px] uppercase opacity-40">MMK</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="flex justify-between items-center">
          <Button onClick={() => setActiveTab(1)} variant="secondary">Back to Consumption</Button>
          <Button onClick={() => setActiveTab(3)} icon={CheckCircle}>Go to Tab 3</Button>
        </div>
      </div>
    );
  };

  const renderTab3 = () => {
    // Break-Even Metrics for the Product
    const fc = metrics.totalFixedCost;
    const v = metrics.avgVarCost;
    const p = metrics.avgPrice;
    const contributionMargin = p - v;
    const beu = contributionMargin > 0 ? Math.ceil(fc / contributionMargin) : 0;
    const ber = beu * p;
    const safetyMargin = metrics.totalRevenue > 0 ? ((metrics.totalRevenue - ber) / metrics.totalRevenue) * 100 : 0;

    const chartData = [
      { name: 'This Product', investment: metrics.totalInvestment, revenue: metrics.totalRevenue, bepLevel: ber }
    ];

    // Functional Calculation Helper
    const calcPriceData = (price: number, cog: number) => {
      const marginVal = price - cog;
      const marginPct = price > 0 ? (marginVal / price) * 100 : 0;
      return { marginVal, marginPct };
    };

    return (
      <div className="space-y-8 animate-fadeIn pb-10">
        {/* NEW SECTION: Sales Pricing Analysis Component */}
        <Card className="p-0 overflow-hidden" accentColor="indigo">
          <div className="p-6 bg-white border-b flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
              <Tag size={18} className="text-indigo-500" /> Sales Pricing Analysis
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Financial Modeling Unit
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse min-w-[900px]">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter">
                <tr className="border-b">
                  <th className="p-4 pl-6 border-r border-slate-200 w-16" rowSpan={2}>SIZE</th>
                  <th className="p-4 border-b border-r border-slate-200 text-center bg-indigo-50/50" colSpan={3}>RETAIL</th>
                  <th className="p-4 border-b border-r border-slate-200 text-center bg-cyan-50/50" colSpan={3}>WHOLESALE</th>
                  <th className="p-4 border-b text-center bg-amber-50/50" colSpan={3}>FLASH SALES/PROMO</th>
                </tr>
                <tr className="border-b text-[10px]">
                  {/* Retail Headers */}
                  <th className="p-2 border-r border-slate-100 text-center bg-indigo-50/30">Price</th>
                  <th className="p-2 border-r border-slate-100 text-center bg-indigo-50/30">Margin</th>
                  <th className="p-2 border-r border-slate-200 text-center bg-indigo-50/30">%</th>
                  {/* Wholesale Headers */}
                  <th className="p-2 border-r border-slate-100 text-center bg-cyan-50/30">Price</th>
                  <th className="p-2 border-r border-slate-100 text-center bg-cyan-50/30">Margin</th>
                  <th className="p-2 border-r border-slate-200 text-center bg-cyan-50/30">%</th>
                  {/* Flash Headers */}
                  <th className="p-2 border-r border-slate-100 text-center bg-amber-50/30">Price</th>
                  <th className="p-2 border-r border-slate-100 text-center bg-amber-50/30">Margin</th>
                  <th className="p-2 text-center bg-amber-50/30">%</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {metrics.sizeMetrics.map(m => {
                  const cog = m.varUnitCost;
                  const retailPrice = m.retailPrice;
                  const wsPrice = dress.salesPrices[m.size]?.ws || 0;
                  const flashPrice = dress.salesPrices[m.size]?.flash || 0;

                  const retail = calcPriceData(retailPrice, cog);
                  const ws = calcPriceData(wsPrice, cog);
                  const flash = calcPriceData(flashPrice, cog);

                  const getMarginColor = (val: number) => val < 0 ? 'text-red-500 font-black' : 'text-emerald-500 font-black';

                  return (
                    <tr key={m.size} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 border-r border-slate-200 font-black text-slate-800 bg-slate-50/20">{m.size}</td>
                      
                      {/* Retail Section (Read-Only) */}
                      <td className="p-2 text-center font-bold text-slate-700 border-r border-slate-100 bg-indigo-50/5">{formatCurrency(retailPrice)}</td>
                      <td className={`p-2 text-center border-r border-slate-100 bg-indigo-50/5 ${getMarginColor(retail.marginVal)}`}>{formatCurrency(retail.marginVal)}</td>
                      <td className={`p-2 text-center border-r border-slate-200 bg-indigo-50/5 ${getMarginColor(retail.marginVal)}`}>{retail.marginPct.toFixed(1)}%</td>

                      {/* Wholesale Section (Editable) */}
                      <td className="p-1 border-r border-slate-100 bg-cyan-50/5">
                        <input 
                          type="number" 
                          className="w-full h-8 text-center bg-white border border-slate-200 rounded-md font-black outline-none focus:ring-2 focus:ring-cyan-500" 
                          value={wsPrice} 
                          onChange={e => {
                            const next = {...dress.salesPrices};
                            if (!next[m.size]) next[m.size] = { retail: 0, ws: 0 };
                            next[m.size].ws = parseFloat(e.target.value) || 0;
                            updateDress(dress.id, 'salesPrices', next);
                          }} 
                        />
                      </td>
                      <td className={`p-2 text-center border-r border-slate-100 bg-cyan-50/5 ${getMarginColor(ws.marginVal)}`}>{formatCurrency(ws.marginVal)}</td>
                      <td className={`p-2 text-center border-r border-slate-200 bg-cyan-50/5 ${getMarginColor(ws.marginVal)}`}>{ws.marginPct.toFixed(1)}%</td>

                      {/* Flash Sales Section (Editable) */}
                      <td className="p-1 border-r border-slate-100 bg-amber-50/5">
                        <input 
                          type="number" 
                          className="w-full h-8 text-center bg-white border border-slate-200 rounded-md font-black outline-none focus:ring-2 focus:ring-amber-500" 
                          value={flashPrice} 
                          onChange={e => {
                            const next = {...dress.salesPrices};
                            if (!next[m.size]) next[m.size] = { retail: 0, ws: 0 };
                            next[m.size].flash = parseFloat(e.target.value) || 0;
                            updateDress(dress.id, 'salesPrices', next);
                          }} 
                        />
                      </td>
                      <td className={`p-2 text-center border-r border-slate-100 bg-amber-50/5 ${getMarginColor(flash.marginVal)}`}>{formatCurrency(flash.marginVal)}</td>
                      <td className={`p-2 text-center bg-amber-50/5 ${getMarginColor(flash.marginVal)}`}>{flash.marginPct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t flex items-center justify-center gap-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Formula: Margin = Price - CoG
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Margin % = (Margin / Price) × 100
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card className="p-0 overflow-hidden" accentColor="rose">
              <div className="bg-slate-50 p-5 border-b flex items-center gap-2">
                 <Target size={18} className="text-rose-500" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Break-Even Analysis Table</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Fixed Cost</span>
                    <span className="text-sm font-mono font-bold">{formatCurrency(fc)} MMK</span>
                 </div>
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Avg. Unit Variable Cost</span>
                    <span className="text-sm font-mono font-bold">{formatCurrency(v)} MMK</span>
                 </div>
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Avg. Sales Price (Retail)</span>
                    <span className="text-sm font-mono font-bold">{formatCurrency(p)} MMK</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-900 pb-2 bg-slate-50 px-2 py-1 rounded">
                    <span className="text-[10px] font-black uppercase text-slate-800 italic">Contribution Margin</span>
                    <span className="text-sm font-mono font-black text-indigo-600">{formatCurrency(contributionMargin)} MMK</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-black uppercase text-slate-700">BREAK-EVEN UNITS</span>
                    <span className="text-xl font-black text-rose-600 tracking-tighter">{beu} <span className="text-[10px] opacity-40">PCS</span></span>
                 </div>
                 <div className="flex justify-between items-center py-2 bg-rose-50 px-3 rounded-xl">
                    <span className="text-xs font-black uppercase text-rose-800">BREAK-EVEN REVENUE</span>
                    <span className="text-xl font-black text-rose-800 tracking-tighter">{formatCurrency(ber)} <span className="text-[10px] opacity-40 uppercase">MMK</span></span>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Safety Margin</span>
                    <span className={`text-sm font-black ${safetyMargin < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{safetyMargin.toFixed(1)}%</span>
                 </div>
              </div>
           </Card>

           <Card className="p-6" accentColor="slate">
              <div className="flex items-center gap-2 mb-6">
                 <BarChart3 size={18} className="text-slate-500" />
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Product Performance Visualization</h3>
              </div>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="name" hide />
                       <YAxis tick={{ fontSize: 10, fontWeight: 600 }} tickFormatter={(val) => (val / 1000).toFixed(0) + 'K'} axisLine={false} tickLine={false} />
                       <Tooltip 
                          formatter={(val: number) => formatCurrency(val) + ' MMK'}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                       />
                       <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                       <Bar dataKey="investment" name="Total Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={50} />
                       <Bar dataKey="revenue" name="Total Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50} />
                       <Line type="monotone" dataKey="bepLevel" name="Break-Even" stroke="#e11d48" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
                    </ComposedChart>
                 </ResponsiveContainer>
              </div>
              <p className="mt-4 text-[9px] text-center font-bold text-slate-400 uppercase italic">Goal: Push Green Bar (Revenue) significantly above Red Dash (Break-Even).</p>
           </Card>
        </div>

        <div className="flex justify-start"><Button onClick={() => setActiveTab(2)} variant="secondary">Back to Production Costs</Button></div>
      </div>
    );
  };

  return (
    <div className="relative">
      {notification && (
        <div className="fixed top-24 right-10 z-50 bg-[#0f172a] text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="text-emerald-400" size={18}/>
          <span className="text-xs font-black uppercase tracking-widest">{notification}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab(0)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 0 ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}>0. Information</button>
          <button onClick={() => setActiveTab(1)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 1 ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}>1. Consumption</button>
          <button onClick={() => setActiveTab(2)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 2 ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}>2. Costs</button>
          <button onClick={() => setActiveTab(3)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 3 ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}>3. Analysis</button>
        </div>
        <div className="flex gap-2">
          {isSyncing && <Loader2 size={20} className="text-indigo-500 animate-spin mr-2" />}
          <Button onClick={() => onDelete(dress.id)} variant="danger" icon={Trash2}>Delete Product</Button>
          <Button onClick={onBack} variant="secondary">Exit Manager</Button>
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeTab === 0 && renderTab0()}
        {activeTab === 1 && renderTab1()}
        {activeTab === 2 && renderTab2()}
        {activeTab === 3 && renderTab3()}
      </div>
    </div>
  );
};

export default SelectionManager;