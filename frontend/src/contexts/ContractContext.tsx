import { useToast } from '@/contexts/ToastContext';
import { castoraAbi, castoraPoolsManagerAbi, erc20Abi } from '@/contexts/abis';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { useAccount, useChains, useWalletClient } from 'wagmi';

export const CASTORA_ADDRESS_MONAD: `0x${string}` = '0xa0742C672e713327b0D6A4BfF34bBb4cbb319C53';
export const CASTORA_ADDRESS_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const POOLS_MANAGER_ADDRESS_MONAD: `0x${string}` = '0xb4a03C32C7cAa4069f89184f93dfAe065C141061';

export type ChoiceContract = 'castora' | 'pools-manager';
export type WriteContractStatus = 'initializing' | 'submitted' | 'waiting';

interface ContractContextProps {
  approve: (props: {
    token: any;
    amount: number;
    contract: ChoiceContract;
    onSuccessCallback?: (txHash: string) => void;
  }) => Observable<WriteContractStatus>;

  balance: (token: any) => Promise<number | null>;

  castoraAddress: `0x${string}`;
  poolsManagerAddress: `0x${string}`;

  hasAllowance: (props: { token: any; amount: number; contract: ChoiceContract }) => Promise<boolean>;

  readContract: (props: { functionName: string; contract: ChoiceContract; args?: any[] }) => Promise<any>;

  writeContract: (props: {
    functionName: string;
    contract: ChoiceContract;
    args?: any[];
    value?: number | undefined;
    onSuccessCallback?: (txHash: string, result: any) => void;
  }) => Observable<WriteContractStatus>;
}

const ContractContext = createContext<ContractContextProps>({
  approve: () => new Observable(),
  balance: async () => null,
  castoraAddress: '0x0',
  poolsManagerAddress: '0x0',
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
      [monadTestnet.name]: CASTORA_ADDRESS_MONAD
    }[(currentChain ?? defaultChain).name]!);
  const [castoraAddress, setCastoraAddress] = useState(getCastoraAddress());

  const getRpcUrl = () =>
    ({
      [monadTestnet.name]: undefined
    }[(currentChain ?? defaultChain).name]!);

  const publicClient = () =>
    createPublicClient({
      chain: currentChain ?? defaultChain,
      transport: http(getRpcUrl())
    });

  const read = async (address: any, abi: any, functionName: string, args: any[] = []) => {
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
      toastError(`${e}`.toLowerCase().includes('failed to fetch') ? 'Network Error' : `${e}`);
      return null;
    }
  };

  const write = (
    address: any,
    abi: any,
    functionName: string,
    args: any[] = [],
    value?: number | undefined,
    onSuccessCallback?: (txHash: string, result: any) => void
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
        onSuccessCallback && onSuccessCallback(hash, result);
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

  const approve = ({
    token,
    amount,
    contract,
    onSuccessCallback
  }: {
    token: any;
    amount: number;
    contract: ChoiceContract;
    onSuccessCallback?: (txHash: string) => void;
  }) => {
    const target = contract == 'castora' ? getCastoraAddress() : POOLS_MANAGER_ADDRESS_MONAD;
    return write(token, erc20Abi, 'approve', [target, BigInt(amount)], undefined, onSuccessCallback);
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

  const hasAllowance = async ({
    token,
    amount,
    contract
  }: {
    token: any;
    amount: number;
    contract: ChoiceContract;
  }) => {
    if (!isConnected) return false;
    try {
      const target = contract == 'castora' ? getCastoraAddress() : POOLS_MANAGER_ADDRESS_MONAD;
      return Number(await read(token, erc20Abi, 'allowance', [address, target])) >= amount;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const readContract = async ({
    contract,
    functionName,
    args
  }: {
    functionName: string;
    contract: ChoiceContract;
    args?: any[];
  }) => {
    const target = contract == 'castora' ? getCastoraAddress() : POOLS_MANAGER_ADDRESS_MONAD;
    const abi = contract == 'castora' ? castoraAbi : castoraPoolsManagerAbi;
    return read(target, abi, functionName, args);
  };

  const writeContract = ({
    contract,
    functionName,
    args,
    value,
    onSuccessCallback
  }: {
    functionName: string;
    contract: ChoiceContract;
    args?: any[];
    value?: number | undefined;
    onSuccessCallback?: (txHash: string, result: any) => void;
  }) => {
    const target = contract == 'castora' ? getCastoraAddress() : POOLS_MANAGER_ADDRESS_MONAD;
    const abi = contract == 'castora' ? castoraAbi : castoraPoolsManagerAbi;
    return write(target, abi, functionName, args, value, onSuccessCallback);
  };

  useEffect(() => {
    setCastoraAddress(getCastoraAddress());
  }, [currentChain]);

  return (
    <ContractContext.Provider
      value={{
        approve,
        balance,
        castoraAddress,
        poolsManagerAddress: POOLS_MANAGER_ADDRESS_MONAD,
        hasAllowance,
        readContract,
        writeContract
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
