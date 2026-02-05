
import { Dress, Metrics, SizeMetric, FabricRowDetail } from './types';

export const calculateMetrics = (dress: Dress): Metrics => {
  const sizes = dress.config?.sizes || [];
  const colors = dress.config?.colors || [];
  const fabrics = dress.config?.fabrics || [];
  
  const wastage_pct = (parseFloat(String(dress.costs?.wastagePct || 0)) / 100);
  const marketing_pct = (parseFloat(String(dress.costs?.marketingPct || 0)) / 100);
  const ops_pct = (parseFloat(String(dress.costs?.opsPct || 0)) / 100);
  const profit_target_pct = (parseFloat(String(dress.costs?.profitTargetPct || 0)) / 100);
  const sewing_cost = parseFloat(String(dress.costs?.sewingCost || 0));
  const access_cost = parseFloat(String(dress.costs?.accessoriesCost || 0));
  const fixed_cost = parseFloat(String(dress.costs?.fixedSalary || 0));

  let totalQty = 0;
  let totalFabricYards = 0;
  let totalRevenue = 0;
  let totalMarketingCostTotal = 0;
  let totalOpsCostTotal = 0;
  let totalVariableInvestment = 0;

  const sizeMetrics: SizeMetric[] = sizes.map(size => {
    let prod_qty = 0;
    colors.forEach(color => {
      prod_qty += parseInt(String(dress.orders?.[size]?.[color] || 0));
    });

    // 1. Base Costs (Table 1 Rows)
    const fabricRows: FabricRowDetail[] = fabrics.map(fab => {
      const consRate = parseFloat(String(dress.consumption?.[fab.id]?.[size] || 0));
      const refPrice = parseFloat(String(fab.price || 0));
      const fabUnitCost = refPrice * consRate;
      const wastageAmt = fabUnitCost * wastage_pct;
      const totalRowCost = (fabUnitCost + wastageAmt) * prod_qty;
      
      totalFabricYards += (consRate * prod_qty);

      return {
        id: fab.id,
        type: fab.type,
        code: fab.code,
        consRate,
        refPrice,
        unitCost: fabUnitCost,
        wastageAmt,
        totalRowCost
      };
    });

    const sewingRowCost = sewing_cost * prod_qty;
    const accRowCost = access_cost * prod_qty;

    // 2. Variable Investment Calculation (Table 1 Group Footer)
    const fabUnitCostTotal = fabricRows.reduce((sum, f) => sum + f.unitCost, 0);
    const wastageAmtTotal = fabricRows.reduce((sum, f) => sum + f.wastageAmt, 0);
    
    // Base_Unit_Cost = Fab Unit Cost + Wastage Amt + sewing_cost + access_cost
    const baseUnitCost = fabUnitCostTotal + wastageAmtTotal + sewing_cost + access_cost;

    // Calculate Overheads on the Base Cost
    const marketingUnitCost = baseUnitCost * marketing_pct;
    const opsUnitCost = baseUnitCost * ops_pct;

    // Var_Unit_Cost = Base_Unit_Cost + Marketing_Unit_Cost + Ops_Unit_Cost
    const varUnitCost = baseUnitCost + marketingUnitCost + opsUnitCost;

    // Batch_Inv = Var_Unit_Cost * prod_qty
    const batchInv = varUnitCost * prod_qty;

    // Profitability (Table 2)
    const profitAmt = varUnitCost * profit_target_pct;
    const calcPrice = varUnitCost + profitAmt;
    const retailPrice = parseFloat(String(dress.salesPrices?.[size]?.retail || 0));
    const wsPrice = parseFloat(String(dress.salesPrices?.[size]?.ws || 0));
    const flashPrice = parseFloat(String(dress.salesPrices?.[size]?.flash || 0));
    const totalSales = retailPrice * prod_qty;

    // Accumulate Totals
    totalQty += prod_qty;
    totalRevenue += totalSales;
    totalMarketingCostTotal += (marketingUnitCost * prod_qty);
    totalOpsCostTotal += (opsUnitCost * prod_qty);
    totalVariableInvestment += batchInv;

    return {
      size,
      qty: prod_qty,
      fabricRows,
      sewingRowCost,
      accRowCost,
      baseUnitCost,
      marketingUnitCost,
      opsUnitCost,
      varUnitCost,
      batchInv,
      profitAmt,
      calcPrice,
      retailPrice,
      wsPrice,
      flashPrice,
      totalSales
    };
  });

  // Project Totals (Summary Block)
  const totalInvestment = totalVariableInvestment + fixed_cost;
  const grossProfit = totalRevenue - totalInvestment;

  const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
  const avgVarCost = totalQty > 0 ? totalVariableInvestment / totalQty : 0;
  
  // Break-Even Units: Fixed Cost / (Avg Sales Price - Avg Variable Cost)
  const marginPerUnit = avgPrice - avgVarCost;
  const bepUnits = marginPerUnit > 0 ? fixed_cost / marginPerUnit : 0;

  return {
    totalQty,
    totalFabricYards,
    totalRevenue,
    totalInvestment,
    totalMarketingCost: totalMarketingCostTotal,
    totalOpsCost: totalOpsCostTotal,
    totalVariableInvestment,
    grossProfit,
    bepUnits,
    sizeMetrics,
    avgPrice,
    avgVarCost,
    totalFixedCost: fixed_cost
  };
};
