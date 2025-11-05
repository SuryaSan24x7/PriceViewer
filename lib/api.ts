import type { Transaction } from "@/components/transaction-tracker"

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3"
const MEMPOOL_API_BASE = "https://mempool.space/api"

/**
 * A generic helper function to fetch data from an API and handle errors.
 * @param url The URL to fetch.
 * @returns The JSON response as a promise.
 */
async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const errorInfo = await response.text()
    throw new Error(`API call to ${url} failed: ${response.statusText} - ${errorInfo}`)
  }
  return response.json() as Promise<T>
}

// --- CoinGecko API Calls ---

/**
 * Fetches Bitcoin's price in multiple fiat currencies and its 24h change.
 */
export async function fetchBtcMarketData() {
  const currencies = "usd,eur,gbp,jpy,inr,cad,aud,chf,cny"
  return fetchApi<{ bitcoin: { [key: string]: number } }>(
    `${COINGECKO_API_BASE}/simple/price?ids=bitcoin&vs_currencies=${currencies}&include_24hr_change=true`,
  )
}

/**
 * Fetches Bitcoin's historical price data for a given currency and timeframe.
 * @param currency The currency to get the prices in (e.g., 'usd').
 * @param days The number of days to fetch data for.
 */
export async function fetchBTCPriceChart(currency: string, days: string) {
  return fetchApi<{ prices: [number, number][] }>(
    `${COINGECKO_API_BASE}/coins/bitcoin/market_chart?vs_currency=${currency}&days=${days}`
  );
}

/**
 * Fetches a token's historical price data for a given currency and timeframe.
 * @param tokenId The coingecko id of the token (e.g., 'ethereum').
 * @param currency The currency to get the prices in (e.g., 'usd').
 * @param days The number of days to fetch data for.
 */
export async function fetchTokenPriceChart(tokenId: string, currency: string, days: string) {
  return fetchApi<{ prices: [number, number][] }>(
    `${COINGECKO_API_BASE}/coins/${tokenId}/market_chart?vs_currency=${currency}&days=${days}`,
  )
}
/**
 * Fetches the top 100 tokens by market cap in a specified currency.
 * @param currency The currency to get the prices in (e.g., 'btc', 'usd').
 */
export async function fetchTopTokens(currency: string) {
  const currencies = "btc,usd,eur,gbp,jpy,inr,cad,aud,chf,cny"
  return fetchApi<any[]>(
    `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h&ids=`,
  )
}

/**
 * Fetches Bitcoin's price in major fiat currencies.
 */
export async function fetchBtcFiatPrices() {
  const currencies = "usd,eur,gbp,jpy,inr"
  return fetchApi<{ bitcoin: { [key: string]: number } }>(
    `${COINGECKO_API_BASE}/simple/price?ids=bitcoin&vs_currencies=${currencies}`,
  )
}

// --- Mempool.space API Calls ---

/**
 * Fetches current statistics from the Bitcoin mempool.
 */
export async function fetchMempoolStats() {
  return fetchApi<any>(`${MEMPOOL_API_BASE}/mempool`)
}

/**
 * Fetches the hash of the latest confirmed Bitcoin block.
 */
export async function fetchLatestBlockHash() {
  const response = await fetch(`${MEMPOOL_API_BASE}/blocks/tip/hash`)
  if (!response.ok) throw new Error("Failed to fetch latest block hash")
  return response.text()
}

export async function fetchBlockTxids(blockHash: string) {
  return fetchApi<string[]>(`${MEMPOOL_API_BASE}/block/${blockHash}/txids`)
}

export async function fetchTransactionDetails(txid: string) {
  return fetchApi<Transaction>(`${MEMPOOL_API_BASE}/tx/${txid}`)
}