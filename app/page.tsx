"use client"

import { PriceOverview } from "@/components/price-overview"
import { TransactionTracker } from "@/components/transaction-tracker"
import { TokenSelector } from "@/components/token-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

export default function Home() {
  const [selectedNetwork, setSelectedNetwork] = useState("bitcoin") // Default to Bitcoin

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-blue-950/20 to-background text-white">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl sticky top-0 z-40 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-300 bg-clip-text text-transparent">
                BTC Track
              </h1>
              <p className="text-sm text-muted-foreground">Real-time Bitcoin ecosystem monitor</p>
            </div>
            <div className="flex items-center gap-2">
              <TokenSelector selectedNetwork={selectedNetwork} onSelectNetwork={setSelectedNetwork} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Price Dashboard - shows prices against BTC */}
        <PriceOverview />

        {/* Transaction Tracker - network specific */}
        <TransactionTracker selectedNetwork={selectedNetwork} />
      </div>
    </main>
  )
}
