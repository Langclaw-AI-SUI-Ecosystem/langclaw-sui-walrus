import { AdminWithdrawDashboard } from "@/components/admin-withdraw-dashboard";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">Admin</h1>
          <Badge variant="secondary">Sui vault</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Withdraw native SUI from the shared usage vault. The connected wallet
          must own the vault AdminCap object. This operation moves on-chain funds
          only and does not edit user credit balances.
        </p>
      </div>

      <AdminWithdrawDashboard />
    </div>
  );
}
