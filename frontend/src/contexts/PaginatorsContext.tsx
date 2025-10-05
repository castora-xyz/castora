import { createContext, ReactNode, useContext, useState } from 'react';

export const rowsPerPageOptions = [50, 100, 250, 500];

interface PaginatorsContextProps {
  rowsPerPage: number;
  getLastPage: (total: number) => number;
  updateRowsPerPage: (value: number) => void;
}

export const usePaginators = () => useContext(PaginatorsContext);

const PaginatorsContext = createContext<PaginatorsContextProps>({
  rowsPerPage: 0,
  getLastPage: () => 0,
  updateRowsPerPage: () => {}
});

export const PaginatorsProvider = ({ children }: { children: ReactNode }) => {
  const [rowsPerPage, setRowsPerPage] = useState(
    Number(localStorage.getItem('rowsPerPage')) || 50
  );

  const getLastPage = (total: number) => {
    const last = Math.ceil(total / rowsPerPage);
    return last == 0 ? 0 : last - 1;
  };

  const updateRowsPerPage = (value: number) => {
    localStorage.setItem('rowsPerPage', `${value}`);
    setRowsPerPage(value);
  };

  return (
    <PaginatorsContext.Provider
      value={{ rowsPerPage, getLastPage, updateRowsPerPage }}
    >
      {children}
    </PaginatorsContext.Provider>
  );
};
