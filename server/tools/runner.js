import {
  assessInvestmentRedFlags,
  calculateLoan,
  checkInvestmentCompany,
  getFraudReportGuide,
} from './vnansial.js'
import {
  replizListAccounts,
  replizListSchedules,
  replizScheduleLiteracyPost,
} from './repliz.js'

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
    case 'repliz_list_accounts':
      return replizListAccounts(args)
    case 'repliz_list_schedules':
      return replizListSchedules(args)
    case 'repliz_schedule_literacy_post':
      return replizScheduleLiteracyPost(args)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
