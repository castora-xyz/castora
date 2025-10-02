import { useContract, useToast } from '@/contexts';
import { Pool, Prediction } from '@/schemas';

export const MAX_BULK_PREDICTIONS = 100;

export const usePredictions = () => {
  const { readContract } = useContract();
  const { toastError } = useToast();

  return async ({ poolId }: Pool, predictionIds: bigint[]) => {
    try {
      const raw = await readContract('getPredictions', [poolId, predictionIds]);
      if (!raw) return null;
      return raw.map((item: any) => new Prediction(item));
    } catch (error) {
      console.error(error);
      toastError(`${error}`);
      return null;
    }
  };
};
