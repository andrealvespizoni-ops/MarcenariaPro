import { createContext, useContext, useState, useCallback } from 'react';

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const openModal = useCallback((node) => setModal(() => node), []);
  const closeModal = useCallback(() => setModal(null), []);
  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <AppCtx.Provider value={{ tick, refresh, openModal, closeModal, toast }}>
      {children}
      {modal && (
        <div className="overlay" onClick={(e) => { if (e.target.classList.contains('overlay')) closeModal(); }}>
          <div className="modal">{modal}</div>
        </div>
      )}
      <div className="toast-wrap">
        {toasts.map((t) => <div className="toast" key={t.id}>{t.msg}</div>)}
      </div>
    </AppCtx.Provider>
  );
}

export function useApp() {
  return useContext(AppCtx);
}
