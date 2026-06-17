import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UsageDashboard } from "@/components/usage-dashboard";
import { UserUsageBar } from "@/components/user-usage-bar";

export default function UsagePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">Usage</h1>
          <Badge variant="secondary">Sui v1</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Research runs are billed from prepaid native SUI credits held in an
          on-chain usage vault: each run reserves an estimated cost, then settles
          the actual amount. Connect your wallet to see your balance, per-run
          cost, and how to top up.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UserUsageBar />
        </CardContent>
      </Card>

      <UsageDashboard />

      <p className="max-w-2xl text-xs text-muted-foreground">
        Developer Mode accounts run without charge — reservations are skipped and
        receipts are zero-cost. It is toggled per account in automation settings
        and is the zero-friction path for demos and reviewers.
      </p>
    </div>
  );
}
