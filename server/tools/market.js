import { getQuote, searchSymbols, getHistorical } from '../lib/yahoo.js'
import { calculateInvestmentGoal, suggestAssetAllocation } from './planner.js'

export async function getMarketQuote({ symbol }) {
  return getQuote(symbol)
}

export async function searchMarketSymbols({ query }) {
  return searchSymbols(query)
}

export async function getMarketHistorical({ symbol, range }) {
  return getHistorical(symbol, range)
}

export { calculateInvestmentGoal, suggestAssetAllocation }
