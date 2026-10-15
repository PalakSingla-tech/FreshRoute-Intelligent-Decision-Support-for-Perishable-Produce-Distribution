import { InventoryTable } from "@/components/freshroute/InventoryTable";
import { SectionCard } from "@/components/freshroute/SectionCard";

export default function InventoryPage() {
  return (
    <SectionCard
      title="Perishable Inventory"
      description="Active batches across the Punjab produce network, most urgent first"
    >
      <InventoryTable />
    </SectionCard>
  );
}
