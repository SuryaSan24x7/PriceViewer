"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import { fetchBtcFiatPrices } from "@/lib/api"
import { useState, useEffect } from "react"

interface Transaction {
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

interface TransactionDetailsModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export function TransactionDetailsModal({ transaction, isOpen, onClose }: TransactionDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string>("")
  const [fiatPrices, setFiatPrices] = useState<{ [key: string]: number } | null>(null)
  const [loadingFiat, setLoadingFiat] = useState(false)

  useEffect(() => {
    if (isOpen && transaction) {
      const fetchFiatPrices = async () => {
        setLoadingFiat(true)
        try {
          const data = await fetchBtcFiatPrices()
          setFiatPrices(data.bitcoin)
        } catch (error) {
          console.error("Error fetching fiat prices:", error)
          setFiatPrices(null)
        } finally {
          setLoadingFiat(false)
        }
      }
      fetchFiatPrices()
    }
  }, [isOpen, transaction])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(""), 2000)
  }

  if (!transaction) return null

  const isConfirmed = transaction.status?.confirmed ?? false
  const confirmationTime = transaction.status?.block_time
    ? new Date(transaction.status.block_time * 1000).toLocaleString()
    : "Pending"

  const feeInBtc = transaction.fee / 1e8

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg">Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">Transaction ID (TXID)</label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <code className="flex-1 text-xs break-all text-muted-foreground">{transaction.txid}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(transaction.txid, "txid")}
                className="h-8 w-8 p-0"
              >
                {copiedField === "txid" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
              <a
                href={`https://mempool.space/tx/${transaction.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">Status</label>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={isConfirmed ? "default" : "secondary"} className={isConfirmed ? "bg-green-700" : "bg-yellow-700"}>
                {isConfirmed ? "Confirmed" : "Pending"}
              </Badge>
              {isConfirmed && transaction.status?.block_height && (
                <Badge variant="outline" className="border-border">
                  {transaction.status.block_height} blocks
                </Badge>
              )}
            </div>
            {isConfirmed && <p className="text-xs text-muted-foreground">Confirmed: {confirmationTime}</p>}
          </div>

          {/* Inputs and Outputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">Inputs</label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold">{transaction.vin_sz}</p>
                <p className="text-xs text-muted-foreground">input{transaction.vin_sz !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">Outputs</label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold">{transaction.vout_sz}</p>
                <p className="text-xs text-muted-foreground">output{transaction.vout_sz !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Fee Information */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-card-foreground">Fee Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Total Fee</p>
                <p className="text-base font-mono font-semibold mt-1">{feeInBtc.toFixed(8)} BTC</p>
                <div className="text-xs text-slate-500 mt-1 space-y-1">
                  {loadingFiat ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading conversions...</span>
                    </div>
                  ) : fiatPrices ? (
                    <>
                      <p>≈ {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(feeInBtc * fiatPrices.usd)}</p>
                      <p>≈ {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(feeInBtc * fiatPrices.inr)}</p>
                      <p>≈ {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(feeInBtc * fiatPrices.eur)}</p>
                      <p>≈ {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(feeInBtc * fiatPrices.gbp)}</p>
                      <p>≈ {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(feeInBtc * fiatPrices.jpy)}</p>
                    </>
                  ) : (
                    <p>Fiat conversion unavailable</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Fee Rate</p>
                <p className="text-base font-mono font-semibold mt-1">
                  {transaction.fee_rate ? transaction.fee_rate.toFixed(2) : "N/A"} sat/vB
                </p>
                <p className="text-xs text-slate-500">
                  {transaction.fee_rate == null ? "" : transaction.fee_rate < 10 ? "Low" : transaction.fee_rate < 50 ? "Medium" : "High"}
                </p>
              </div>
            </div>
          </div>

          {/* Size and Weight */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-card-foreground">Transaction Size</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Size (bytes)</p>
                <p className="text-base font-mono font-semibold mt-1">{transaction.size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight (WU)</p>
                <p className="text-base font-mono font-semibold mt-1">{transaction.weight}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">vSize: {Math.ceil(transaction.weight / 4)} vB</p>
          </div>

          {/* Block Information */}
          {isConfirmed && transaction.status?.block_hash && (
            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-sm font-semibold text-card-foreground">Block Hash</label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <code className="flex-1 text-xs break-all text-muted-foreground">{transaction.status.block_hash}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.status?.block_hash || "", "blockhash")}
                  className="h-8 w-8 p-0"
                >
                  {copiedField === "blockhash" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
            <a
              href={`https://mempool.space/tx/${transaction.txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full border-border bg-transparent">
                View on Mempool
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
