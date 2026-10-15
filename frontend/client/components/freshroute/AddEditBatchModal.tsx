import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton } from "./PrimaryButton";
import type { BackendBatch } from "@/lib/api-client";
import type { InventoryBatch } from "@/lib/inventory-batches";

interface AddEditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (batchData: Partial<BackendBatch>) => Promise<void>;
  initialBatch?: InventoryBatch | null;
}

const COMMODITY_EMOJIS: Record<string, string> = {
  Tomato: "🍅",
  Tomatoes: "🍅",
  Potato: "🥔",
  Potatoes: "🥔",
  Onion: "🧅",
  Onions: "🧅",
  Spinach: "🥬",
  "Spinach (Palak)": "🥬",
  Banana: "🍌",
  "Banana (Grand Naine)": "🍌",
  "Methi Leaves": "🌿",
  Fenugreek: "🌿",
  Mango: "🥭",
  Apple: "🍎",
  Carrot: "🥕",
  Carrots: "🥕",
};

export function AddEditBatchModal({
  isOpen,
  onClose,
  onSave,
  initialBatch,
}: AddEditBatchModalProps) {
  const isEditing = !!initialBatch;

  const [batchCode, setBatchCode] = useState("");
  const [commodity, setCommodity] = useState("Tomato");
  const [quantityKg, setQuantityKg] = useState<number>(1000);
  const [remainingHours, setRemainingHours] = useState<number>(24);
  const [pricePerKg, setPricePerKg] = useState<number>(35);
  const [baseCostPerKg, setBaseCostPerKg] = useState<number>(22);
  const [warehouseId, setWarehouseId] = useState("WH-NORTH-01");
  const [originLocation, setOriginLocation] = useState("Abohar Hub / Fazilka");
  const [emoji, setEmoji] = useState("🍅");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialBatch) {
      setBatchCode(initialBatch.id);
      setCommodity(initialBatch.commodity);
      setQuantityKg(initialBatch.quantityKg);
      setRemainingHours(initialBatch.remainingHours);
      setPricePerKg(initialBatch.pricePerKg);
      setBaseCostPerKg(Math.round(initialBatch.pricePerKg * 0.65));
      setWarehouseId("WH-NORTH-01");
      setOriginLocation("Abohar Hub / Fazilka");
      setEmoji(initialBatch.emoji || COMMODITY_EMOJIS[initialBatch.commodity] || "📦");
    } else {
      const generatedCode = `B-${Math.floor(100 + Math.random() * 900)}`;
      setBatchCode(generatedCode);
      setCommodity("Tomato");
      setQuantityKg(1200);
      setRemainingHours(18);
      setPricePerKg(34);
      setBaseCostPerKg(20);
      setWarehouseId("WH-NORTH-01");
      setOriginLocation("Abohar Hub / Fazilka");
      setEmoji("🍅");
    }
  }, [initialBatch, isOpen]);

  const handleCommodityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommodity(val);
    if (COMMODITY_EMOJIS[val]) {
      setEmoji(COMMODITY_EMOJIS[val]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        batchCode: batchCode.trim(),
        commodity: commodity.trim(),
        quantityKg: Number(quantityKg),
        remainingShelfLifeHours: Number(remainingHours),
        shelfLifeMinHours: Math.max(1, Math.round(Number(remainingHours) * 0.8)),
        shelfLifeMaxHours: Math.round(Number(remainingHours) * 1.4),
        referenceMarketPricePerKg: Number(pricePerKg),
        baseCostPerKg: Number(baseCostPerKg),
        warehouseId: warehouseId.trim() || "WH-NORTH-01",
        originLocation: originLocation.trim() || "Abohar Hub / Fazilka",
        emoji: emoji || "📦",
        storageCondition: "Cold Reefer 4°C",
        storageTempC: 4.0,
        perishabilityFactor: Number(remainingHours) < 12 ? 0.8 : 0.4,
        recommendedAction: `Dispatch with ${Number(remainingHours)}h shelf life`,
      });
      onClose();
    } catch {
      // Error is handled with toast in PlanContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
            <span>{isEditing ? "✏️ Edit Inventory Batch" : "🌱 Create New Produce Batch"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? `Updating database record for batch ${initialBatch?.id}. Changes will immediately re-sync across optimizer plans.`
              : "Registering a new produce batch into PostgreSQL database. Shelf-life and allocations will be automatically computed."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="batchCode" className="text-xs font-semibold">
                Batch Code / ID
              </Label>
              <Input
                id="batchCode"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                required
                className="font-mono text-xs h-8 bg-surface/60"
                placeholder="e.g. B-TOM-101"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="commodity" className="text-xs font-semibold">
                Commodity &amp; Emoji
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id="emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-10 text-center text-sm p-0 h-8 bg-surface/60"
                />
                <Input
                  id="commodity"
                  value={commodity}
                  onChange={handleCommodityChange}
                  required
                  className="flex-1 text-xs h-8 bg-surface/60"
                  placeholder="e.g. Tomato"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quantityKg" className="text-xs font-semibold">
                Quantity (kg)
              </Label>
              <Input
                id="quantityKg"
                type="number"
                min="10"
                step="10"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Number(e.target.value))}
                required
                className="font-mono text-xs h-8 bg-surface/60"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="remainingHours" className="text-xs font-semibold">
                Remaining Shelf Life (Hours)
              </Label>
              <Input
                id="remainingHours"
                type="number"
                min="1"
                max="240"
                step="0.5"
                value={remainingHours}
                onChange={(e) => setRemainingHours(Number(e.target.value))}
                required
                className="font-mono text-xs h-8 bg-surface/60 text-warning"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pricePerKg" className="text-xs font-semibold">
                Reference Mandi Price (₹/kg)
              </Label>
              <Input
                id="pricePerKg"
                type="number"
                min="5"
                step="0.5"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value))}
                required
                className="font-mono text-xs h-8 bg-surface/60 text-emerald-400"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="baseCostPerKg" className="text-xs font-semibold">
                Base Procurement Cost (₹/kg)
              </Label>
              <Input
                id="baseCostPerKg"
                type="number"
                min="1"
                step="0.5"
                value={baseCostPerKg}
                onChange={(e) => setBaseCostPerKg(Number(e.target.value))}
                required
                className="font-mono text-xs h-8 bg-surface/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="warehouseId" className="text-xs font-semibold">
                Warehouse Hub
              </Label>
              <Input
                id="warehouseId"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="text-xs h-8 bg-surface/60"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="originLocation" className="text-xs font-semibold">
                Origin / Packhouse
              </Label>
              <Input
                id="originLocation"
                value={originLocation}
                onChange={(e) => setOriginLocation(e.target.value)}
                className="text-xs h-8 bg-surface/60"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <PrimaryButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Saving to Database…" : isEditing ? "Save Changes" : "Create Batch"}
            </PrimaryButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
