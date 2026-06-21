"use client";

import { useTransition } from "react";

interface DeleteButtonProps {
  id: string;
  deleteAction: (id: string) => Promise<void>;
  confirmMessage: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export function DeleteSupplierButton({
  id,
  deleteAction,
  confirmMessage,
  style
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      style={style}
      className="btn btn-danger btn-sm"
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(async () => {
            await deleteAction(id);
          });
        }
      }}
    >
      {isPending ? "..." : "Borrar"}
    </button>
  );
}

export function DeletePlanButton({
  id,
  deleteAction,
  confirmMessage
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="btn btn-danger btn-sm"
      style={{ background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(async () => {
            await deleteAction(id);
          });
        }
      }}
    >
      {isPending ? "..." : "Borrar"}
    </button>
  );
}
