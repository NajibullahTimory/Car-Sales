import { createContext, useCallback, useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';

const ToastContext = createContext(() => {});

// Toastify
export function ToastProvider({ children }) {
  const show = useCallback((message, options) => toast(message, options), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        closeOnClick
        pauseOnFocusLoss
        draggable
        newestOnTop
        theme="dark"
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
