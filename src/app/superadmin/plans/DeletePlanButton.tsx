"use client";

import { useTransition } from "react";

export function DeletePlanButton({ planId, deleteAction }: { planId: string, deleteAction: (id: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button 
      className="btn btn-danger" 
      title="Eliminar Plan" 
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Está seguro de eliminar este plan? Esta acción no se puede deshacer.")) {
          startTransition(async () => {
            await deleteAction(planId);
          });
        }
      }}
    >
      {isPending ? "..." : "X"}
    </button>
  );
}
