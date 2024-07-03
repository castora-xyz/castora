import PiCheck from '@/assets/pi-check.svg?react';
import { Toast } from 'primereact/toast';
import { ReactNode, createContext, useContext, useRef } from 'react';

interface ToastContextProps {
  toastError: (detail: string) => void;
  toastSuccess: (summary: string, detail: string, link?: string) => void;
  toastInfo: (summary: string, detail: string, link?: string) => void;
}

const ToastContext = createContext<ToastContextProps>({
  toastError: () => {},
  toastSuccess: () => {},
  toastInfo: () => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toast = useRef<Toast>(null);

  const CustomToast = ({
    summary,
    detail,
    link
  }: {
    summary: string;
    detail: string;
    link: string;
  }) => (
    <>
      <PiCheck />
      <div className="p-toast-message-text" data-pc-section="text">
        <span className="p-toast-summary" data-pc-section="summary">
          {summary}
        </span>
        <div className="p-toast-detail" data-pc-section="detail">
          <a
            href={link}
            target={link.startsWith('/') ? '' : '_blank'}
            rel="noreferrer noopener"
            className="underline"
          >
            {detail}
          </a>
        </div>
      </div>
    </>
  );

  const toastError = (detail: string) => {
    if (!toast.current) return;
    toast.current.show({
      severity: 'error',
      summary: 'Error Occured',
      detail,
      life: 12000
    });
  };

  const toastInfo = (summary: string, detail: string, link?: string) => {
    if (!toast.current) return;
    toast.current.show({
      severity: 'info',
      life: 12000,
      ...(link
        ? {
            content: (
              <CustomToast summary={summary} detail={detail} link={link} />
            )
          }
        : { detail })
    });
  };

  const toastSuccess = (summary: string, detail: string, link?: string) => {
    if (!toast.current) return;
    toast.current.show({
      severity: 'success',
      life: 12000,
      ...(link
        ? {
            content: (
              <CustomToast summary={summary} detail={detail} link={link} />
            )
          }
        : { detail })
    });
  };

  return (
    <ToastContext.Provider value={{ toastError, toastInfo, toastSuccess }}>
      {children}
      <Toast ref={toast} />
    </ToastContext.Provider>
  );
};
