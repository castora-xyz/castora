import { Chain, firestore } from '../../utils';

/**
 * Returns activities of the provided entity
 * @param chain The chain to fetch the activities from
 * @param entity Either "pool" or "user" (for which to fetch their activities)
 * @param identifier The poolId (in case of pool as entity) or the user's address
 */
export const fetchActivity = async (
  chain: Chain,
  entity: string,
  identifier: string
) => {
  const entityRef = firestore(chain).doc(`/${entity}s/${identifier}`);
  const entitySnap = await entityRef.get();
  if (!entitySnap.exists) return [];
  const { activities } = entitySnap.data()!;
  return activities ?? [];
};
