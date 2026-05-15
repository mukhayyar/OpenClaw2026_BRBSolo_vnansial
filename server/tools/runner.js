import {
  assessInvestmentRedFlags,
  calculateLoan,
  checkInvestmentCompany,
  getFraudReportGuide,
} from './vnansial.js'
import {
  getMarketQuote,
  searchMarketSymbols,
  calculateInvestmentGoal,
  suggestAssetAllocation,
} from './market.js'

export async function runTool(name, args) {
  switch (name) {
    case 'check_investment_company':
      return checkInvestmentCompany(args)
    case 'calculate_loan':
      return calculateLoan(args)
    case 'assess_investment_red_flags':
      return assessInvestmentRedFlags(args)
    case 'get_fraud_report_guide':
      return getFraudReportGuide()
    case 'get_market_quote':
      return getMarketQuote(args)
    case 'search_market_symbols':
      return searchMarketSymbols(args)
    case 'calculate_investment_goal':
      return calculateInvestmentGoal(args)
    case 'suggest_asset_allocation':
      return suggestAssetAllocation(args)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
