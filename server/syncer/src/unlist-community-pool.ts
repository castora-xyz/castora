import { FieldValue, firestore, Job, logger, normalizeChain } from '@castora/shared';

/**
 * Unlists a previously listed public community created pool from firestore
 *
 * @param job The job containing the poolId to unlist and the chain to unlist from
 */
export const unlistCommunityPool = async (job: Job): Promise<void> => {
  const { chain: rawChain, poolId } = job.data;
  const chain = normalizeChain(rawChain);
  logger.info(`Starting Unlist Community Pool ID: ${poolId} on chain: ${chain} ...`);
  await firestore.doc(`/chains/${chain}/live/community`).update({ poolIds: FieldValue.arrayRemove(poolId) });
  logger.info(`Successfully Unlisted Community Pool ID: ${poolId} on chain: ${chain}`);
};
