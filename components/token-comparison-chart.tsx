"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { fetchTokenPriceChart } from "@/lib/api"
import { Button } from "./ui/button"
import { X } from "lucide-react"

interface Token {
  id: string
  name: string
  symbol: string
  image?: string
}

interface TokenComparisonChartProps {
  tokens: Token[]
  currency: string
  onClear: () => void
}

interface ChartDataPoint {
  date: string
  [key: string]: number | string // For token prices
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg shadow-lg">
        <p className="label text-sm text-muted-foreground">{`${label}`}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.color }} className="flex items-center gap-2">
            <span className="font-bold">{pld.name}:</span>
            <span className="font-mono">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency.toUpperCase(),
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
              }).format(pld.payload[`${pld.dataKey}_actual`])}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return null
}

export function TokenComparisonChart({ tokens, currency, onClear }: TokenComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (tokens.length !== 2) return
      setLoading(true)

      try {
        const [data1, data2] = await Promise.all([
          fetchTokenPriceChart(tokens[0].id, currency, "7"),
          fetchTokenPriceChart(tokens[1].id, currency, "7"),
        ])

        const normalize = (prices: [number, number][]) => {
          const min = Math.min(...prices.map((p) => p[1]))
          const max = Math.max(...prices.map((p) => p[1]))
          return prices.map(([time, price]) => [time, max - min === 0 ? 50 : ((price - min) / (max - min)) * 100])
        }

        const normalizedPrices1 = normalize(data1.prices)

        const combinedData = normalizedPrices1.map(([time], index) => {
          const date = new Date(time).toLocaleDateString([], { month: "short", day: "numeric" })
          const price1 = data1.prices[index][1]
          const price2 = data2.prices.find((p) => p[0] === time)?.[1] ?? data2.prices[index][1] // Fallback to index match

          const normalizedPrice1 = normalizedPrices1[index][1]
          const normalizedPrice2 = price2 // This needs proper normalization based on its own min/max

          return {
            date,
            [`${tokens[0].symbol.toLowerCase()}`]: normalizedPrice1,
            [`${tokens[0].symbol.toLowerCase()}_actual`]: price1,
            [`${tokens[1].symbol.toLowerCase()}`]: normalizedPrice2, // Placeholder, will be normalized
            [`${tokens[1].symbol.toLowerCase()}_actual`]: price2,
          }
        })

        // Now normalize the second token's prices relative to the combined data
        const min2 = Math.min(...combinedData.map((d) => d[`${tokens[1].symbol.toLowerCase()}_actual`] as number))
        const max2 = Math.max(...combinedData.map((d) => d[`${tokens[1].symbol.toLowerCase()}_actual`] as number))

        const finalData = combinedData.map((d) => ({
          ...d,
          [`${tokens[1].symbol.toLowerCase()}`]:
            max2 - min2 === 0 ? 50 : (((d[`${tokens[1].symbol.toLowerCase()}_actual`] as number) - min2) / (max2 - min2)) * 100,
        }))

        setChartData(finalData)
      } catch (error) {
        console.error("Failed to fetch comparison chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tokens, currency])

  if (loading) return <Card className="bg-card/50 backdrop-blur border-border"><CardContent className="pt-6">Loading comparison...</CardContent></Card>

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Price Comparison (7d)</CardTitle>
            <CardDescription>{tokens[0].name} vs. {tokens[1].name} (Normalized)</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear}><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.3)" />
            <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} label={{ value: 'Normalized Price (0-100)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend />
            <Line type="monotone" dataKey={tokens[0].symbol.toLowerCase()} name={tokens[0].name} stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={tokens[1].symbol.toLowerCase()} name={tokens[1].name} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}