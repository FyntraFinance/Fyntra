"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type TipoToast = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  mensagem: string;
  tipo: TipoToast;
  saindo: boolean;
};

const ICONES: Record<TipoToast, string> = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};

const ToastContext = createContext<
  ((mensagem: string, tipo?: TipoToast) => void) | null
>(null);

export function useToast() {
  const contexto = useContext(ToastContext);

  if (!contexto) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>");
  }

  return contexto;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(1);

  const mostrarToast = useCallback(
    (mensagem: string, tipo: TipoToast = "info") => {
      const id = proximoId.current++;

      setToasts((atuais) => [...atuais, { id, mensagem, tipo, saindo: false }]);

      setTimeout(() => {
        setToasts((atuais) =>
          atuais.map((toast) =>
            toast.id === id ? { ...toast, saindo: true } : toast,
          ),
        );

        setTimeout(() => {
          setToasts((atuais) => atuais.filter((toast) => toast.id !== id));
        }, 300);
      }, 3500);
    },
    [],
  );

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.tipo}${toast.saindo ? " hide" : ""}`}
          >
            <div className="toast-icon">{ICONES[toast.tipo]}</div>

            <div className="toast-content">{toast.mensagem}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
