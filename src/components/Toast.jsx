import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="toast-container">
          <div className="toast" onClick={() => setToast(null)}>
            {icons[toast.type]}
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
