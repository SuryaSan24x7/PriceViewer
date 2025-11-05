"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { BitcoinPriceTicker } from "./btc-price-ticker"
import { BitcoinPriceChart } from "./btc-price-chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { fetchTopTokens } from "@/lib/api"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { TokenComparisonChart } from "./token-comparison-chart"
import { Button } from "@/components/ui/button" // Added Button import

interface PriceData {
  id: string
  symbol: string
  name: string
  price: number
  market_cap?: number
  volume?: number
  image?: string
  price_change_percentage_24h_in_currency?: number
  sparkline_in_7d?: { price: number[] }
}

export function PriceOverview() {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [filteredPrices, setFilteredPrices] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currency, setCurrency] = useState("btc")
  const [currentPage, setCurrentPage] = useState(1)
  const [comparisonTokens, setComparisonTokens] = useState<PriceData[]>([])
  const itemsPerPage = 12 // 4 rows of 3 cards

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        if (prices.length === 0) setLoading(true)
        setError("")

        const data = await fetchTopTokens(currency)

        const priceArray: PriceData[] = data.map((token: any) => ({
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          price: token.current_price,
          price_change_percentage_24h_in_currency: token.price_change_percentage_24h_in_currency,
          image: token.image,
          market_cap: token.market_cap,
          volume: token.total_volume,
          sparkline_in_7d: token.sparkline_in_7d,
        }))

        // Filter out Bitcoin itself from the list as it has a dedicated ticker
        setPrices(priceArray)
      } catch (err) {
        setError("Unable to fetch prices. Check your connection.")
        console.error("[PriceOverview] Current price fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 60000) // Refresh every 60 seconds
    return () => clearInterval(interval)
  }, [currency])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPrices(prices)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredPrices(
        prices.filter((p) => p.name.toLowerCase().includes(query) || p.symbol.toLowerCase().includes(query)),
      )
    }
    setCurrentPage(1) // Reset to first page on search or currency change
  }, [searchQuery, prices, currency])

  // Pagination logic
  const totalPages = Math.ceil(filteredPrices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPrices = filteredPrices.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCompareClick = (token: PriceData) => {
    setComparisonTokens((prev) => {
      if (prev.find((t) => t.id === token.id)) {
        // Deselect if already selected
        return prev.filter((t) => t.id !== token.id)
      }
      if (prev.length < 2) {
        // Add to comparison if less than 2 are selected
        return [...prev, token]
      }
      return prev // Otherwise do nothing
    })
  }

  if (loading && prices.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/50">
        <CardContent className="pt-6 text-center text-red-300">{error}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <BitcoinPriceTicker />
      <ChartContainer config={{}}>
        <BitcoinPriceChart />
      </ChartContainer>

      {comparisonTokens.length === 2 && (
        <TokenComparisonChart tokens={comparisonTokens} currency={currency} onClear={() => setComparisonTokens([])} />
      )}


      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-background/50 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[100px] bg-background/50 border-border rounded-xl">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="btc">BTC</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="jpy">JPY</SelectItem>
                <SelectItem value="inr">INR</SelectItem>
                <SelectItem value="cad">CAD</SelectItem>
                <SelectItem value="aud">AUD</SelectItem>
                <SelectItem value="chf">CHF</SelectItem>
                <SelectItem value="cny">CNY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Top 100 Market Overview (vs. {currency.toUpperCase()})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrices.length === 0 ? (
              <Card className="col-span-full bg-card/30 border-border">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery
                    ? "No tokens match your search"
                    : "Loading market data..."}
                </CardContent>
              </Card>
            ) : (
              paginatedPrices.map((asset) => (
                <Card
                  key={asset.id}
                  className="bg-gradient-to-br from-card/50 to-card/30 border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 backdrop-blur"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={asset.image} alt={asset.name} className="w-6 h-6 rounded-full" />
                        <CardTitle className="text-sm font-semibold">{asset.name}</CardTitle>
                      </div>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md">
                        {asset.symbol}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={comparisonTokens.find((t) => t.id === asset.id) ? "default" : "outline"}
                      className="absolute top-2 right-2 h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompareClick(asset)
                      }}
                      disabled={comparisonTokens.length >= 2 && !comparisonTokens.find((t) => t.id === asset.id)}
                    >
                      {comparisonTokens.find((t) => t.id === asset.id) ? "Selected" : "Compare"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {currency === "btc"
                          ? asset.price.toLocaleString("en-US", { maximumFractionDigits: 8 })
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(asset.price)}
                        {currency !== "btc" && <span className="text-lg ml-1">{currency.toUpperCase()}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {asset.price_change_percentage_24h_in_currency && asset.price_change_percentage_24h_in_currency >= 0 ? (
                        <>
                          <div className="flex items-center gap-1 text-emerald-400 font-bold">
                            <TrendingUp className="w-4 h-4" />
                            {asset.price_change_percentage_24h_in_currency.toFixed(2)}%
                          </div>
                        </>
                      ) : asset.price_change_percentage_24h_in_currency ? (
                        <>
                          <div className="flex items-center gap-1 text-red-400 font-bold">
                            <TrendingDown className="w-4 h-4" />
                            {asset.price_change_percentage_24h_in_currency.toFixed(2)}%
                          </div>
                        </>
                      ) : null}
                      <span className="text-xs text-muted-foreground ml-auto">24h</span>
                    </div>
                    {asset.market_cap && (
                      <div className="text-xs text-muted-foreground pt-3 border-t border-border space-y-1 tabular-nums">
                        <p>Cap: {asset.market_cap.toLocaleString("en-US")} {currency.toUpperCase()}</p>
                        {asset.volume && <p>Vol: {asset.volume.toLocaleString("en-US")} {currency.toUpperCase()}</p>}
                      </div>
                    )}
                    {asset.sparkline_in_7d && (
                      <div className="h-[50px] w-full mt-4 -ml-4">
                        <ChartContainer
                          config={{
                            price: {
                              label: asset.symbol,
                              color:
                                asset.price_change_percentage_24h_in_currency != null &&
                                asset.price_change_percentage_24h_in_currency >= 0
                                  ? "hsl(var(--chart-1))"
                                  : "hsl(var(--chart-2))",
                            },
                          }}
                          className="w-full h-full"
                        >
                          <LineChart
                            accessibilityLayer
                            data={asset.sparkline_in_7d.price.map((price, index) => ({ index, price }))}
                            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                          >
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel indicator="line" />}
                            />
                            <Line
                              dataKey="price"
                              type="natural"
                              stroke="var(--color-price)"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ChartContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={() => handlePageChange(currentPage - 1)} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>
                    Page {currentPage} of {totalPages}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" onClick={() => handlePageChange(currentPage + 1)} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  )
}