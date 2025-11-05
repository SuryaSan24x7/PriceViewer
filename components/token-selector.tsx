"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const NETWORKS = [
  { name: "Bitcoin", id: "bitcoin", icon: "₿" },
  { name: "Ethereum", id: "ethereum", icon: "Ξ" },
  { name: "Solana", id: "solana", icon: "◎" },
]

interface TokenSelectorProps {
  selectedNetwork: string
  onSelectNetwork: (networkId: string) => void
}

export function TokenSelector({ selectedNetwork, onSelectNetwork }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        className="gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg">{NETWORKS.find((n) => n.id === selectedNetwork)?.icon}</span>
        <span>{NETWORKS.find((n) => n.id === selectedNetwork)?.name}</span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 rounded-xl border border-border bg-card/50 backdrop-blur shadow-2xl shadow-primary/20 z-50 overflow-hidden">
          {NETWORKS.map((network) => (
            <button
              key={network.id}
              onClick={() => {
                onSelectNetwork(network.id)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all ${
                selectedNetwork === network.id
                  ? "bg-gradient-to-r from-orange-600/20 to-yellow-600/20 text-orange-300 border-l-2 border-orange-500"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <span className="text-lg">{network.icon}</span>
              {network.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
