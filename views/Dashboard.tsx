
import React, { useState } from 'react';
import { 
  Scissors, Shirt, Activity, Settings, DollarSign, TrendingUp, PieChart, Star, ShieldCheck
} from 'lucide-react';
import { Dress, Metrics } from '../types';
import { KpiCard, Card } from '../components';
import { calculateMetrics } from '../logic';

interface DashboardProps {
  dresses: Dress[];
  onEditDress: (id: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ dresses, onEditDress }) => {
  const [dashboardType, setDashboardType] = useState<'fabric' | 'financial'>('fabric');
  
  const activeDresses = dresses.filter(d => d.isChecked !== false);
  
  const aggregate = activeDresses.reduce((acc, dress) => {
    const metrics = calculateMetrics(dress);
    return {
      totalInvestment: acc.totalInvestment + metrics.totalInvestment,
      totalRevenue: acc.totalRevenue + metrics.totalRevenue,
      grossProfit: acc.grossProfit + metrics.grossProfit,
      totalBEP: acc.totalBEP + metrics.bepUnits,
      totalFabric: acc.totalFabric + metrics.totalFabricYards,
      totalQty: acc.totalQty + metrics.totalQty,
      items: [...acc.items, { ...dress, metrics }]
    };
  }, { totalInvestment: 0, totalRevenue: 0, grossProfit: 0, totalBEP: 0, totalFabric: 0, totalQty: 0, items: [] as any[] });

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

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex items-center gap-4">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${portfolioHealth === 'Excellent' ? 'bg-emerald-500' : portfolioHealth === 'Stable' ? 'bg-indigo-500' : 'bg-rose-500'}`}>
              <ShieldCheck size={32} className="text-white"/>
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                {dashboardType === 'fabric' ? 'Material Utilization' : 'Portfolio Profitability'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">Health Status: <span className={`font-black ${portfolioHealth === 'Excellent' ? 'text-emerald-600' : portfolioHealth === 'Stable' ? 'text-indigo-600' : 'text-rose-600'}`}>{portfolioHealth}</span> ({overallMargin.toFixed(1)}% Avg Margin)</p>
           </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setDashboardType('fabric')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${dashboardType === 'fabric' ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Material Breakdown
          </button>
          <button
            onClick={() => setDashboardType('financial')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${dashboardType === 'financial' ? 'bg-white text-indigo-600 shadow-md scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Financial Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {dashboardType === 'fabric' ? (
          <>
            <KpiCard title="Project Material Req" value={aggregate.totalFabric.toLocaleString(undefined, { maximumFractionDigits: 1 })} unit="yds" icon={Scissors} color="blue" />
            <KpiCard title="Total Batch Units" value={aggregate.totalQty.toLocaleString()} unit="pcs" icon={Shirt} color="indigo" />
            <KpiCard title="Efficiency (yds/unit)" value={aggregate.totalQty ? (aggregate.totalFabric / aggregate.totalQty).toFixed(2) : 0} unit="yds" icon={Activity} color="emerald" />
            <KpiCard title="Active Materials" value={new Set(dresses.flatMap(d => d.config.fabrics.map(f => f.code))).size} unit="SKUs" icon={Settings} color="amber" />
          </>
        ) : (
          <>
            <KpiCard title="Portfolio Investment" value={aggregate.totalInvestment.toLocaleString()} unit="MMK" icon={DollarSign} color="slate" />
            <KpiCard title="Projected Revenue" value={aggregate.totalRevenue.toLocaleString()} unit="MMK" icon={TrendingUp} color="emerald" />
            <KpiCard title="Gross Portfolio Profit" value={aggregate.grossProfit.toLocaleString()} unit="MMK" icon={PieChart} color="indigo" />
            <KpiCard title="Required Sales (BEP)" value={Math.ceil(aggregate.totalBEP).toLocaleString()} unit="pcs" icon={Activity} color="rose" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    {fabricBreakdownList.length === 0 && (
                      <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic font-medium">No items found in active portfolio.</td></tr>
                    )}
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
                   The current portfolio is expected to yield <span className="text-slate-900 font-bold">{overallMargin.toFixed(1)}%</span> overall gross margin. Ensure all production items have a risk buffer of at least 2% to cover potential fabrication errors.
                 </p>
                 <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       LOW RISK ITEMS
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                       <div className="w-2 h-2 rounded-full bg-rose-500" />
                       HIGH OVERHEAD
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
