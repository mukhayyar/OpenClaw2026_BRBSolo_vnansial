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
import { scoreFinancialHealth } from './health.js'
import {
  getCompanyOverview,
  getDividenTunai,
  getFinancialReport,
  listAllEmiten,
} from '../lib/idx.js'
import { getCoinDetail, assessCryptoRisk } from '../lib/coingecko.js'
import {
  listInsuranceCompanies,
  calculatePremium,
  recommendInsurance,
} from '../lib/insurance.js'
import {
  getUserPortfolio,
  addPortfolioHolding,
  removePortfolioHolding,
  updateMoneyBuffer,
  saveHealthScore,
  listHealthHistory,
} from './portfolio.js'
import { checkBankAccount, checkPhoneNumber } from '../lib/scamCheck.js'
import { renderChart } from './charts.js'
import { createPriceAlert, listUserAlerts, deleteUserAlert } from './alerts.js'
import { askOtherAgent } from './delegate.js'
import { assessDexToken, searchDex } from '../lib/dexscreener.js'
import { createUserReminder, listUserReminders, deleteUserReminder } from './reminders.js'
import {
  getUserDebts, addDebt, updateUserDebt, removeDebt,
  listUserCashflowRules, createUserCashflowRule, toggleUserCashflowRule, deleteUserCashflowRule,
  getTokenWhitepaper, upsertTokenWhitepaper, listTokenWhitepapers,
  analyzeAsset,
} from './finance.js'
import {
  dbListTables, dbDescribeTable, dbExecute,
  installPackage, listInstallablePackages,
} from './admin.js'

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
    case 'score_financial_health':
      return scoreFinancialHealth(args)
    case 'get_idx_company':
      return getCompanyOverview(args?.code)
    case 'get_idx_dividen':
      return getDividenTunai(args?.code, args?.year)
    case 'get_idx_financial':
      return getFinancialReport(args?.code, args?.periode, args?.year)
    case 'list_idx_emiten':
      return listAllEmiten()
    case 'get_crypto_quote':
      return getCoinDetail(args?.id)
    case 'assess_crypto_scam_risk':
      return assessCryptoRisk(args?.id)
    case 'list_insurance_companies':
      return listInsuranceCompanies(args?.type)
    case 'calculate_insurance_premium':
      return calculatePremium(args)
    case 'recommend_insurance':
      return recommendInsurance(args)
    case 'get_user_portfolio':
      return getUserPortfolio(args)
    case 'add_portfolio_holding':
      return addPortfolioHolding(args)
    case 'remove_portfolio_holding':
      return removePortfolioHolding(args)
    case 'update_money_buffer':
      return updateMoneyBuffer(args)
    case 'save_health_score':
      return saveHealthScore(args)
    case 'list_health_history':
      return listHealthHistory(args)
    case 'check_bank_account_report':
      return checkBankAccount(args)
    case 'check_phone_number_report':
      return checkPhoneNumber(args)
    case 'render_chart':
      return renderChart(args)
    case 'create_price_alert':
      return createPriceAlert(args)
    case 'list_price_alerts':
      return listUserAlerts(args)
    case 'delete_price_alert':
      return deleteUserAlert(args)
    case 'ask_other_agent':
      return askOtherAgent(args)
    case 'search_dex_token':
      return searchDex(args?.query)
    case 'assess_dex_token':
      return assessDexToken(args)
    case 'create_reminder':
      return createUserReminder(args)
    case 'list_reminders':
      return listUserReminders(args)
    case 'delete_reminder':
      return deleteUserReminder(args)
    case 'list_debts':
      return getUserDebts(args)
    case 'add_debt':
      return addDebt(args)
    case 'update_debt':
      return updateUserDebt(args)
    case 'remove_debt':
      return removeDebt(args)
    case 'list_cashflow_rules':
      return listUserCashflowRules(args)
    case 'create_cashflow_rule':
      return createUserCashflowRule(args)
    case 'toggle_cashflow_rule':
      return toggleUserCashflowRule(args)
    case 'delete_cashflow_rule':
      return deleteUserCashflowRule(args)
    case 'get_token_whitepaper':
      return getTokenWhitepaper(args)
    case 'upsert_token_whitepaper':
      return upsertTokenWhitepaper(args)
    case 'list_token_whitepapers':
      return listTokenWhitepapers()
    case 'analyze_asset':
      return analyzeAsset(args)
    case 'db_list_tables':
      return dbListTables(args)
    case 'db_describe_table':
      return dbDescribeTable(args)
    case 'db_execute':
      return dbExecute(args)
    case 'install_package':
      return installPackage(args)
    case 'list_installable_packages':
      return listInstallablePackages()
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
