import { createContext, useContext, type ReactNode } from 'react';
import { useStockQuotes } from '../hooks/useStockQuotes';

type QuotesContextValue = ReturnType<typeof useStockQuotes>;

const QuotesContext = createContext<QuotesContextValue | null>(null);

export function QuotesProvider({ children }: { children: ReactNode }) {
  const value = useStockQuotes();
  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>;
}

export function useQuotes(): QuotesContextValue {
  const ctx = useContext(QuotesContext);
  if (!ctx) {
    throw new Error('useQuotes must be used within QuotesProvider');
  }
  return ctx;
}
