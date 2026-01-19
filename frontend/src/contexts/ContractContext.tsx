import { useToast } from '@/contexts/ToastContext';
import { castoraAbi, castoraGettersAbi, castoraPoolsManagerAbi, erc20Abi } from '@/contexts/abis';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { createPublicClient, http } from 'viem';
import { useConnection, useBalance, useChains, useWalletClient } from 'wagmi';

export const CASTORA_ADDRESS_MONAD: `0x${string}` = '0x9E1e6f277dF3f2cD150Ae1E08b05f45B3297bE6D';
export const CASTORA_ADDRESS_SEPOLIA: `0x${string}` = '0x294c2647d9f3eaca43a364859c6e6a1e0e582dbd';
export const POOLS_MANAGER_ADDRESS_MONAD: `0x${string}` = '0xF8f179Ab96165b61833F2930309bCE9c6aB281bE';
export const GETTERS_ADDRESS_MONAD: `0x${string}` = '0xf08959E66614027AE76303F4C5359eBfFd00Bc30';

export type ChoiceContract = 'castora' | 'getters' | 'pools-manager';
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
  const { address, isConnected, chain: currentChain } = useConnection();
  const { refetch: refetchBalance } = useBalance();
  const { open: connectWallet } = useWeb3Modal();
  const { toastError } = useToast();
  const walletClient = useWalletClient();

  const [defaultChain] = useChains();
  const getCastoraAddress = () => CASTORA_ADDRESS_MONAD;
  const [castoraAddress, setCastoraAddress] = useState(CASTORA_ADDRESS_MONAD);

  const publicClient = () =>
    createPublicClient({
      chain: currentChain ?? defaultChain,
      transport: http()
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
        refetchBalance();
        onSuccessCallback && onSuccessCallback(hash, result);
        bs.complete();
      } catch (e: any) {
        if (`${e}`.toLowerCase().includes('rejected')) {
          bs.error('Transaction Rejected');
        } else {
          console.error(e);

          if (e?.cause?.metaMessages) {
            const matched = `${e.cause.metaMessages[0]}`.match(/Error:\s*([A-Za-z0-9_]+)\(\)/);
            const reverted = matched ? matched[1] : null;
            if (reverted) {
              toastError(reverted);
              bs.error(reverted);
              return;
            }
          }

          toastError(
            `${e}`.toLowerCase().includes('failed to fetch')
              ? 'Network Error'
              : e['shortMessage'] ?? e['details'] ?? e['message'] ?? `${e}`
          );
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
    let target;
    if (contract == 'castora') target = getCastoraAddress();
    else if (contract == 'pools-manager') target = POOLS_MANAGER_ADDRESS_MONAD;
    else if (contract == 'getters') target = GETTERS_ADDRESS_MONAD;
    else throw new Error('Invalid contract type');

    let abi;
    if (contract == 'castora') abi = castoraAbi;
    else if (contract == 'pools-manager') abi = castoraPoolsManagerAbi;
    else if (contract == 'getters') abi = castoraGettersAbi;
    else throw new Error('Invalid contract type');

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
