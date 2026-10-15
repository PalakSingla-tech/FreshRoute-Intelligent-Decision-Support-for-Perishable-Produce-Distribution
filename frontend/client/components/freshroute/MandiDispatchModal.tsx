import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Download, FileText, Loader2, Printer, QrCode, ShieldCheck, X } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";
import { usePlan } from "./PlanContext";
import { api, type BackendManifest } from "@/lib/api-client";

export function MandiDispatchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [manifest, setManifest] = useState<BackendManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const { freshRoute, planDataset } = usePlan();

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    api.getManifest()
      .then((data) => {
        setManifest(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [isOpen]);

  const fallbackBatches = planDataset?.batches.slice(0, 6) ?? [];
  const manifestItems = manifest?.authorizedBatches || manifest?.allocations || manifest?.batches;

  // Prevent background scrolling and support Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manifest-modal-title"
    >
      <div className="relative flex flex-col w-full max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="manifest-modal-title"
                className="text-base font-bold text-foreground font-heading"
              >
                Official Mandi Dispatch Manifest
              </h2>
              <p className="text-xs text-muted-foreground">
                Punjab Agricultural Produce Market Committee (APMC) Electronic Gate Pass
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close manifest"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Printable Manifest Sheet Body */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-foreground bg-canvas/40"
          id="print-manifest-sheet"
        >
          {/* Manifest Badge Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
                FreshRoute Dispatch Authorization
              </span>
              <p className="text-lg font-extrabold font-heading text-foreground">
                {manifest?.manifestNumber || "MANIFEST #PB-2026-OCT-8821"}
              </p>
              <p className="text-xs text-muted-foreground">
                {manifest?.validityWindow || manifest?.dispatchWindow || "Dispatch Date: 14 Oct, 20:00 IST · Valid for 24-Hour Rolling Window"}
              </p>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/80 self-start sm:self-auto">
              <QrCode className="h-10 w-10 text-foreground shrink-0" aria-hidden="true" />
              <div className="text-[11px] leading-tight">
                <p className="font-mono font-bold text-foreground">
                  {manifest?.authorizationStatus || "AUTH: PASS-VERIFIED"}
                </p>
                <p className="text-muted-foreground truncate max-w-[160px]">
                  {manifest?.certifiedOfficer || "APMC Yard Fast-Track"}
                </p>
              </div>
            </div>
          </div>

          {/* Carrier & Reefer Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg border border-border bg-surface/70">
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Fleet Vehicle</p>
              <p className="font-mono font-semibold text-foreground mt-0.5">
                {manifest?.fleetVehicle || manifest?.fleetVehicleId || "PB-08-CZ-4109"}
              </p>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-surface/70">
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Cold Chain Reefer</p>
              <p className="font-mono font-semibold text-emerald-400 mt-0.5">
                {manifest?.coldChainReefer || (manifest?.coldChainReeferTempC ? `${manifest.coldChainReeferTempC}°C Monitored` : "3.8°C Monitored")}
              </p>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-surface/70">
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Origin Packhouse</p>
              <p className="font-semibold text-foreground mt-0.5 truncate">
                {manifest?.originPackhouse || "Abohar Hub / Fazilka"}
              </p>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-surface/70">
              <p className="text-muted-foreground text-[10px] uppercase font-bold">Primary Target</p>
              <p className="font-semibold text-foreground mt-0.5 truncate">
                {manifest?.primaryTarget || manifest?.primaryTargetMandi || "Ludhiana Wholesale Yard"}
              </p>
            </div>
          </div>

          {/* Batches Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8 gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading official APMC gate pass manifest…</span>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface border-b border-border font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Crop</th>
                      <th className="p-2.5">Destination</th>
                      <th className="p-2.5 text-right">Net Weight</th>
                      <th className="p-2.5 text-right">Remaining / Buffer</th>
                      <th className="p-2.5 text-right">Pricing / Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {manifestItems && manifestItems.length > 0 ? (
                      manifestItems.map((item, idx) => (
                        <tr key={item.batchCode + idx} className="hover:bg-primary/[0.03]">
                          <td className="p-2.5 font-bold text-foreground">
                            {item.batchCode}
                          </td>
                          <td className="p-2.5 font-sans font-medium">{item.commodity}</td>
                          <td className="p-2.5 font-sans text-muted-foreground truncate max-w-[140px]">
                            {item.destinationName}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {item.allocatedQuantityKg.toLocaleString("en-IN")} kg
                          </td>
                          <td className="p-2.5 text-right text-emerald-400 font-bold">
                            {item.remainingShelfLifeHours}h (buf: {item.shelfLifeBufferAtArrivalHours ?? item.shelfLifeBufferHours ?? 0}h)
                          </td>
                          <td className="p-2.5 text-right font-sans">
                            {item.discountPercentage > 0 ? (
                              <span className="text-amber-400 font-bold">
                                {item.discountPercentage}% Disc (₹{item.effectivePricePerKg}/kg)
                              </span>
                            ) : (
                              <span className="text-muted-foreground">₹{item.effectivePricePerKg}/kg</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      fallbackBatches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-primary/[0.03]">
                          <td className="p-2.5 font-bold text-foreground">
                            <span className="mr-1 font-sans">{batch.emoji}</span>
                            {batch.id}
                          </td>
                          <td className="p-2.5 font-sans font-medium">{batch.commodity}</td>
                          <td className="p-2.5 font-sans text-muted-foreground">Primary Wholesale Yard</td>
                          <td className="p-2.5 text-right">{batch.quantityKg.toLocaleString("en-IN")} kg</td>
                          <td className="p-2.5 text-right text-emerald-400 font-bold">{batch.remainingHours} hrs</td>
                          <td className="p-2.5 text-right font-sans">
                            {batch.remainingHours < 12 ? (
                              <span className="text-amber-400 font-bold">20% Tier</span>
                            ) : batch.remainingHours < 24 ? (
                              <span className="text-amber-400">10% Tier</span>
                            ) : (
                              <span className="text-muted-foreground">Standard</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quality & Statutory Declarations */}
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              <strong>FreshRoute Perishable Certification:</strong>{" "}
              {manifest?.driverAuthorizationNotice ||
                "All listed consignments have passed First-Expired, First-Out (FEFO) audit protocols with an arrival buffer greater than 2 hours. Driver authorized for expedited tollway clearance and priority APMC mandi gate intake."}
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4 bg-surface shrink-0">
          <span className="text-xs text-muted-foreground">
            Total Authorized:{" "}
            <strong className="text-foreground">
              {manifest?.totalDispatchWeightKg
                ? `${manifest.totalDispatchWeightKg.toLocaleString("en-IN")} kg`
                : `${freshRoute.demandFulfilled}% allocated`}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <PrimaryButton
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Close
            </PrimaryButton>
            <PrimaryButton
              onClick={() => window.print()}
              className="inline-flex items-center gap-2"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>Print Manifest</span>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <PrimaryButton
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 shadow-sm text-xs"
      >
        <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>Generate Mandi Gate Pass</span>
      </PrimaryButton>

      {typeof document !== "undefined" && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
