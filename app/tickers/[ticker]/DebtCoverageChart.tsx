import ChartWithPeriod from "@/app/components/FinancialChart";
import { AnnualFinancialStatement, FinancialStatement, isAnnualStatement, isQuarterlyStatement, QuarterlyFinancialStatement} from "@/app/types";
import { ChartDataOutput, ChartDatasetDefinition, parseFinancialValue, processAnnualStatements, processQuarterlyStatements } from "./chartUtils";

function getChartDataset(
  balanceSheets: Array<FinancialStatement>,
  cashFlows: Array<FinancialStatement>
): ChartDataOutput {
  if ((!balanceSheets || balanceSheets.length === 0) && (!cashFlows || cashFlows.length === 0)) {
    return { labels: [], datasets: [] };
  }

  let sortedBalanceSheets: AnnualFinancialStatement[] | QuarterlyFinancialStatement[];
  let sortedCashFlows: AnnualFinancialStatement[] | QuarterlyFinancialStatement[];
  let generatedLabels: string[];

  // Assuming balanceSheets and cashFlows will always be of the same type (Annual or Quarterly)
  // and have corresponding entries.
  if (isAnnualStatement(balanceSheets[0] ?? cashFlows[0])) {
    const { generatedLabels: annualLabelsBS, sortedStatements: annualSortedBS } = processAnnualStatements(balanceSheets as AnnualFinancialStatement[]);
    const { sortedStatements: annualSortedCF } = processAnnualStatements(cashFlows as AnnualFinancialStatement[]);
    generatedLabels = annualLabelsBS;
    sortedBalanceSheets = annualSortedBS;
    sortedCashFlows = annualSortedCF;
  } else if (isQuarterlyStatement(balanceSheets[0] ?? cashFlows[0])) {
    const { generatedLabels: quarterlyLabelsBS, sortedStatements: quarterlySortedBS } = processQuarterlyStatements(balanceSheets as QuarterlyFinancialStatement[]);
    const { sortedStatements: quarterlySortedCF } = processQuarterlyStatements(cashFlows as QuarterlyFinancialStatement[]);
    generatedLabels = quarterlyLabelsBS;
    sortedBalanceSheets = quarterlySortedBS;
    sortedCashFlows = quarterlySortedCF;
  } else {
    console.error("Unknown or mixed statement types in getChartDataset", balanceSheets[0] ?? cashFlows[0]);
    return { labels: [], datasets: [] };
  }

  const firstBalanceSheetData = sortedBalanceSheets[0]?.data;
  const firstCashFlowData = sortedCashFlows[0]?.data;

  if (!firstBalanceSheetData || !firstCashFlowData) return { labels: generatedLabels, datasets: [] };

  const totalDebtKey = Object.keys(firstBalanceSheetData).find(key =>
    key.toLowerCase().includes('total debt')
  );
  const cashKey = Object.keys(firstBalanceSheetData).find(key =>
    key.toLowerCase() === 'cash'
  );
  const cashEquivalentsKey = Object.keys(firstBalanceSheetData).find(key =>
    key.toLowerCase() === 'cash equivalents'
  );
  const cashAndCashEquivalentsKey = Object.keys(firstBalanceSheetData).find(key =>
    key.toLowerCase().includes('cash and cash')
  );
  const freeCashFlowKey = Object.keys(firstCashFlowData).find(key =>
    key.toLowerCase().includes('free cash flow')
  );

  if (!totalDebtKey || !freeCashFlowKey) {
    console.warn("Total Debt or Free Cash Flow key not found in statement data.");
    return { labels: generatedLabels, datasets: [] };
  }

  const datasets: ChartDatasetDefinition[] = [
    {
      type: 'bar' as const,
      label: 'Total Debt',
      data: sortedBalanceSheets.map(statement =>
        parseFinancialValue(statement.data[totalDebtKey!]) * 1000
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
      data: sortedCashFlows.map(statement =>
        parseFinancialValue(statement.data[freeCashFlowKey!]) * 1000
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
      data: sortedBalanceSheets.map(statement => {
        if (cashAndCashEquivalentsKey && statement.data[cashAndCashEquivalentsKey]) {
          return parseFinancialValue(statement.data[cashAndCashEquivalentsKey]) * 1000;
        }
        if (cashKey && cashEquivalentsKey && statement.data[cashKey] && statement.data[cashEquivalentsKey]) {
          const cash = parseFinancialValue(statement.data[cashKey]);
          const equivalents = parseFinancialValue(statement.data[cashEquivalentsKey]);
          return (cash + equivalents) * 1000;
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
  return { labels: generatedLabels, datasets };
}

export default async function DebtCoverageChart({balanceSheet: annualBalanceSheet, cashFlow: annualCashFlow, ticker}: {balanceSheet: AnnualFinancialStatement[], cashFlow: AnnualFinancialStatement[], ticker: string}) {
  // Fetch quarterly data
  const quarterlyBalanceSheetResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=balance_sheet&period_type=quarterly`, {
    next: {revalidate: 15*60}
  });
  const quarterlyCashFlowResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=cash_flow&period_type=quarterly`, {
    next: {revalidate: 15*60}
  });

  const quarterlyBalanceSheetData = await quarterlyBalanceSheetResponse.json() as QuarterlyFinancialStatement[];
  const quarterlyCashFlowData = await quarterlyCashFlowResponse.json() as QuarterlyFinancialStatement[];

  const annualData = getChartDataset(annualBalanceSheet, annualCashFlow);
  const quarterlyData = getChartDataset(quarterlyBalanceSheetData, quarterlyCashFlowData);

  if (!annualData.datasets.length && !quarterlyData.datasets.length) return null;

  return (
    <ChartWithPeriod
      title="Debt and Coverage"
      labels={annualData.labels}
      datasets={annualData.datasets}
      quaterlyDatasets={quarterlyData.datasets}
      quarterlyLabels={quarterlyData.labels}
      yAxisConfig={{ formatAsCurrency: true }}
    />
  );
}