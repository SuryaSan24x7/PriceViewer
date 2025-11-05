"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, XAxis, LineChart, Line } from "recharts"
import { fetchBtcMarketData, fetchBTCPriceChart } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface BtcData {
  prices: { [key: string]: number }
  change1h: number
  change24h: number
  change7d: number
}

interface HistoricalData {
  time: string
  price: number
}

const ChangeBadge = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
      {value.toFixed(2)}%
    </span>
  </div>
)

export function BitcoinPriceTicker() {
  const [btcData, setBtcData] = useState<BtcData | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCurrency, setDisplayCurrency] = useState("usd")

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        // Fetch both market and chart data in parallel for faster loading
        const [marketData, chartData] = await Promise.all([fetchBtcMarketData(), fetchBTCPriceChart("usd", "1")])

        if (marketData && marketData.bitcoin) {
          const btc = marketData.bitcoin
          setBtcData({
            prices: { usd: btc.usd, eur: btc.eur, gbp: btc.gbp, jpy: btc.jpy, inr: btc.inr, cad: btc.cad, aud: btc.aud, chf: btc.chf, cny: btc.cny },
            change1h: 0, // 1h and 7d change not available in /simple/price, can be added back if needed
            change24h: btc.usd_24h_change,
            change7d: 0,
          })
        }

        if (chartData && chartData.prices) {
          setHistoricalData(
            chartData.prices.map((item: [number, number]) => ({
              time: new Date(item[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              price: item[1],
            })),
          )
        }
      } catch (error) {
        console.error("Failed to fetch Bitcoin data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()

    // Interval to fetch only the latest price and update the chart
    const interval = setInterval(async () => {
      try {
        const marketData = await fetchBtcMarketData()

        if (marketData && marketData.bitcoin) {
          const btc = marketData.bitcoin
          setBtcData({
            prices: { usd: btc.usd, eur: btc.eur, gbp: btc.gbp, jpy: btc.jpy, inr: btc.inr, cad: btc.cad, aud: btc.aud, chf: btc.chf, cny: btc.cny },
            change1h: 0,
            change24h: btc.usd_24h_change,
            change7d: 0,
          })

          // Append new data point and remove the oldest one
          setHistoricalData((prevData) => {
            const newDataPoint = {
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              price: btc.usd, // Chart will always be in USD for consistency
            }
            // Keep the chart window from growing indefinitely
            return [...prevData.slice(1), newDataPoint]
          })
        }
      } catch (error) {
        console.error("Failed to update Bitcoin price:", error)
      }
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(interval) // Cleanup interval on component unmount
  }, [])

  if (loading && !btcData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded-lg"></div>
        </CardContent>
      </Card>
    )
  }

  if (!btcData) return null

  const isPositive24h = btcData.change24h >= 0

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Bitcoin (BTC)</CardTitle>
            <CardDescription className="text-4xl font-bold text-foreground mt-2">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: displayCurrency.toUpperCase(),
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(btcData.prices[displayCurrency])}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="w-[80px] h-8 text-xs bg-background/50 border-border">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(btcData.prices).map((curr) => (
                    <SelectItem key={curr} value={curr} className="text-xs">
                      {curr.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center text-lg font-bold ${isPositive24h ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive24h ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
              {btcData.change24h.toFixed(2)}% (24h)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ChartContainer
            config={{
              price: {
                label: "Price",
                color: isPositive24h ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))",
              },
            }}
          >
            <LineChart
              accessibilityLayer
              data={historicalData}
              margin={{ left: 12, right: 12, top: 10 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={8}
                hide
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
              <Line dataKey="price" type="natural" stroke="var(--color-price)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}