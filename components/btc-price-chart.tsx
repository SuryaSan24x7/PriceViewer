
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchBTCPriceChart } from "@/lib/api"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface ChartData {
  date: string
  price: number
}

export function BitcoinPriceChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeframe, setTimeframe] = useState("90") // Default to 90 days
  const [currency, setCurrency] = useState("usd")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError("")
        const data = await fetchBTCPriceChart(currency, timeframe)
        const formattedData = data.prices.map((p: [number, number]) => ({
          date: new Date(p[0]).toLocaleDateString(),
          price: p[1],
        }))
        setChartData(formattedData)
      } catch (err) {
        setError("Unable to fetch chart data.")
        console.error("[BitcoinPriceChart] Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currency, timeframe])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Bitcoin (BTC) Price Chart</CardTitle>
            <CardDescription>Price history vs {currency.toUpperCase()}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1D</SelectItem>
                <SelectItem value="7">7D</SelectItem>
                <SelectItem value="30">30D</SelectItem>
                <SelectItem value="90">90D</SelectItem>
                <SelectItem value="365">1Y</SelectItem>
                <SelectItem value="max">Max</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="jpy">JPY</SelectItem>
                <SelectItem value="inr">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p>Loading chart...</p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400">
            <p>{error}</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              price: {
                label: "Price",
                color: "hsl(var(--chart-1))",
              },
            }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    valueFormatter={(value) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: currency.toUpperCase(),
                      }).format(value as number)
                    }
                  />
                }
              />
              <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
