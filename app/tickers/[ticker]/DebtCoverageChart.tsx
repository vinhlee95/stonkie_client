import FinancialChart from "@/app/components/FinancialChart";
import { AnnualFinancialStatement } from "@/app/types";

export default async function DebtCoverageChart({balanceSheet, cashFlow}: {balanceSheet: AnnualFinancialStatement[], cashFlow: AnnualFinancialStatement[]}) {
  // Sort statements by year in ascending order
  const sortedBalanceSheet = [...balanceSheet].filter(item => !!item.data).sort((a, b) => a.period_end_year - b.period_end_year);
  const sortedCashFlow = [...cashFlow].sort((a, b) => a.period_end_year - b.period_end_year);
  
  // Find keys from the first statement (should be consistent across years)
  const firstBalanceSheet = sortedBalanceSheet[0];
  const firstCashFlow = sortedCashFlow[0];

  const totalDebtKey = Object.keys(firstBalanceSheet.data).find(key => 
    key.toLowerCase().includes('total debt')
  );

  const cashKey = Object.keys(firstBalanceSheet.data).find(key => 
    key.toLowerCase() === 'cash'
  );

  const cashEquivalentsKey = Object.keys(firstBalanceSheet.data).find(key => 
    key.toLowerCase() === 'cash equivalents'
  );

  const cashAndCashEquivalentsKey = Object.keys(firstBalanceSheet.data).find(key => 
    key.toLowerCase().includes('cash and cash')
  );

  const freeCashFlowKey = Object.keys(firstCashFlow.data).find(key => 
    key.toLowerCase().includes('free cash flow')
  );

  if (!totalDebtKey || !freeCashFlowKey) return null;

  const years = sortedBalanceSheet.map(statement => 
    statement.is_ttm ? 'TTM' : statement.period_end_year.toString()
  );

  const datasets = [
    {
      type: 'bar' as const,
      label: 'Total Debt',
      data: sortedBalanceSheet.map(statement => 
        parseFloat((statement.data[totalDebtKey] ? statement.data[totalDebtKey]*1000 : 0).toString())
      ),
      backgroundColor: '#4287f5',
      borderColor: '#4287f5',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar' as const,
      label: 'Free Cash Flow',
      data: sortedCashFlow.map(statement => 
        parseFloat((statement.data[freeCashFlowKey] ? statement.data[freeCashFlowKey]*1000 : 0).toString())
      ),
      backgroundColor: '#63e6e2',
      borderColor: '#63e6e2',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar' as const,
      label: 'Cash and Cash Equivalents',
      data: sortedBalanceSheet.map(statement => {
        if (cashAndCashEquivalentsKey) {
          return parseFloat((statement.data[cashAndCashEquivalentsKey] ? statement.data[cashAndCashEquivalentsKey]*1000 : 0).toString());
        }
        if (cashKey && cashEquivalentsKey) {
          const cash = parseFloat((statement.data[cashKey] ?? 0).toString());
          const equivalents = parseFloat((statement.data[cashEquivalentsKey] ?? 0).toString());
          return cash + equivalents;
        }
        return 0;
      }),
      backgroundColor: '#ff9f40',
      borderColor: '#ff9f40',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    }
  ];

  return (
    <FinancialChart
      title="Debt and Coverage"
      labels={years}
      datasets={datasets}
      yAxisConfig={{ formatAsCurrency: true }}
    />
  );
}