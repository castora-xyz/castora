import { useToast } from '@/contexts/ToastContext';
import { abi, erc20Abi } from '@/contexts/abi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ReactNode, createContext, useContext } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount, useChains } from 'wagmi';

export const CASTORA_ADDRESS = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';

export type WriteContractStatus = 'initializing' | 'submitted' | 'waiting';

interface ContractContextProps {
  approve: (
    token: any,
    amount: number,
    onSuccessCallback?: (txHash: string) => void
  ) => Observable<WriteContractStatus>;
  balance: (token: any) => Promise<number | null>;
  hasAllowance: (token: any, amount: number) => Promise<boolean>;
  readContract: (functionName: string, args?: any[]) => Promise<any>;
  writeContract: (
    functionName: string,
    args?: any[],
    onSuccessCallback?: (txHash: string, result: any) => void
  ) => Observable<WriteContractStatus>;
}

const ContractContext = createContext<ContractContextProps>({
  approve: () => new Observable(),
  balance: async () => null,
  hasAllowance: async () => false,
  readContract: async () => null,
  writeContract: () => new Observable()
});

export const useContract = () => useContext(ContractContext);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { open: connectWallet } = useWeb3Modal();
  const { toastError } = useToast();

  const [currentChain] = useChains();

  const publicClient = () =>
    createPublicClient({
      chain: currentChain,
      transport: http(
        currentChain.name === sepolia.name
          ? 'https://sepolia.drpc.org'
          : undefined
      )
    });

  const read = async (
    address: any,
    abi: any,
    functionName: string,
    args: any[] = []
  ) => {
    try {
      return await publicClient().readContract({
        address,
        abi,
        functionName,
        args
      });
    } catch (e) {
      console.error(e);
      toastError(
        `${e}`.toLowerCase().includes('failed to fetch')
          ? 'Network Error'
          : `${e}`
      );
      return null;
    }
  };

  const write = (
    address: any,
    abi: any,
    functionName: string,
    args: any[] = [],
    onSuccessCallBack?: (txHash: string, result: any) => void
  ) => {
    const bs = new BehaviorSubject<WriteContractStatus>('initializing');
    (async () => {
      if (!isConnected) {
        connectWallet();
        bs.error('Wallet Not Connected');
        return;
      }

      const walletClient = createWalletClient({
        chain: currentChain,
        transport: custom((window as any).ethereum)
      });
      const [account] = await walletClient.getAddresses();
      try {
        bs.next('submitted');
        const { result, request } = await publicClient().simulateContract({
          address,
          abi,
          functionName,
          args,
          account
        });
        const hash = await walletClient.writeContract(request);
        bs.next('waiting');
        await publicClient().waitForTransactionReceipt({ hash });
        onSuccessCallBack && onSuccessCallBack(hash, result);
        bs.complete();
      } catch (e: any) {
        if (`${e}`.toLowerCase().includes('rejected')) {
          bs.error('Transaction Rejected');
        } else {
          toastError(
            `${e}`.toLowerCase().includes('failed to fetch')
              ? 'Network Error'
              : e['shortMessage'] ?? e['details'] ?? e['message'] ?? `${e}`
          );
          console.error(e);
          bs.error(e);
        }
      }
    })();
    return bs.asObservable();
  };

  const approve = (
    token: any,
    amount: number,
    onSuccessCallback?: (txHash: string) => void
  ) => {
    return write(
      token,
      erc20Abi,
      'approve',
      [CASTORA_ADDRESS, BigInt(amount)],
      onSuccessCallback
    );
  };

  const balance = async (token: any) => {
    if (!isConnected) return null;
    try {
      return Number(await read(token, erc20Abi, 'balanceOf', [address]));
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const hasAllowance = async (token: any, amount: number) => {
    if (!isConnected) return false;
    try {
      return (
        Number(
          await read(token, erc20Abi, 'allowance', [address, CASTORA_ADDRESS])
        ) >= amount
      );
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const readContract = async (functionName: string, args: any[] = []) =>
    read(CASTORA_ADDRESS, abi, functionName, args);

  const writeContract = (
    functionName: string,
    args: any[] = [],
    onSuccessCallBack?: (txHash: string, result: any) => void
  ) => write(CASTORA_ADDRESS, abi, functionName, args, onSuccessCallBack);

  return (
    <ContractContext.Provider
      value={{ approve, balance, hasAllowance, readContract, writeContract }}
    >
      {children}
    </ContractContext.Provider>
  );
};
