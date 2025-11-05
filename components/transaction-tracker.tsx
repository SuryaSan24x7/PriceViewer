"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchBlockTxids,
  fetchLatestBlockHash,
  fetchMempoolStats,
  fetchTransactionDetails,
} from "@/lib/api"
import { TransactionDetailsModal } from "./transaction-details-modal"

export interface Transaction {
  txid: string
  vin_sz: number
  vout_sz: number
  size: number
  weight: number
  fee: number
  fee_rate: number
  status?: {
    confirmed?: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
}

interface MemPoolStats {
  count: number
  vsize: number
  total_fee: number
}

type SortBy = "fee" | "fee_rate" | "size"

interface TransactionTrackerProps {
  selectedNetwork: string;
}

export function TransactionTracker({ selectedNetwork }: TransactionTrackerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [memPoolStats, setMemPoolStats] = useState<MemPoolStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("fee_rate")
  const [filterConfirmed, setFilterConfirmed] = useState<boolean | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feeRangeFilter, setFeeRangeFilter] = useState<"all" | "low" | "medium" | "high">("all")

  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedNetwork === "bitcoin") {
        try {
          setLoading(true)
          setError("")

          const stats = await fetchMempoolStats()
          setMemPoolStats(stats)

          // Fetch the latest block hash
          const latestBlockHash = await fetchLatestBlockHash()

          // Fetch all transaction IDs for the latest block
          const blockTxids = await fetchBlockTxids(latestBlockHash)

          const txPromises = blockTxids.slice(0, 25).map((txid: string) => fetchTransactionDetails(txid))

          const txResults = await Promise.allSettled(txPromises)
          const validTransactions = txResults
            .filter((result): result is PromiseFulfilledResult<Transaction> => result.status === "fulfilled")
            .map((result) => result.value)

          setTransactions(validTransactions)
        } catch (err) {
          setError("Unable to fetch Bitcoin transactions. Please try again later.")
          console.error("[TransactionTracker] Bitcoin transaction fetch error:", err)
        } finally {
          setLoading(false)
        }
      } else {
        setTransactions([])
        setMemPoolStats(null)
        setLoading(false)
        setError(`Transaction tracking for ${selectedNetwork} is not yet supported with free APIs.`)
      }
    }

    fetchTransactions()
    const interval = setInterval(fetchTransactions, 30000)
    return () => clearInterval(interval)
  }, [selectedNetwork])

  const filteredAndSorted = transactions
    .filter((tx) => {
      if (filterConfirmed !== null) {
        const isConfirmed = tx.status?.confirmed ?? false
        if (isConfirmed !== filterConfirmed) return false
      }

      switch (feeRangeFilter) {
        case "low":
          return tx.fee_rate < 10
        case "medium":
          return tx.fee_rate >= 10 && tx.fee_rate < 50
        case "high":
          return tx.fee_rate >= 50
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "fee_rate":
          return b.fee_rate - a.fee_rate
        case "fee":
          return b.fee - a.fee
        case "size":
          return b.size - a.size
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {selectedNetwork === "bitcoin" ? "Bitcoin Network Activity" : `Transaction Activity (${selectedNetwork})`}
        </h2>

        {memPoolStats && selectedNetwork === "bitcoin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-border backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-300">Pending Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{memPoolStats.count.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-border backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cyan-300">Mempool Size</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{(memPoolStats.vsize / 1e6).toFixed(1)}M</p>
                <p className="text-xs text-cyan-400 mt-1">vBytes</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-border backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-300">Total Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{(memPoolStats.total_fee / 1e8).toFixed(2)}</p>
                <p className="text-xs text-emerald-400 mt-1">BTC</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-card/50 backdrop-blur border-border mb-6">
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Status Filter</span>
                <div className="flex flex-wrap gap-2">
                  {["All", "Confirmed", "Pending"].map((status, idx) => (
                    <Button
                      key={status}
                      size="sm"
                      onClick={() => setFilterConfirmed(idx === 0 ? null : idx === 1)}
                      className={`rounded-lg text-xs font-medium transition-all ${
                        (idx === 0 && filterConfirmed === null) ||
                        (idx === 1 && filterConfirmed === true) ||
                        (idx === 2 && filterConfirmed === false)
                          ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
                          : "bg-card border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Fee Range</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All", val: "all" },
                    { label: "Low < 10", val: "low" },
                    { label: "Medium 10-50", val: "medium" },
                    { label: "High > 50", val: "high" },
                  ].map(({ label, val }) => (
                    <Button
                      key={val}
                      size="sm"
                      onClick={() => setFeeRangeFilter(val as typeof feeRangeFilter)}
                      className={`rounded-lg text-xs font-medium transition-all ${
                        feeRangeFilter === val
                          ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
                          : "bg-card border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground hover:border-border/80"
                >
                  <option value="fee_rate">Fee Rate</option>
                  <option value="fee">Total Fee</option>
                  <option value="size">Size</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-lg">Latest Block Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {error && <p className="text-red-400 text-center py-8">{error}</p>}
              {filteredAndSorted.length === 0 && !error ? (
                <p className="text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
                filteredAndSorted.map((tx) => (
                  <div key={tx.txid}>
                    <div
                      className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-transparent hover:bg-card/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedTransaction(tx)
                        setIsModalOpen(true)
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {tx.status?.confirmed ? (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400">
                              <Check className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">
                              <ArrowUpRight className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-foreground truncate group-hover:text-primary transition">
                            {tx.txid.substring(0, 20)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tx.vin_sz} input{tx.vin_sz !== 1 ? "s" : ""} → {tx.vout_sz} output
                            {tx.vout_sz !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{(tx.fee / 1e8).toFixed(5)} BTC</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.fee_rate ? tx.fee_rate.toFixed(2) : "N/A"} sat/vB
                          </p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {transactions.length > 0 && (
              <div className="flex justify-between items-center mt-6">
                <a
                  href="https://mempool.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View more on Mempool.space →
                </a>
                <span className="text-xs text-muted-foreground">Powered by Mempool.space</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}