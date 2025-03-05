import { useToast } from '@/contexts/ToastContext';
import { monadDevnet, monadTestnet } from '@/contexts/Web3Context';
import { abi, erc20Abi } from '@/contexts/abi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount, useChains, useWalletClient } from 'wagmi';

export const CASTORA_ADDRESS_MONAD: `0x${string}` =
  '0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53';
export const CASTORA_ADDRESS_SEPOLIA: `0x${string}` =
  '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';

export type WriteContractStatus = 'initializing' | 'submitted' | 'waiting';

interface ContractContextProps {
  approve: (
    token: any,
    amount: number,
    onSuccessCallback?: (txHash: string) => void
  ) => Observable<WriteContractStatus>;
  balance: (token: any) => Promise<number | null>;
  castoraAddress: `0x${string}`;
  hasAllowance: (token: any, amount: number) => Promise<boolean>;
  readContract: (functionName: string, args?: any[]) => Promise<any>;
  writeContract: (
    functionName: string,
    args?: any[],
    value?: number | undefined,
    onSuccessCallback?: (txHash: string, result: any) => void
  ) => Observable<WriteContractStatus>;
}

const ContractContext = createContext<ContractContextProps>({
  approve: () => new Observable(),
  balance: async () => null,
  castoraAddress: '0x0',
  hasAllowance: async () => false,
  readContract: async () => null,
  writeContract: () => new Observable()
});

export const useContract = () => useContext(ContractContext);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, chain: currentChain } = useAccount();
  const { open: connectWallet } = useWeb3Modal();
  const { toastError } = useToast();
  const walletClient = useWalletClient();

  const [defaultChain] = useChains();
  const getCastoraAddress = () =>
    ({
      [monadDevnet.name]: CASTORA_ADDRESS_MONAD,
      [monadTestnet.name]: CASTORA_ADDRESS_MONAD,
      [sepolia.name]: CASTORA_ADDRESS_SEPOLIA
    }[(currentChain ?? defaultChain).name]!);
  const [castoraAddress, setCastoraAddress] = useState(getCastoraAddress());

  const getRpcUrl = () =>
    ({
      [monadDevnet.name]: undefined,
      [monadTestnet.name]: undefined,
      [sepolia.name]: 'https://sepolia.drpc.org'
    }[(currentChain ?? defaultChain).name]!);

  const publicClient = () =>
    createPublicClient({
      chain: currentChain ?? defaultChain,
      transport: http(getRpcUrl())
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
      if (
        `${e}`.includes('request timed out') ||
        `${e}`.includes('requests limited') ||
        `${e}`.includes('HTTP request failed')
      ) {
        return null;
      }
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
    value?: number | undefined,
    onSuccessCallBack?: (txHash: string, result: any) => void
  ) => {
    const bs = new BehaviorSubject<WriteContractStatus>('initializing');
    (async () => {
      if (!isConnected) {
        connectWallet();
        bs.error('Wallet Not Connected');
        return;
      }

      const [account] = await walletClient.data!.getAddresses();
      try {
        bs.next('submitted');
        const { result, request } = await publicClient().simulateContract({
          address,
          abi,
          functionName,
          args,
          account,
          ...(value ? { value: BigInt(value) } : {}),
          chain: currentChain ?? defaultChain
        });
        const hash = await walletClient.data!.writeContract(request);
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
      [getCastoraAddress(), BigInt(amount)],
      undefined,
      onSuccessCallback
    );
  };

  const balance = async (token: any) => {
    if (!address) return null;
    try {
      return Number(
        token.toLowerCase() == getCastoraAddress().toLowerCase()
          ? await publicClient().getBalance({ address })
          : await read(token, erc20Abi, 'balanceOf', [address])
      );
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
          await read(token, erc20Abi, 'allowance', [
            address,
            getCastoraAddress()
          ])
        ) >= amount
      );
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const readContract = async (functionName: string, args: any[] = []) =>
    read(getCastoraAddress(), abi, functionName, args);

  const writeContract = (
    functionName: string,
    args: any[] = [],
    value?: number | undefined,
    onSuccessCallBack?: (txHash: string, result: any) => void
  ) =>
    write(
      getCastoraAddress(),
      abi,
      functionName,
      args,
      value,
      onSuccessCallBack
    );

  useEffect(() => {
    setCastoraAddress(getCastoraAddress());
  }, [currentChain]);

  return (
    <ContractContext.Provider
      value={{
        approve,
        balance,
        castoraAddress,
        hasAllowance,
        readContract,
        writeContract
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
