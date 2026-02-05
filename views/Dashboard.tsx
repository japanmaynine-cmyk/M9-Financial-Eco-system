
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, Shirt, Activity, Settings, DollarSign, TrendingUp, PieChart, Star, ShieldCheck, Calendar, ChevronDown, RefreshCw, FileText, BarChart3, Target, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Line
} from 'recharts';
import { Dress, Metrics } from '../types';
import { KpiCard, Card, Button } from '../components';
import { calculateMetrics } from '../logic';

interface DashboardProps {
  dresses: Dress[];
  onEditDress: (id: number) => void;
}

interface QuarterParams {
  mult: number;
  sales: number;
}

interface ComputedQuarterRow {
  id: number;
  name: string;
  code: string;
  category: string;
  selectedQ: string;
  unitCost: number;
  retailPrice: number;
  baseQty: number;
  prodMultQty: number;
  prodInv: number;
  potentialSales: number;
}

const Dashboard: React.FC<DashboardProps> = ({ dresses, onEditDress }) => {
  const [dashboardType, setDashboardType] = useState<'fabric' | 'financial' | 'quarterly'>('fabric');
  
  const [qConfig, setQConfig] = useState<Record<string, QuarterParams>>({
    Q1: { mult: 1, sales: 85 },
    Q2: { mult: 1.5, sales: 90 },
    Q3: { mult: 2, sales: 95 },
    All: { mult: 0, sales: 100 } 
  });

  const [dressQuarters, setDressQuarters] = useState<Record<number, string>>({});
  const [computedLedger, setComputedLedger] = useState<ComputedQuarterRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeDresses = dresses.filter(d => d.isChecked !== false);
  
  const itemsWithMetrics = useMemo(() => {
    return activeDresses.map(dress => ({
      ...dress,
      metrics: calculateMetrics(dress)
    }));
  }, [activeDresses]);

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

  // 1. Investment Breakdown Per Quarter Calculation
  const investmentBreakdown = useMemo(() => {
    const calculateQuarter = (qKey: 'Q1' | 'Q2' | 'Q3') => {
      const mult = qConfig[qKey].mult;
      
      return itemsWithMetrics.reduce((acc, item) => {
        const fabricBase = item.metrics.sizeMetrics.reduce((sum, sm) => 
          sum + sm.fabricRows.reduce((fSum, fr) => fSum + (fr.unitCost * sm.qty), 0), 0
        );
        const sewingAcc = item.metrics.sizeMetrics.reduce((sum, sm) => sum + sm.sewingRowCost + sm.accRowCost, 0);
        const baseCOGS = fabricBase + sewingAcc;

        const baseWastage = item.metrics.sizeMetrics.reduce((sum, sm) => 
          sum + sm.fabricRows.reduce((fSum, fr) => fSum + (fr.wastageAmt * sm.qty), 0), 0
        );
        const baseMarketing = item.metrics.totalMarketingCost;
        const baseOps = item.metrics.totalOpsCost;
        const baseFixed = item.metrics.totalFixedCost;

        return {
          cogs: acc.cogs + (baseCOGS * mult),
          wastage: acc.wastage + (baseWastage * mult),
          marketing: acc.marketing + (baseMarketing * mult),
          ops: acc.ops + (baseOps * mult),
          fixed: acc.fixed + (baseFixed * mult)
        };
      }, { cogs: 0, wastage: 0, marketing: 0, ops: 0, fixed: 0 });
    };

    const q1 = calculateQuarter('Q1');
    const q2 = calculateQuarter('Q2');
    const q3 = calculateQuarter('Q3');

    return [
      { label: 'COST COGS (FABRICS + PROCESSING)', q1: q1.cogs, q2: q2.cogs, q3: q3.cogs },
      { label: 'WASTAGE COST', q1: q1.wastage, q2: q2.wastage, q3: q3.wastage },
      { label: 'MARKETING COST', q1: q1.marketing, q2: q2.marketing, q3: q3.marketing },
      { label: 'TRANS. & OPS. OVERHEAD', q1: q1.ops, q2: q2.ops, q3: q3.ops },
      { label: 'VARIABLE INVESTMENT', q1: q1.cogs + q1.wastage + q1.marketing + q1.ops, q2: q2.cogs + q2.wastage + q2.marketing + q2.ops, q3: q3.cogs + q3.wastage + q3.marketing + q3.ops, isSubtotal: true },
      { label: 'OVERHEAD FIXED COST', q1: q1.fixed, q2: q2.fixed, q3: q3.fixed },
      { label: '(TOTAL PROJECT INVESTMENT)', q1: q1.cogs + q1.wastage + q1.marketing + q1.ops + q1.fixed, q2: q2.cogs + q2.wastage + q2.marketing + q2.ops + q2.fixed, q3: q3.cogs + q3.wastage + q3.marketing + q3.ops + q3.fixed, isTotal: true },
    ];
  }, [itemsWithMetrics, qConfig]);

  // 2. Sales & Gross Profit Calculation
  const salesProfitBreakdown = useMemo(() => {
    const calculateQuarterSalesData = (qKey: 'Q1' | 'Q2' | 'Q3') => {
      const mult = qConfig[qKey].mult;
      const salesPct = qConfig[qKey].sales / 100;
      const tpp = itemsWithMetrics.reduce((sum, item) => sum + (item.metrics.avgPrice * item.metrics.totalQty * mult), 0);
      const revenue = tpp * salesPct;
      return { tpp, revenue };
    };

    const q1Data = calculateQuarterSalesData('Q1');
    const q2Data = calculateQuarterSalesData('Q2');
    const q3Data = calculateQuarterSalesData('Q3');
    const invRow = investmentBreakdown[6];

    const profit1 = q1Data.revenue - invRow.q1;
    const profit2 = q2Data.revenue - invRow.q2;
    const profit3 = q3Data.revenue - invRow.q3;

    return [
      { label: 'Total Production Potential', q1: q1Data.tpp, q2: q2Data.tpp, q3: q3Data.tpp, type: 'potential' },
      { label: 'Projected Sales Revenue', q1: q1Data.revenue, q2: q2Data.revenue, q3: q3Data.revenue, type: 'revenue' },
      { label: 'Total Project Investment', q1: invRow.q1, q2: invRow.q2, q3: invRow.q3, type: 'investment' },
      { label: 'GROSS PROFIT / (LOSS)', q1: profit1, q2: profit2, q3: profit3, type: 'profit' },
      { label: 'Gross Margin %', q1: q1Data.revenue > 0 ? (profit1 / q1Data.revenue) * 100 : 0, q2: q2Data.revenue > 0 ? (profit2 / q2Data.revenue) * 100 : 0, q3: q3Data.revenue > 0 ? (profit3 / q3Data.revenue) * 100 : 0, type: 'margin' },
    ];
  }, [itemsWithMetrics, qConfig, investmentBreakdown]);

  // 3. Break Even Analysis (Quarterly Planner)
  const breakEvenBreakdown = useMemo(() => {
    const fixedRow = investmentBreakdown[5];
    const totalBaseQty = itemsWithMetrics.reduce((sum, item) => sum + item.metrics.totalQty, 0);
    const avgUnitVarCost = totalBaseQty > 0 
      ? itemsWithMetrics.reduce((sum, item) => sum + (item.metrics.avgVarCost * item.metrics.totalQty), 0) / totalBaseQty 
      : 0;
    const avgRetailPrice = totalBaseQty > 0 
      ? itemsWithMetrics.reduce((sum, item) => sum + (item.metrics.avgPrice * item.metrics.totalQty), 0) / totalBaseQty 
      : 0;

    const contributionMargin = avgRetailPrice - avgUnitVarCost;
    const calculateBEU = (fc: number) => contributionMargin > 0 ? Math.ceil(fc / contributionMargin) : 0;
    
    const beu1 = calculateBEU(fixedRow.q1);
    const beu2 = calculateBEU(fixedRow.q2);
    const beu3 = calculateBEU(fixedRow.q3);

    const ber1 = beu1 * avgRetailPrice;
    const ber2 = beu2 * avgRetailPrice;
    const ber3 = beu3 * avgRetailPrice;

    const rev1 = salesProfitBreakdown[1].q1;
    const rev2 = salesProfitBreakdown[1].q2;
    const rev3 = salesProfitBreakdown[1].q3;

    const calculateSafetyMargin = (rev: number, ber: number) => rev > 0 ? ((rev - ber) / rev) * 100 : -100;

    return [
      { label: 'Total Fixed Cost', q1: fixedRow.q1, q2: fixedRow.q2, q3: fixedRow.q3, type: 'fc' },
      { label: 'Avg. Unit Variable Cost', q1: avgUnitVarCost, q2: avgUnitVarCost, q3: avgUnitVarCost, type: 'static' },
      { label: 'Avg. Sales Price (Retail)', q1: avgRetailPrice, q2: avgRetailPrice, q3: avgRetailPrice, type: 'static' },
      { label: 'BREAK-EVEN UNITS', q1: beu1, q2: beu2, q3: beu3, type: 'units' },
      { label: 'BREAK-EVEN REVENUE', q1: ber1, q2: ber2, q3: ber3, type: 'ber' },
      { label: 'Safety Margin %', q1: calculateSafetyMargin(rev1, ber1), q2: calculateSafetyMargin(rev2, ber2), q3: calculateSafetyMargin(rev3, ber3), type: 'safety' },
    ];
  }, [itemsWithMetrics, investmentBreakdown, salesProfitBreakdown]);

  const quarterlyChartData = useMemo(() => {
    const invRow = investmentBreakdown[6];
    const revRow = salesProfitBreakdown[1];
    const bepRevRow = breakEvenBreakdown[4];

    return [
      { name: 'Q1', investment: invRow.q1, revenue: revRow.q1, bepRevenue: bepRevRow.q1 },
      { name: 'Q2', investment: invRow.q2, revenue: revRow.q2, bepRevenue: bepRevRow.q2 },
      { name: 'Q3', investment: invRow.q3, revenue: revRow.q3, bepRevenue: bepRevRow.q3 },
    ];
  }, [investmentBreakdown, salesProfitBreakdown, breakEvenBreakdown]);

  // Aggregate Yearly Totals for KPIs from the Breakdown Sections
  const quarterlyKPIs = useMemo(() => {
    const invRow = investmentBreakdown[6];
    const revRow = salesProfitBreakdown[1];
    const profitRow = salesProfitBreakdown[3];
    const unitsRow = breakEvenBreakdown[3];

    return {
      totalYearInv: invRow.q1 + invRow.q2 + invRow.q3,
      totalYearSales: revRow.q1 + revRow.q2 + revRow.q3,
      totalYearProfit: profitRow.q1 + profitRow.q2 + profitRow.q3,
      totalYearUnits: unitsRow.q1 + unitsRow.q2 + unitsRow.q3
    };
  }, [investmentBreakdown, salesProfitBreakdown, breakEvenBreakdown]);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const results = itemsWithMetrics.map(item => {
        const selectedQ = dressQuarters[item.id] || 'All';
        const unitCost = item.metrics.avgVarCost;
        const retailPrice = item.metrics.avgPrice;
        const baseQty = item.metrics.totalQty;

        let prodMultQty = 0;
        let prodInv = 0;
        let potentialSales = 0;

        if (selectedQ === 'All') {
          ['Q1', 'Q2', 'Q3'].forEach(q => {
            const params = qConfig[q];
            const qMultQty = params.mult * baseQty;
            const qInv = qMultQty * unitCost;
            const qSales = (retailPrice * qMultQty) * (params.sales / 100);

            prodMultQty += qMultQty;
            prodInv += qInv;
            potentialSales += qSales;
          });
        } else {
          const params = qConfig[selectedQ];
          prodMultQty = params.mult * baseQty;
          prodInv = prodMultQty * unitCost;
          potentialSales = (retailPrice * prodMultQty) * (params.sales / 100);
        }

        return {
          id: item.id,
          name: item.name,
          code: item.code,
          category: item.category,
          selectedQ,
          unitCost,
          retailPrice,
          baseQty,
          prodMultQty,
          prodInv,
          potentialSales
        };
      });

      setComputedLedger(results);
      setIsGenerating(false);
    }, 400);
  };

  useEffect(() => {
    if (computedLedger.length === 0 && itemsWithMetrics.length > 0) {
      handleGeneratePlan();
    }
  }, [itemsWithMetrics.length]);

  const overallMargin = aggregate.totalRevenue > 0 ? (aggregate.grossProfit / aggregate.totalRevenue) * 100 : 0;
  const portfolioHealth = overallMargin > 30 ? 'Excellent' : overallMargin > 15 ? 'Stable' : 'Risk';

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
            <KpiCard title="Total Year Investment" value={formatCurrency(quarterlyKPIs.totalYearInv)} unit="MMK" icon={DollarSign} color="slate" />
            <KpiCard title="Total Year Sales" value={formatCurrency(quarterlyKPIs.totalYearSales)} unit="MMK" icon={TrendingUp} color="emerald" />
            <KpiCard title="Total Gross Profit" value={formatCurrency(quarterlyKPIs.totalYearProfit)} unit="MMK" icon={PieChart} color="blue" />
            <KpiCard title="Total Break-Even (Avg)" value={formatCurrency(quarterlyKPIs.totalYearUnits)} unit="Units" icon={Activity} color="indigo" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dashboardType !== 'quarterly' ? (
          <div className="lg:col-span-3">
             <Card className="p-10 text-center font-black text-slate-300">
                Select "Quarterly Plan" to view the strategic breakdown.
             </Card>
          </div>
        ) : (
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Card className="p-6" accentColor="indigo">
                   <div className="flex items-center gap-2 mb-6">
                      <Calendar size={18} className="text-indigo-500" />
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Quarterly Planning</h3>
                   </div>
                   <div className="space-y-5">
                      <div className="grid grid-cols-3 text-[10px] font-black text-slate-400 uppercase border-b pb-2 px-1">
                        <span>Period</span>
                        <span className="text-center">Prod. Mult (x)</span>
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
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                         <p className="text-[9px] font-bold text-slate-400 uppercase italic">Configure multipliers and sales targets then click Validate in the ledger section below.</p>
                      </div>
                   </div>
                </Card>
              </div>

              <div className="md:col-span-3">
                <Card className="p-0 overflow-hidden" accentColor="emerald">
                   <div className="bg-slate-50 p-5 border-b flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Project Financial Breakdown Ledger</h3>
                      <Button 
                        onClick={handleGeneratePlan} 
                        disabled={isGenerating} 
                        variant="primary" 
                        icon={CheckCircle2} 
                        className={`text-[10px] uppercase tracking-widest h-9 px-4 ${isGenerating ? 'opacity-70 animate-pulse' : ''}`}
                      >
                        {isGenerating ? 'Validating...' : 'Validate'}
                      </Button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-100/50 text-slate-500 font-black uppercase text-[10px]">
                          <tr>
                            <th className="p-4 border-b">Dress Name</th>
                            <th className="p-4 border-b">Quarter</th>
                            <th className="p-4 border-b text-right">Unit Cost</th>
                            <th className="p-4 border-b text-right">Retail Price</th>
                            <th className="p-4 border-b text-center">Base Qty</th>
                            <th className="p-4 border-b text-center">Prod. Mult. QTY</th>
                            <th className="p-4 border-b text-right">Production Inv</th>
                            <th className="p-4 border-b text-right">Potential Sales</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                           {computedLedger.map(row => (
                             <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 font-black text-slate-800 uppercase">{row.name || row.code}</td>
                               <td className="p-2">
                                  <div className="relative inline-block w-full">
                                    <select 
                                      className="bg-slate-100 border rounded px-2 py-1 text-[10px] font-bold appearance-none w-full"
                                      value={row.selectedQ}
                                      onChange={e => {
                                        setDressQuarters({...dressQuarters, [row.id]: e.target.value});
                                      }}
                                    >
                                      <option value="All">All Quarters</option>
                                      <option value="Q1">Q1 Only</option>
                                      <option value="Q2">Q2 Only</option>
                                      <option value="Q3">Q3 Only</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1 top-2.5 pointer-events-none opacity-50" />
                                  </div>
                               </td>
                               <td className="p-4 text-right font-mono">{formatCurrency(row.unitCost)}</td>
                               <td className="p-4 text-right font-mono">{formatCurrency(row.retailPrice)}</td>
                               <td className="p-4 text-center font-mono">{row.baseQty}</td>
                               <td className="p-4 text-center font-mono">
                                  <span className="border rounded px-2 py-1 bg-indigo-50 text-indigo-700 font-black">{Math.round(row.prodMultQty)}</span>
                               </td>
                               <td className="p-4 text-right font-mono font-black" style={{ color: '#D4A017' }}>{formatCurrency(row.prodInv)}</td>
                               <td className="p-4 text-right font-mono font-black" style={{ color: '#2E7D32' }}>{formatCurrency(row.potentialSales)}</td>
                             </tr>
                           ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2">
                           <tr className="font-black">
                              <td colSpan={6} className="p-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Snapshot Totals:</td>
                              <td className="p-4 text-right text-lg font-mono" style={{ color: '#D4A017' }}>{formatCurrency(computedLedger.reduce((s,r)=>s+r.prodInv, 0))}</td>
                              <td className="p-4 text-right text-lg font-mono" style={{ color: '#2E7D32' }}>{formatCurrency(computedLedger.reduce((s,r)=>s+r.potentialSales, 0))}</td>
                           </tr>
                        </tfoot>
                      </table>
                   </div>
                </Card>
              </div>
            </div>

            {/* 1. Investment Breakdown Per Quarter */}
            <Card className="p-0 overflow-hidden" accentColor="blue">
               <div className="bg-slate-50 p-5 border-b flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">1. Investment Breakdown Per Quarter</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
                   <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px]">
                     <tr>
                       <th className="p-4 border-b pl-6">Cost Component (Description)</th>
                       <th className="p-4 border-b text-right">Q1 (MMK)</th>
                       <th className="p-4 border-b text-right">Q2 (MMK)</th>
                       <th className="p-4 border-b text-right">Q3 (MMK)</th>
                       <th className="p-4 border-b text-right pr-6">Total Yearly Plan</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white">
                     {investmentBreakdown.map((row: any, idx) => {
                       const rowTotal = row.q1 + row.q2 + row.q3;
                       const isSpecial = row.isSubtotal || row.isTotal;
                       return (
                         <tr key={idx} className={`transition-colors ${isSpecial ? (row.isTotal ? 'bg-blue-50/80 font-black' : 'bg-slate-50 font-black') : 'hover:bg-slate-50 font-medium'}`}>
                           <td className={`p-4 pl-6 border-b ${isSpecial ? 'uppercase tracking-wider' : 'text-slate-600'}`}>{row.label}</td>
                           <td className="p-4 border-b text-right font-mono">{formatCurrency(row.q1)}</td>
                           <td className="p-4 border-b text-right font-mono">{formatCurrency(row.q2)}</td>
                           <td className="p-4 border-b text-right font-mono">{formatCurrency(row.q3)}</td>
                           <td className="p-4 border-b text-right pr-6 font-mono font-black">{formatCurrency(rowTotal)}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </Card>

            {/* 2. Sales & Gross Profit */}
            <Card className="p-0 overflow-hidden" accentColor="emerald">
               <div className="bg-slate-50 p-5 border-b flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. Sales & Gross Profit</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
                   <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px]">
                     <tr>
                       <th className="p-4 border-b pl-6">Description</th>
                       <th className="p-4 border-b text-right">Q1 (MMK)</th>
                       <th className="p-4 border-b text-right">Q2 (MMK)</th>
                       <th className="p-4 border-b text-right">Q3 (MMK)</th>
                       <th className="p-4 border-b text-right pr-6">Total Yearly Plan</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white">
                     {salesProfitBreakdown.map((row, idx) => {
                       const rowTotal = row.type === 'margin' ? (row.q1 + row.q2 + row.q3) / 3 : (row.q1 + row.q2 + row.q3);
                       let cellClass = "font-mono text-right";
                       let cellContentQ1: any = formatCurrency(row.q1);
                       let cellContentQ2: any = formatCurrency(row.q2);
                       let cellContentQ3: any = formatCurrency(row.q3);
                       let cellContentTotal: any = formatCurrency(rowTotal);

                       if (row.type === 'revenue') cellClass += " text-emerald-700 font-bold";
                       if (row.type === 'investment') cellClass += " text-rose-700 font-bold";
                       
                       if (row.type === 'profit') {
                         const getS = (v: number) => v >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
                         cellContentQ1 = <span className={`px-4 py-2 rounded-xl block font-black ${getS(row.q1)}`}>{formatCurrency(row.q1)}</span>;
                         cellContentQ2 = <span className={`px-4 py-2 rounded-xl block font-black ${getS(row.q2)}`}>{formatCurrency(row.q2)}</span>;
                         cellContentQ3 = <span className={`px-4 py-2 rounded-xl block font-black ${getS(row.q3)}`}>{formatCurrency(row.q3)}</span>;
                         cellContentTotal = <span className={`px-4 py-2 rounded-xl block font-black ${getS(rowTotal)}`}>{formatCurrency(rowTotal)}</span>;
                       }

                       if (row.type === 'margin') {
                         cellContentQ1 = `${row.q1.toFixed(1)}%`;
                         cellContentQ2 = `${row.q2.toFixed(1)}%`;
                         cellContentQ3 = `${row.q3.toFixed(1)}%`;
                         cellContentTotal = `${rowTotal.toFixed(1)}%`;
                         cellClass += " italic text-slate-400";
                       }

                       return (
                         <tr key={idx} className={`hover:bg-slate-50 transition-colors ${row.type === 'profit' ? 'border-t-2 border-slate-900 bg-slate-50/50' : ''}`}>
                           <td className="p-4 pl-6 border-b font-black uppercase text-slate-700">{row.label}</td>
                           <td className={`p-4 border-b ${cellClass}`}>{cellContentQ1}</td>
                           <td className={`p-4 border-b ${cellClass}`}>{cellContentQ2}</td>
                           <td className={`p-4 border-b ${cellClass}`}>{cellContentQ3}</td>
                           <td className={`p-4 border-b pr-6 ${cellClass} font-black`}>{cellContentTotal}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </Card>

            {/* 3. Break Even Analysis (Quarterly Planner) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-0 overflow-hidden" accentColor="indigo">
                <div className="bg-slate-50 p-5 border-b flex items-center gap-2">
                  <Target size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">3. Break Even Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[600px]">
                    <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-4 border-b pl-6">Description</th>
                        <th className="p-4 border-b text-right">Q1 (MMK)</th>
                        <th className="p-4 border-b text-right">Q2 (MMK)</th>
                        <th className="p-4 border-b text-right">Q3 (MMK)</th>
                        <th className="p-4 border-b text-right pr-6">Yearly Plan</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {breakEvenBreakdown.map((row, idx) => {
                        let textClass = "font-mono text-right";
                        let valQ1: any = formatCurrency(row.q1);
                        let valQ2: any = formatCurrency(row.q2);
                        let valQ3: any = formatCurrency(row.q3);
                        let valTotal: any = "";

                        if (row.type === 'fc') valTotal = formatCurrency(row.q1 + row.q2 + row.q3);
                        if (row.type === 'static') valTotal = formatCurrency(row.q1); 
                        if (row.type === 'units') {
                           textClass += " font-black text-slate-900";
                           valTotal = formatCurrency(row.q1 + row.q2 + row.q3);
                        }
                        if (row.type === 'ber') {
                           textClass += " font-black text-[#D4A017]";
                           valTotal = formatCurrency(row.q1 + row.q2 + row.q3);
                        }
                        if (row.type === 'safety') {
                          const getSafeColor = (v: number) => v < 0 ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-lg' : 'text-emerald-600';
                          valQ1 = <span className={getSafeColor(row.q1)}>{row.q1.toFixed(1)}%</span>;
                          valQ2 = <span className={getSafeColor(row.q2)}>{row.q2.toFixed(1)}%</span>;
                          valQ3 = <span className={getSafeColor(row.q3)}>{row.q3.toFixed(1)}%</span>;
                          const avgSafe = (row.q1 + row.q2 + row.q3) / 3;
                          valTotal = <span className={getSafeColor(avgSafe)}>{avgSafe.toFixed(1)}%</span>;
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 border-b font-black uppercase text-slate-600">{row.label}</td>
                            <td className={`p-4 border-b ${textClass}`}>{valQ1}</td>
                            <td className={`p-4 border-b ${textClass}`}>{valQ2}</td>
                            <td className={`p-4 border-b ${textClass}`}>{valQ3}</td>
                            <td className={`p-4 border-b pr-6 ${textClass} font-black`}>{valTotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Quarterly Break-Even Chart */}
              <Card className="p-6" accentColor="slate">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Quarterly Performance Analysis</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={quarterlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 600 }} tickFormatter={(val) => (val / 1000000).toFixed(1) + 'M'} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(val: number) => formatCurrency(val) + ' MMK'}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                      <Bar dataKey="investment" name="Project Investment" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="revenue" name="Expected Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                      <Line type="monotone" dataKey="bepRevenue" name="Break-Even Level" stroke="#D4A017" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
