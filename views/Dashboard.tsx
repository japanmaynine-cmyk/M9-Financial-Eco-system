
import React, { useState } from 'react';
import { 
  Scissors, Shirt, Activity, Settings, DollarSign, TrendingUp, PieChart, Star, ShieldCheck, Calendar, ChevronDown
} from 'lucide-react';
import { Dress, Metrics } from '../types';
import { KpiCard, Card } from '../components';
import { calculateMetrics } from '../logic';

interface DashboardProps {
  dresses: Dress[];
  onEditDress: (id: number) => void;
}

interface QuarterParams {
  mult: number;
  sales: number;
}

const Dashboard: React.FC<DashboardProps> = ({ dresses, onEditDress }) => {
  const [dashboardType, setDashboardType] = useState<'fabric' | 'financial' | 'quarterly'>('fabric');
  
  // Quarterly Planning State
  const [qConfig, setQConfig] = useState<Record<string, QuarterParams>>({
    Q1: { mult: 1.5, sales: 85 },
    Q2: { mult: 2.0, sales: 90 },
    Q3: { mult: 2.5, sales: 95 },
    All: { mult: 1.0, sales: 100 }
  });

  const [dressQuarters, setDressQuarters] = useState<Record<number, string>>({});

  const activeDresses = dresses.filter(d => d.isChecked !== false);
  
  const itemsWithMetrics = activeDresses.map(dress => ({
    ...dress,
    metrics: calculateMetrics(dress)
  }));

  const aggregate = itemsWithMetrics.reduce((acc, item) => {
    return {
      totalInvestment: acc.totalInvestment + item.metrics.totalInvestment,
      totalRevenue: acc.totalRevenue + item.metrics.totalRevenue,
      grossProfit: acc.grossProfit + item.metrics.grossProfit,
      totalBEP: acc.totalBEP + item.metrics.bepUnits,
      totalFabric: acc.totalFabric + item.metrics.totalFabricYards,
      totalQty: acc.totalQty + item.metrics.totalQty,
      items: [...acc.items, item]
    };
  }, { totalInvestment: 0, totalRevenue: 0, grossProfit: 0, totalBEP: 0, totalFabric: 0, totalQty: 0, items: [] as any[] });

  // Quarterly Calculations
  const quarterlyLedger = itemsWithMetrics.map(item => {
    const selectedQ = dressQuarters[item.id] || 'All';
    const params = qConfig[selectedQ];
    const unitCost = item.metrics.avgVarCost;
    const retailPrice = item.metrics.avgPrice;
    const baseQty = item.metrics.totalQty;

    const prodInv = (unitCost * baseQty) * params.mult;
    const potentialSales = (retailPrice * (baseQty * params.mult)) * (params.sales / 100);

    return {
      ...item,
      selectedQ,
      prodInv,
      potentialSales,
      unitCost,
      retailPrice,
      baseQty
    };
  });

  const totalYearInvestment = quarterlyLedger.reduce((sum, row) => sum + row.prodInv, 0);
  const totalYearSales = quarterlyLedger.reduce((sum, row) => sum + row.potentialSales, 0);
  const totalYearProfit = totalYearSales - totalYearInvestment;
  
  // Weighted Averages for BEP
  const totalWeightedRetail = quarterlyLedger.reduce((sum, row) => sum + (row.retailPrice * row.baseQty), 0);
  const totalWeightedVarCost = quarterlyLedger.reduce((sum, row) => sum + (row.unitCost * row.baseQty), 0);
  const totalBaseQty = quarterlyLedger.reduce((sum, row) => sum + row.baseQty, 0);
  
  const avgRetailPrice = totalBaseQty > 0 ? totalWeightedRetail / totalBaseQty : 0;
  const avgVarCost = totalBaseQty > 0 ? totalWeightedVarCost / totalBaseQty : 0;
  const breakEvenAvg = (avgRetailPrice - avgVarCost) > 0 ? totalYearInvestment / (avgRetailPrice - avgVarCost) : 0;

  // Portfolio Health calculation
  const overallMargin = aggregate.totalRevenue > 0 ? (aggregate.grossProfit / aggregate.totalRevenue) * 100 : 0;
  const portfolioHealth = overallMargin > 30 ? 'Excellent' : overallMargin > 15 ? 'Stable' : 'Risk';

  // Fabric Aggregation logic
  const fabricColorAggregation: Record<string, any> = {};
  activeDresses.forEach(dress => {
    dress.config.fabrics.forEach(fab => {
      dress.config.sizes.forEach(size => {
        const isFixed = fab.colorMode === 'Fixed';
        const qties = isFixed 
          ? [dress.config.colors.reduce((sum, c) => sum + (dress.orders[size]?.[c] || 0), 0)] 
          : dress.config.colors.map(color => dress.orders[size]?.[color] || 0);
        
        const currentColors = isFixed ? [fab.fixedColor || "Fixed"] : dress.config.colors;

        currentColors.forEach((color, idx) => {
          const qty = isFixed ? qties[0] : qties[idx];
          if (qty > 0) {
            const key = `${dress.id}-${color}-${fab.code}-${fab.type}`;
            if (!fabricColorAggregation[key]) {
              fabricColorAggregation[key] = {
                color,
                fabricType: fab.type,
                fabricCode: fab.code,
                category: dress.category,
                fabrication: dress.fabrication,
                totalQty: 0,
                totalCons: 0
              };
            }
            const cons = dress.consumption?.[fab.id]?.[size] || 0;
            fabricColorAggregation[key].totalQty += qty;
            fabricColorAggregation[key].totalCons += (qty * cons);
          }
        });
      });
    });
  });

  const fabricBreakdownList = Object.values(fabricColorAggregation);

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex items-center gap-4">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${portfolioHealth === 'Excellent' ? 'bg-emerald-500' : portfolioHealth === 'Stable' ? 'bg-indigo-500' : 'bg-rose-500'}`}>
              <ShieldCheck size={32} className="text-white"/>
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                {dashboardType === 'fabric' ? 'Material Utilization' : dashboardType === 'financial' ? 'Portfolio Profitability' : 'Quarterly Strategy Plan'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">Health Status: <span className={`font-black ${portfolioHealth === 'Excellent' ? 'text-emerald-600' : portfolioHealth === 'Stable' ? 'text-indigo-600' : 'text-rose-600'}`}>{portfolioHealth}</span> ({overallMargin.toFixed(1)}% Avg Margin)</p>
           </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setDashboardType('fabric')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardType === 'fabric' ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Material Breakdown
          </button>
          <button
            onClick={() => setDashboardType('financial')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardType === 'financial' ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Financial Ledger
          </button>
          <button
            onClick={() => setDashboardType('quarterly')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardType === 'quarterly' ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Quarterly Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {dashboardType === 'fabric' && (
          <>
            <KpiCard title="Project Material Req" value={aggregate.totalFabric.toLocaleString(undefined, { maximumFractionDigits: 1 })} unit="yds" icon={Scissors} color="blue" />
            <KpiCard title="Total Batch Units" value={aggregate.totalQty.toLocaleString()} unit="pcs" icon={Shirt} color="indigo" />
            <KpiCard title="Efficiency (yds/unit)" value={aggregate.totalQty ? (aggregate.totalFabric / aggregate.totalQty).toFixed(2) : 0} unit="yds" icon={Activity} color="emerald" />
            <KpiCard title="Active Materials" value={new Set(dresses.flatMap(d => d.config.fabrics.map(f => f.code))).size} unit="SKUs" icon={Settings} color="amber" />
          </>
        )}
        {dashboardType === 'financial' && (
          <>
            <KpiCard title="Portfolio Investment" value={aggregate.totalInvestment.toLocaleString()} unit="MMK" icon={DollarSign} color="slate" />
            <KpiCard title="Projected Revenue" value={aggregate.totalRevenue.toLocaleString()} unit="MMK" icon={TrendingUp} color="emerald" />
            <KpiCard title="Gross Portfolio Profit" value={aggregate.grossProfit.toLocaleString()} unit="MMK" icon={PieChart} color="indigo" />
            <KpiCard title="Required Sales (BEP)" value={Math.ceil(aggregate.totalBEP).toLocaleString()} unit="pcs" icon={Activity} color="rose" />
          </>
        )}
        {dashboardType === 'quarterly' && (
          <>
            <KpiCard title="Total Year Investment" value={formatCurrency(totalYearInvestment)} unit="MMK" icon={DollarSign} color="slate" />
            <KpiCard title="Total Year Sales" value={formatCurrency(totalYearSales)} unit="MMK" icon={TrendingUp} color="emerald" />
            <KpiCard title="Net Profit" value={formatCurrency(totalYearProfit)} unit="MMK" icon={PieChart} color="blue" />
            <KpiCard title="Break-Even (Avg)" value={formatCurrency(Math.ceil(breakEvenAvg))} unit="Units" icon={Activity} color="indigo" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dashboardType !== 'quarterly' ? (
          <>
            <div className="lg:col-span-2">
              {dashboardType === 'fabric' ? (
                <Card className="p-0 overflow-hidden" accentColor="blue">
                  <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Scissors size={18} className="text-blue-500"/> Material Purchase List</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white text-slate-400 font-black uppercase text-[10px]">
                        <tr>
                          <th className="p-4 border-b border-slate-100 pl-6">Color Variant</th>
                          <th className="p-4 border-b border-slate-100">Role & Code</th>
                          <th className="p-4 border-b border-slate-100 text-right">Production Qty</th>
                          <th className="p-4 border-b border-slate-100 text-right pr-6">Required Yield</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {fabricBreakdownList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800">{item.color}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 leading-none mb-1">{item.fabricType}</span>
                                <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">{item.fabricCode}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-medium">{item.totalQty.toLocaleString()} pcs</td>
                            <td className="p-4 text-right pr-6">
                              <span className="font-black text-emerald-600 text-lg">{item.totalCons.toFixed(1)}</span>
                              <span className="text-xs ml-1 font-bold text-slate-400">yds</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden" accentColor="indigo">
                  <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><DollarSign size={18} className="text-indigo-500"/> Project Financial Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white text-slate-400 font-black uppercase text-[10px]">
                        <tr>
                          <th className="p-4 border-b border-slate-100 pl-6">Production Code</th>
                          <th className="p-4 border-b border-slate-100 text-right">Batch Cost</th>
                          <th className="p-4 border-b border-slate-100 text-right">Revenue</th>
                          <th className="p-4 border-b border-slate-100 text-right">Net Profit</th>
                          <th className="p-4 border-b border-slate-100 text-right pr-6">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {aggregate.items.map((item: any) => {
                          const margin = item.metrics.totalRevenue ? (item.metrics.grossProfit / item.metrics.totalRevenue) * 100 : 0;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 pl-6">
                                <button onClick={() => onEditDress(item.id)} className="group text-left">
                                  <div className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.code}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{item.name}</div>
                                </button>
                              </td>
                              <td className="p-4 text-right text-slate-600 font-medium">{item.metrics.totalInvestment.toLocaleString()}</td>
                              <td className="p-4 text-right text-emerald-600 font-bold">{item.metrics.totalRevenue.toLocaleString()}</td>
                              <td className="p-4 text-right font-black text-slate-900">{item.metrics.grossProfit.toLocaleString()}</td>
                              <td className="p-4 text-right pr-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${margin > 25 ? 'bg-emerald-100 text-emerald-700' : margin > 10 ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {margin.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white" accentColor="fuchsia">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Top Performer</h3>
                  <Star size={20} className="text-amber-400 fill-amber-400"/>
                </div>
                {aggregate.items.length > 0 ? (() => {
                  const best = [...aggregate.items].sort((a,b) => b.metrics.grossProfit - a.metrics.grossProfit)[0];
                  return (
                    <div>
                      <div className="text-3xl font-black mb-1">{best.code}</div>
                      <div className="text-xs opacity-60 font-medium mb-6 uppercase tracking-wider">{best.name}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] opacity-60 font-black mb-1">PROFIT</div>
                            <div className="text-lg font-black">{best.metrics.grossProfit.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                            <div className="text-[10px] opacity-60 font-black mb-1">MARGIN</div>
                            <div className="text-lg font-black text-emerald-400">
                                {best.metrics.totalRevenue > 0 ? ((best.metrics.grossProfit / best.metrics.totalRevenue)*100).toFixed(1) : 0}%
                            </div>
                        </div>
                      </div>
                    </div>
                  )
                })() : <div className="p-10 text-center text-white/40 font-black">No Active Data</div>}
              </Card>

              <Card className="p-6 bg-white border-slate-200" accentColor="rose">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Portfolio Risk Profile</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-700">Margin vs Target</span>
                      <span className="text-sm font-black text-slate-900">{overallMargin.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                      <div className={`h-full transition-all duration-1000 ${overallMargin > 20 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, overallMargin)}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    The current portfolio is expected to yield <span className="text-slate-900 font-bold">{overallMargin.toFixed(1)}%</span> overall gross margin.
                  </p>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Quarterly Configuration Panel */}
              <div className="md:col-span-1">
                <Card className="p-6" accentColor="indigo">
                   <div className="flex items-center gap-2 mb-6">
                      <Calendar size={18} className="text-indigo-500" />
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Quarterly Planning</h3>
                   </div>
                   <div className="space-y-5">
                      <div className="grid grid-cols-3 text-[10px] font-black text-slate-400 uppercase border-b pb-2 px-1">
                        <span>Period</span>
                        <span className="text-center">Prod. Mult</span>
                        <span className="text-right">Sales %</span>
                      </div>
                      {['Q1', 'Q2', 'Q3'].map(q => (
                        <div key={q} className="grid grid-cols-3 items-center gap-2">
                           <span className="text-xs font-black text-slate-700">{q}</span>
                           <input 
                              type="number" step="0.1" 
                              className="bg-white border rounded p-1 text-center text-xs font-bold w-full"
                              value={qConfig[q].mult}
                              onChange={e => setQConfig({...qConfig, [q]: {...qConfig[q], mult: parseFloat(e.target.value) || 0}})}
                           />
                           <div className="relative">
                             <input 
                                type="number" 
                                className="bg-emerald-50 border border-emerald-100 rounded p-1 text-right text-xs font-bold text-emerald-800 w-full pr-4"
                                value={qConfig[q].sales}
                                onChange={e => setQConfig({...qConfig, [q]: {...qConfig[q], sales: parseInt(e.target.value) || 0}})}
                             />
                             <span className="absolute right-1 top-1 text-[8px] text-emerald-500">%</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
              </div>

              {/* Main Ledger */}
              <div className="md:col-span-3">
                <Card className="p-0 overflow-hidden" accentColor="emerald">
                   <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Project Financial Breakdown Ledger</h3>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-100/50 text-slate-500 font-black uppercase text-[10px]">
                          <tr>
                            <th className="p-4 border-b">Dress Code</th>
                            <th className="p-4 border-b">Category</th>
                            <th className="p-4 border-b">Quarter</th>
                            <th className="p-4 border-b text-right">Unit Cost</th>
                            <th className="p-4 border-b text-right">Retail Price</th>
                            <th className="p-4 border-b text-center">Base Qty</th>
                            <th className="p-4 border-b text-right">Production Inv</th>
                            <th className="p-4 border-b text-right">Potential Sales</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                           {quarterlyLedger.map(row => (
                             <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 font-black text-slate-800 uppercase">{row.code}</td>
                               <td className="p-4 text-slate-500">{row.category}</td>
                               <td className="p-2">
                                  <div className="relative inline-block w-full">
                                    <select 
                                      className="bg-slate-100 border rounded px-2 py-1 text-[10px] font-bold appearance-none w-full"
                                      value={row.selectedQ}
                                      onChange={e => setDressQuarters({...dressQuarters, [row.id]: e.target.value})}
                                    >
                                      <option value="All">All</option>
                                      <option value="Q1">Q1</option>
                                      <option value="Q2">Q2</option>
                                      <option value="Q3">Q3</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1 top-2.5 pointer-events-none opacity-50" />
                                  </div>
                               </td>
                               <td className="p-4 text-right">{formatCurrency(row.unitCost)}</td>
                               <td className="p-4 text-right">{formatCurrency(row.retailPrice)}</td>
                               <td className="p-4 text-center">
                                  <span className="border rounded px-3 py-1 bg-white font-black">{row.baseQty}</span>
                               </td>
                               <td className="p-4 text-right font-black" style={{ color: '#D4A017' }}>{formatCurrency(row.prodInv)}</td>
                               <td className="p-4 text-right font-black" style={{ color: '#2E7D32' }}>{formatCurrency(row.potentialSales)}</td>
                             </tr>
                           ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2">
                           <tr className="font-black">
                              <td colSpan={6} className="p-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Ledger Totals:</td>
                              <td className="p-4 text-right text-lg" style={{ color: '#D4A017' }}>{formatCurrency(totalYearInvestment)}</td>
                              <td className="p-4 text-right text-lg" style={{ color: '#2E7D32' }}>{formatCurrency(totalYearSales)}</td>
                           </tr>
                        </tfoot>
                      </table>
                   </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
