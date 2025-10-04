import { FieldValue, firestore, Job, logger } from '@castora/shared';

/**
 * Unlists a previously listed public community created pool from firestore
 *
 * @param job The job containing the poolId to unlist and the chain to unlist from
 */
export const unlistCommunityPool = async (job: Job): Promise<void> => {
  const { chain, poolId } = job.data;
  logger.info(`Starting Unlist Community Pool ID: ${poolId} on chain: ${chain} ...`);
  await firestore.doc(`/chains/${chain}/live/community`).update({ poolIds: FieldValue.arrayRemove(poolId) });
  logger.info(`Successfully Unlisted Community Pool ID: ${poolId} on chain: ${chain}`);
};
