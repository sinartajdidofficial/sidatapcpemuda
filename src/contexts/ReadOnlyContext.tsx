import { createContext, useContext } from 'react';

const ReadOnlyContext = createContext(false);

export const ReadOnlyProvider = ({ children, value }: { children: React.ReactNode; value: boolean }) => (
  <ReadOnlyContext.Provider value={value}>{children}</ReadOnlyContext.Provider>
);

export const useReadOnly = () => useContext(ReadOnlyContext);
