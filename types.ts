
export interface Fabric {
  id: number;
  type: string; // Component
  code: string; // Fabrication
  color: string;
  price: number;
  colorMode: 'Matched' | 'Fixed';
}

export interface SalesPrice {
  retail: number;
  ws: number;
  flash?: number;
}

export interface Costs {
  fixedSalary: number;
  profitTargetPct: number;
  marketingPct: number;
  wastagePct: number; // Applied to fabric cost
  opsPct: number; // Trans & Ops overhead applied to cost
  sewingCost: number;
  accessoriesCost: number;
}

export interface DressConfig {
  sizes: string[];
  colors: string[];
  fabrics: Fabric[];
}

export interface Dress {
  id: number;
  code: string;
  name: string;
  category: string;
  fabrication: string; // Fabrication Code
  isChecked: boolean;
  config: DressConfig;
  orders: Record<string, Record<string, number>>;
  consumption: Record<number, Record<string, number>>;
  costs: Costs;
  salesPrices: Record<string, SalesPrice>;
}

export interface FabricRowDetail {
  id: number;
  type: string;
  code: string;
  consRate: number;
  refPrice: number;
  unitCost: number;
  wastageAmt: number;
  totalRowCost: number;
}

export interface SizeMetric {
  size: string;
  qty: number;
  fabricRows: FabricRowDetail[];
  sewingRowCost: number;
  accRowCost: number;
  baseUnitCost: number;
  marketingUnitCost: number;
  opsUnitCost: number;
  varUnitCost: number; // Total Variable Unit Cost (Displayed in Table 2 "Var Cost")
  batchInv: number; // Total Size Batch Investment (Var_Unit_Cost * prod_qty)
  profitAmt: number;
  calcPrice: number;
  retailPrice: number;
  wsPrice: number;
  flashPrice: number;
  totalSales: number;
}

export interface Metrics {
  totalQty: number;
  totalFabricYards: number;
  totalRevenue: number;
  totalInvestment: number;
  totalMarketingCost: number;
  totalOpsCost: number;
  totalVariableInvestment: number;
  grossProfit: number;
  bepUnits: number;
  sizeMetrics: SizeMetric[];
  avgPrice: number;
  avgVarCost: number;
  totalFixedCost: number;
}
