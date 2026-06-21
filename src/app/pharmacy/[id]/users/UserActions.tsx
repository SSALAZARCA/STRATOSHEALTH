"use client";

import { useTransition } from "react";

export default function UserActions({
  userId,
  userName,
  active,
  toggleActiveAction,
  deleteAction
}: {
  userId: string;
  userName: string;
  active: boolean;
  toggleActiveAction: (userId: string, currentActive: boolean) => Promise<void>;
  deleteAction: (userId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleActiveAction(userId, active);
      } catch (err: any) {
        alert(err.message || "Error al cambiar estado");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`¿Está seguro de eliminar a ${userName}?`)) return;
    startTransition(async () => {
      try {
        await deleteAction(userId);
      } catch (err: any) {
        alert(err.message || "Error al eliminar usuario");
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button 
        onClick={handleToggle}
        disabled={isPending}
        className="btn btn-sm"
        style={{ 
          padding: "0.25rem 0.5rem", 
          fontSize: "0.8rem", 
          background: active ? "#64748b" : "#10b981", 
          color: "white", 
          border: "none",
          borderRadius: "4px",
          cursor: isPending ? "wait" : "pointer"
        }}
      >
        {isPending ? "..." : (active ? "Inactivar" : "Activar")}
      </button>

      <button 
        onClick={handleDelete}
        disabled={isPending}
        className="btn btn-sm"
        style={{ 
          padding: "0.25rem 0.5rem", 
          fontSize: "0.8rem", 
          background: "#ef4444", 
          color: "white", 
          border: "none",
          borderRadius: "4px",
          cursor: isPending ? "wait" : "pointer"
        }}
      >
        {isPending ? "..." : "Eliminar"}
      </button>
    </div>
  );
}
