"use client";

export function DischargeButton({ patientId, patientName, total, action }: {
  patientId: string;
  patientName: string;
  total: number;
  action: (id: string) => Promise<void>;
}) {
  return (
    <form action={() => action(patientId)}>
      <button
        type="submit"
        className="btn btn-sm btn-danger"
        onClick={(e) => {
          if (!confirm(`¿Egresar a ${patientName} y generar orden de cobro por $${total.toLocaleString("es-CO")}?`)) {
            e.preventDefault();
          }
        }}
      >
        Egresar
      </button>
    </form>
  );
}

export function SendOrderEmailButton({ orderId, supplierName, supplierEmail, action }: {
  orderId: string;
  supplierName: string;
  supplierEmail: string | null;
  action: (id: string) => Promise<void>;
}) {
  return (
    <form action={() => action(orderId)}>
      <button
        type="submit"
        className="btn btn-primary btn-sm"
        onClick={(e) => {
          if (!confirm(`¿Autorizar y enviar esta orden al proveedor ${supplierName}?`)) {
            e.preventDefault();
          }
        }}
      >
        📤 Autorizar y Enviar
      </button>
    </form>
  );
}

export function ReceiveOrderButton({ orderId, action }: {
  orderId: string;
  action: (id: string) => Promise<void>;
}) {
  return (
    <form action={() => action(orderId)}>
      <button type="submit" className="btn btn-success btn-sm">
        ✅ Marcar Recibida
      </button>
    </form>
  );
}

export function DispatchOrderButton({ orderId, action }: {
  orderId: string;
  action: (id: string) => Promise<void>;
}) {
  return (
    <form action={() => action(orderId)}>
      <button type="submit" className="btn btn-success">
        ✅ Despachar Todo
      </button>
    </form>
  );
}
