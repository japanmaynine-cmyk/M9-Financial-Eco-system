
import React, { useState } from 'react';
import { 
  Settings, Scissors, DollarSign, PieChart, CheckCircle, 
  Trash2, Plus, Download, RefreshCw, FileText, List, TrendingUp, Activity,
  ChevronRight, AlertCircle, ChevronDown, ChevronUp, CheckSquare, Square,
  Loader2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Dress, Fabric } from '../types';
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

  const toggleSelection = () => {
    const newState = dress.isChecked === false ? true : false;
    updateDress(dress.id, 'isChecked', newState);
    showNotify(newState ? "Product included in Dashboard" : "Product excluded from Dashboard");
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
          <tbody className="divide-y">
            {dress.config.fabrics.map(f => (
              <tr key={f.id}>
                <td className="p-4 font-bold">{f.type}</td>
                <td className="p-4 font-mono">{f.code}</td>
                <td className="p-4 text-right font-black">{f.price.toLocaleString()}</td>
                <td className="p-4 text-center"><button onClick={() => updateDress(dress.id, 'config', {...dress.config, fabrics: dress.config.fabrics.filter(x => x.id !== f.id)})} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-4 gap-3">
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Component" value={newFabric.type} onChange={e => setNewFabric({...newFabric, type: e.target.value})} />
          <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Fabrication" value={newFabric.fab} onChange={e => setNewFabric({...newFabric, fab: e.target.value})} />
          <input className="border rounded-xl px-3 py-2 text-xs text-right" placeholder="Price" value={newFabric.price} onChange={e => setNewFabric({...newFabric, price: e.target.value})} />
          <Button onClick={addFabric} variant="secondary" icon={Plus}>Add Fabric</Button>
        </div>
      </Card>
      <div className="flex justify-end"><Button onClick={() => setActiveTab(1)} icon={CheckCircle}>Validate & Go to Step 1</Button></div>
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
          <Button onClick={() => setActiveTab(2)} icon={CheckCircle}>Validate & Go to Step 2</Button>
        </div>
      </div>
    );
  };

  const renderTab2 = () => (
    <div className="space-y-6 animate-fadeIn">
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
          <span className="text-[10px] font-bold text-slate-400">Click "Regenerate" to update calculations</span>
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
                <th className="p-4 border-b border-slate-200 text-right">Wastage ({dress.costs.wastagePct}%)</th>
                <th className="p-4 border-b border-slate-200 text-center">Prod Qty</th>
                <th className="p-4 border-b border-slate-200 text-right pr-6">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.sizeMetrics.map((m) => (
                <React.Fragment key={m.size}>
                  {m.fabricRows.map((fr) => (
                    <tr key={fr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-medium text-slate-700">{fr.type} ({fr.code})</td>
                      <td className="p-4 uppercase font-bold text-slate-400">{m.size}</td>
                      <td className="p-4 text-center font-mono">{fr.consRate.toFixed(2)}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(fr.refPrice)}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(fr.unitCost)}</td>
                      <td className="p-4 text-right text-rose-500 font-bold">{formatCurrency(fr.wastageAmt)}</td>
                      <td className="p-4 text-center font-black">{m.qty}</td>
                      <td className="p-4 text-right font-black text-slate-900 pr-6">{formatCurrency(fr.totalRowCost)}</td>
                    </tr>
                  ))}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-700">Sewing Cost</td>
                    <td className="p-4 uppercase font-bold text-slate-400">{m.size}</td>
                    <td className="p-4 text-center text-slate-300">-</td>
                    <td className="p-4 text-right text-slate-300">-</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(dress.costs.sewingCost)}</td>
                    <td className="p-4 text-right text-slate-300">-</td>
                    <td className="p-4 text-center font-black">{m.qty}</td>
                    <td className="p-4 text-right font-black text-slate-900 pr-6">{formatCurrency(m.sewingRowCost)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-700">Accessories</td>
                    <td className="p-4 uppercase font-bold text-slate-400">{m.size}</td>
                    <td className="p-4 text-center text-slate-300">-</td>
                    <td className="p-4 text-right text-slate-300">-</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(dress.costs.accessoriesCost)}</td>
                    <td className="p-4 text-right text-slate-300">-</td>
                    <td className="p-4 text-center font-black">{m.qty}</td>
                    <td className="p-4 text-right font-black text-slate-900 pr-6">{formatCurrency(m.accRowCost)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-black border-t-2 border-slate-200">
                    <td colSpan={7} className="p-4 text-right text-slate-500 uppercase italic text-[9px] tracking-widest">
                      Subtotal + Wastage ({dress.costs.wastagePct}%) + Marketing ({dress.costs.marketingPct}%) + Trans. & Ops. ({dress.costs.opsPct}%) = Total Unit Investment:
                    </td>
                    <td className="p-4 text-right text-indigo-600 font-black pr-6 text-xs">
                      {formatCurrency(m.batchInv)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-white border-t-4 border-slate-900">
              <tr>
                <td colSpan={7} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Marketing Cost ({dress.costs.marketingPct}%):</td>
                <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalMarketingCost)}</td>
              </tr>
              <tr>
                <td colSpan={7} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Trans. & Ops. Overhead ({dress.costs.opsPct}%):</td>
                <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalOpsCost)}</td>
              </tr>
              <tr>
                <td colSpan={7} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Total Variable Investment:</td>
                <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalVariableInvestment)}</td>
              </tr>
              <tr>
                <td colSpan={7} className="p-3 text-right text-slate-400 uppercase font-black text-[10px]">Overhead Fixed Cost:</td>
                <td className="p-3 text-right font-black text-slate-700 pr-6">{formatCurrency(metrics.totalFixedCost)}</td>
              </tr>
              <tr className="bg-slate-900 text-white border-t-2 border-indigo-500">
                <td colSpan={7} className="p-6 text-right uppercase font-black text-xs tracking-[0.2em] italic">TOTAL PROJECT INVESTMENT:</td>
                <td className="p-6 text-right font-black text-blue-400 pr-6 text-2xl tracking-tighter">
                   {formatCurrency(metrics.totalInvestment)} MMK
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden" accentColor="emerald">
        <div className="p-6 bg-white border-b">
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
                <th className="p-4 border-b border-slate-200 text-right">Calc Price</th>
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
                  <td className="p-4 text-right font-medium text-slate-400">{formatCurrency(m.calcPrice)}</td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border rounded-lg p-2 text-right font-black focus:ring-2 focus:ring-emerald-500 outline-none" 
                      value={m.retailPrice} 
                      onChange={e => updateDress(dress.id, 'salesPrices', {...dress.salesPrices, [m.size]: {...dress.salesPrices[m.size], retail: parseFloat(e.target.value)||0}})} 
                    />
                  </td>
                  <td className="p-4 text-center font-black">{m.qty}</td>
                  <td className="p-4 text-right font-black text-emerald-600 pr-6">{formatCurrency(m.totalSales)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-emerald-50 border-t-2 border-emerald-500">
               <tr>
                  <td colSpan={7} className="p-6 text-right uppercase font-black text-emerald-800 text-xs tracking-widest">TOTAL REVENUE:</td>
                  <td className="p-6 text-right font-black text-emerald-700 pr-6 text-2xl tracking-tighter">
                    {formatCurrency(metrics.totalRevenue)} MMK
                  </td>
               </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex justify-between items-center mt-10">
        <Button onClick={() => setActiveTab(1)} variant="secondary" icon={ChevronRight} className="rotate-180">Previous Step</Button>
        <Button onClick={() => setActiveTab(3)} icon={CheckCircle}>Confirm Production Plan</Button>
      </div>
    </div>
  );

  const renderTab3 = () => {
    const maxUnits = Math.max(metrics.totalQty * 1.5, metrics.bepUnits * 1.5, 50);
    const steps = 10;
    const chartData = Array.from({ length: steps + 1 }, (_, i) => {
      const units = Math.round((maxUnits / steps) * i);
      const totalVarCost = units * metrics.avgVarCost;
      const revenue = units * metrics.avgPrice;
      const totalCost = metrics.totalFixedCost + totalVarCost;
      return { units, revenue, totalCost, fixedCost: metrics.totalFixedCost };
    });

    return (
      <div className="space-y-6 animate-fadeIn">
        <Card className="p-6 overflow-hidden" accentColor="slate">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-slate-500"/> Sales Pricing
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
              <thead>
                <tr className="text-slate-500 uppercase font-black border-b border-slate-200">
                  <th className="p-3 w-20">SIZE</th>
                  <th colSpan={3} className="p-3 text-center border-l border-slate-200">RETAIL</th>
                  <th colSpan={3} className="p-3 text-center border-l border-slate-200">WHOLESALE</th>
                  <th colSpan={3} className="p-3 text-center border-l border-slate-200">FLASH SALES/PROMO</th>
                </tr>
                <tr className="text-slate-400 uppercase font-black text-[9px] border-b border-slate-100 bg-slate-50">
                  <th className="p-3"></th>
                  <th className="p-3 text-right border-l border-slate-200">Price</th>
                  <th className="p-3 text-right">Margin</th>
                  <th className="p-3 text-right">%</th>
                  <th className="p-3 text-right border-l border-slate-200">Price</th>
                  <th className="p-3 text-right">Margin</th>
                  <th className="p-3 text-right">%</th>
                  <th className="p-3 text-right border-l border-slate-200">Price</th>
                  <th className="p-3 text-right">Margin</th>
                  <th className="p-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {metrics.sizeMetrics.map(m => {
                  const cog = m.varUnitCost;
                  const calculateProfitability = (price: number) => {
                    const margin = price - cog;
                    const pct = price > 0 ? (margin / price) * 100 : 0;
                    return { margin, pct };
                  };
                  const retailRes = calculateProfitability(m.retailPrice);
                  const wsRes = calculateProfitability(m.wsPrice);
                  const flashRes = calculateProfitability(m.flashPrice);
                  const getValColor = (val: number) => val >= 0 ? 'text-emerald-500' : 'text-rose-500';
                  return (
                    <tr key={m.size} className="hover:bg-slate-50 font-bold group transition-colors">
                      <td className="p-4 uppercase text-slate-700">{m.size}</td>
                      <td className="p-2 border-l border-slate-200">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-right w-24 ml-auto text-slate-700 font-black">
                          {formatCurrency(m.retailPrice)}
                        </div>
                      </td>
                      <td className={`p-4 text-right ${getValColor(retailRes.margin)}`}>{formatCurrency(retailRes.margin)}</td>
                      <td className={`p-4 text-right ${getValColor(retailRes.pct)}`}>{retailRes.pct.toFixed(1)}%</td>
                      <td className="p-2 border-l border-slate-200">
                        <input 
                          type="number"
                          className="w-24 ml-auto bg-white border border-slate-200 rounded-lg p-2 text-right font-black focus:ring-2 focus:ring-indigo-500 outline-none block"
                          value={m.wsPrice}
                          onChange={e => updateDress(dress.id, 'salesPrices', {...dress.salesPrices, [m.size]: {...dress.salesPrices[m.size], ws: parseFloat(e.target.value)||0}})}
                        />
                      </td>
                      <td className={`p-4 text-right ${getValColor(wsRes.margin)}`}>{formatCurrency(wsRes.margin)}</td>
                      <td className={`p-4 text-right ${getValColor(wsRes.pct)}`}>{wsRes.pct.toFixed(1)}%</td>
                      <td className="p-2 border-l border-slate-200">
                        <input 
                          type="number"
                          className="w-24 ml-auto bg-white border border-slate-200 rounded-lg p-2 text-right font-black focus:ring-2 focus:ring-indigo-500 outline-none block"
                          value={m.flashPrice}
                          onChange={e => updateDress(dress.id, 'salesPrices', {...dress.salesPrices, [m.size]: {...dress.salesPrices[m.size], flash: parseFloat(e.target.value)||0}})}
                        />
                      </td>
                      <td className={`p-4 text-right ${getValColor(flashRes.margin)}`}>{formatCurrency(flashRes.margin)}</td>
                      <td className={`p-4 text-right ${getValColor(flashRes.pct)}`}>{flashRes.pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="p-6 md:col-span-1" accentColor="emerald">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Project Investment</p>
              <h4 className="text-xl font-black text-slate-800">{formatCurrency(metrics.totalInvestment)} <span className="text-[10px] opacity-40 font-bold">MMK</span></h4>
           </Card>
           <Card className="p-6 md:col-span-1" accentColor="blue">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Expected Revenue</p>
              <h4 className="text-xl font-black text-slate-800">{formatCurrency(metrics.totalRevenue)} <span className="text-[10px] opacity-40 font-bold">MMK</span></h4>
           </Card>
           <Card className="p-6 md:col-span-1" accentColor="indigo">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Avg Margin per Unit</p>
              <h4 className="text-xl font-black text-indigo-600">{formatCurrency(metrics.avgPrice - metrics.avgVarCost)} <span className="text-[10px] opacity-40 font-bold">MMK</span></h4>
           </Card>
           <Card className="p-6 md:col-span-1" accentColor="rose">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">BEP Units</p>
              <h4 className="text-xl font-black text-rose-600">{Math.ceil(metrics.bepUnits)} <span className="text-[10px] opacity-40 font-bold">PCS</span></h4>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-8 lg:col-span-1" accentColor="slate">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><PieChart size={16}/> Break-Even Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-xs font-bold text-slate-700 uppercase">Fixed Cost</span>
                <span className="text-sm font-black">{formatCurrency(metrics.totalFixedCost)} MMK</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-xs font-bold text-slate-700 uppercase">Avg Variable Cost</span>
                <span className="text-sm font-black">{formatCurrency(Math.round(metrics.avgVarCost))} MMK</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-xs font-bold text-slate-700 uppercase">Avg Sales Price</span>
                <span className="text-sm font-black">{formatCurrency(Math.round(metrics.avgPrice))} MMK</span>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mt-4">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-black text-rose-600 uppercase">Break-Even Units</span>
                   <span className="text-lg font-black text-rose-700">{Math.ceil(metrics.bepUnits)} pcs</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-rose-600 uppercase">BE Revenue</span>
                   <span className="text-sm font-black text-rose-700">{formatCurrency(Math.ceil(metrics.bepUnits) * metrics.avgPrice)} MMK</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 lg:col-span-2" accentColor="indigo">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Activity size={16}/> Break-Even Visualization</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="units" 
                    label={{ value: 'Units produced', position: 'insideBottom', offset: -20, fontSize: 10, fontWeight: 900 }} 
                    tick={{ fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => (val / 1000) + 'k'}
                  />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString() + ' MMK'} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="totalCost" name="Total Cost" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  {metrics.bepUnits > 0 && (
                    <ReferenceLine x={Math.ceil(metrics.bepUnits)} stroke="#8b5cf6" strokeDasharray="3 3" label={{ position: 'top', value: 'BEP', fontSize: 10, fill: '#8b5cf6', fontWeight: 900 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={() => setActiveTab(2)} variant="secondary">Previous Step</Button>
          <Button onClick={onBack} icon={CheckCircle}>Confirm Production Plan</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {notification && <div className="fixed top-24 right-8 z-50 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl animate-fadeIn font-black text-[10px] uppercase tracking-widest">{notification}</div>}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-1"><span onClick={onBack} className="cursor-pointer hover:text-indigo-600">PORTFOLIO</span> <ChevronRight size={14}/> <span>{dress.name}</span></div><h2 className="text-3xl font-black tracking-tighter text-slate-900">{dress.name}</h2></div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSelection}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border ${dress.isChecked === false ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
          >
            {dress.isChecked === false ? <Square size={18} /> : <CheckSquare size={18} />}
            <span>{dress.isChecked === false ? "Excluded" : "Included"}</span>
          </button>
          
          <Button 
            onClick={() => onDelete(dress.id)} 
            variant="danger" 
            disabled={isSyncing}
            className="group relative"
          >
            {isSyncing ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Deleting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 size={16} /> Delete Product
              </span>
            )}
          </Button>
          
          <Button onClick={onBack} variant="secondary">Back</Button>
        </div>
      </div>
      <div className="flex gap-2 border-b overflow-x-auto custom-scrollbar whitespace-nowrap">
        {[0, 1, 2, 3].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#0f172a] text-white rounded-t-2xl shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>
            {t === 0 ? 'Tab 0: System Config' : t === 1 ? 'Tab 1: Fabric Calc' : t === 2 ? 'Tab 2: Production Cost' : 'Tab 3: Financial Analysis'}
          </button>
        ))}
      </div>
      {activeTab === 0 && renderTab0()}
      {activeTab === 1 && renderTab1()}
      {activeTab === 2 && renderTab2()}
      {activeTab === 3 && renderTab3()}
    </div>
  );
};

export default SelectionManager;
