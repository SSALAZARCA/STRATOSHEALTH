"use client";
import { useTransition } from "react";

export function ToggleTenantButton({ tenantId, currentStatus, action }: { tenantId: string, currentStatus: string, action: (id: string, status: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await action(tenantId, newStatus);
    });
  };

  if (currentStatus === "ACTIVE") {
    return (
      <button onClick={handleToggle} disabled={isPending} className="btn btn-sm btn-danger">
        {isPending ? "..." : "Suspender"}
      </button>
    );
  }

  return (
    <button onClick={handleToggle} disabled={isPending} className="btn btn-sm btn-success">
      {isPending ? "..." : "Activar"}
    </button>
  );
}
