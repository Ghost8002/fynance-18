// Calculadora de Juros Compostos
export interface CompoundInterestResult {
  finalAmount: number;
  totalInvested: number;
  totalInterest: number;
  monthlyData: { month: number; balance: number; invested: number; interest: number }[];
}

export function calculateCompoundInterest(
  initialCapital: number,
  monthlyContribution: number,
  annualRate: number,
  months: number
): CompoundInterestResult {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const monthlyData: { month: number; balance: number; invested: number; interest: number }[] = [];
  
  let balance = initialCapital;
  let totalInvested = initialCapital;
  
  for (let month = 1; month <= months; month++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    totalInvested += monthlyContribution;
    
    monthlyData.push({
      month,
      balance: Math.round(balance * 100) / 100,
      invested: totalInvested,
      interest: Math.round((balance - totalInvested) * 100) / 100
    });
  }
  
  return {
    finalAmount: Math.round(balance * 100) / 100,
    totalInvested,
    totalInterest: Math.round((balance - totalInvested) * 100) / 100,
    monthlyData
  };
}

// Calculadora de Independência Financeira
export interface FinancialIndependenceResult {
  requiredPatrimony: number;
  monthsToGoal: number;
  yearsToGoal: number;
  monthlyWithdrawal: number;
}

export function calculateFinancialIndependence(
  monthlyExpenses: number,
  currentPatrimony: number,
  monthlyContribution: number,
  annualRate: number,
  safeWithdrawalRate: number = 4
): FinancialIndependenceResult {
  const requiredPatrimony = (monthlyExpenses * 12) / (safeWithdrawalRate / 100);
  
  if (currentPatrimony >= requiredPatrimony) {
    return {
      requiredPatrimony,
      monthsToGoal: 0,
      yearsToGoal: 0,
      monthlyWithdrawal: monthlyExpenses
    };
  }
  
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  let balance = currentPatrimony;
  let months = 0;
  const maxMonths = 1200; // 100 years cap
  
  while (balance < requiredPatrimony && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    months++;
  }
  
  return {
    requiredPatrimony: Math.round(requiredPatrimony * 100) / 100,
    monthsToGoal: months,
    yearsToGoal: Math.round((months / 12) * 10) / 10,
    monthlyWithdrawal: monthlyExpenses
  };
}

// Comparador de Investimentos (com IR regressivo)
export interface InvestmentComparisonResult {
  name: string;
  grossReturn: number;
  netReturn: number;
  irAmount: number;
  effectiveRate: number;
}

export function calculateInvestmentComparison(
  initialAmount: number,
  months: number,
  cdiRate: number = 13.65,
  ipcaRate: number = 4.5,
  selicRate: number = 13.75
): InvestmentComparisonResult[] {
  const calculateIR = (profit: number, months: number): number => {
    let rate: number;
    if (months <= 6) rate = 0.225;
    else if (months <= 12) rate = 0.20;
    else if (months <= 24) rate = 0.175;
    else rate = 0.15;
    return profit * rate;
  };
  
  // Poupança (isenta de IR, rendimento mensal = 0.5% + TR ou 70% Selic)
  const poupancaMonthlyRate = selicRate > 8.5 
    ? 0.5 / 100 + 0.001 // 0.5% + TR (aproximadamente)
    : (selicRate * 0.7) / 12 / 100;
  const poupancaFinal = initialAmount * Math.pow(1 + poupancaMonthlyRate, months);
  const poupancaProfit = poupancaFinal - initialAmount;
  
  // CDB 100% CDI
  const cdbMonthlyRate = Math.pow(1 + cdiRate / 100, 1 / 12) - 1;
  const cdbFinal = initialAmount * Math.pow(1 + cdbMonthlyRate, months);
  const cdbProfit = cdbFinal - initialAmount;
  const cdbIR = calculateIR(cdbProfit, months);
  
  // Tesouro Selic
  const selicMonthlyRate = Math.pow(1 + selicRate / 100, 1 / 12) - 1;
  const tesouroFinal = initialAmount * Math.pow(1 + selicMonthlyRate, months);
  const tesouroProfit = tesouroFinal - initialAmount;
  const tesouroIR = calculateIR(tesouroProfit, months);
  
  // IPCA+ (usando taxa fixa de 5.5% + IPCA)
  const ipcaPlusRate = ipcaRate + 5.5;
  const ipcaMonthlyRate = Math.pow(1 + ipcaPlusRate / 100, 1 / 12) - 1;
  const ipcaFinal = initialAmount * Math.pow(1 + ipcaMonthlyRate, months);
  const ipcaProfit = ipcaFinal - initialAmount;
  const ipcaIR = calculateIR(ipcaProfit, months);
  
  return [
    {
      name: 'Poupança',
      grossReturn: Math.round(poupancaFinal * 100) / 100,
      netReturn: Math.round(poupancaFinal * 100) / 100,
      irAmount: 0,
      effectiveRate: Math.round((poupancaProfit / initialAmount) * 100 * 100) / 100
    },
    {
      name: 'CDB 100% CDI',
      grossReturn: Math.round(cdbFinal * 100) / 100,
      netReturn: Math.round((cdbFinal - cdbIR) * 100) / 100,
      irAmount: Math.round(cdbIR * 100) / 100,
      effectiveRate: Math.round(((cdbProfit - cdbIR) / initialAmount) * 100 * 100) / 100
    },
    {
      name: 'Tesouro Selic',
      grossReturn: Math.round(tesouroFinal * 100) / 100,
      netReturn: Math.round((tesouroFinal - tesouroIR) * 100) / 100,
      irAmount: Math.round(tesouroIR * 100) / 100,
      effectiveRate: Math.round(((tesouroProfit - tesouroIR) / initialAmount) * 100 * 100) / 100
    },
    {
      name: 'IPCA+ 5.5%',
      grossReturn: Math.round(ipcaFinal * 100) / 100,
      netReturn: Math.round((ipcaFinal - ipcaIR) * 100) / 100,
      irAmount: Math.round(ipcaIR * 100) / 100,
      effectiveRate: Math.round(((ipcaProfit - ipcaIR) / initialAmount) * 100 * 100) / 100
    }
  ];
}

// Calculadora de Aporte Mensal Ideal
export interface MonthlyContributionResult {
  monthlyContribution: number;
  totalInvested: number;
  totalInterest: number;
  finalAmount: number;
}

export function calculateMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  months: number,
  annualRate: number
): MonthlyContributionResult {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  
  // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
  // Solving for PMT:
  // PMT = (FV - PV * (1 + r)^n) * r / ((1 + r)^n - 1)
  
  const futureValueOfCurrent = currentAmount * Math.pow(1 + monthlyRate, months);
  const remaining = targetAmount - futureValueOfCurrent;
  
  if (remaining <= 0) {
    return {
      monthlyContribution: 0,
      totalInvested: currentAmount,
      totalInterest: futureValueOfCurrent - currentAmount,
      finalAmount: futureValueOfCurrent
    };
  }
  
  const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  const monthlyContribution = remaining / factor;
  
  const totalInvested = currentAmount + (monthlyContribution * months);
  
  return {
    monthlyContribution: Math.round(monthlyContribution * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalInterest: Math.round((targetAmount - totalInvested) * 100) / 100,
    finalAmount: targetAmount
  };
}

// Formatação de moeda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formatação de percentual
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
