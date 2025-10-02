export const castoraAbi = [
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    name: 'ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'PREDICTION_DECIMALS',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'UPGRADE_INTERFACE_VERSION',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'WINNER_FEE_PERCENT',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'bulkPredict',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionsCount', type: 'uint16', internalType: 'uint16' }
    ],
    outputs: [
      { name: 'firstPredictionId', type: 'uint256', internalType: 'uint256' },
      { name: 'lastPredictionId', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'claimWinnings',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'claimWinningsBulk',
    inputs: [
      { name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'completePool',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'snapshotPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinners', type: 'uint256', internalType: 'uint256' },
      { name: 'winAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'winnerPredictions', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      {
        name: 'seeds',
        type: 'tuple',
        internalType: 'struct PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'feeCollector',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPool',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: 'pool',
        type: 'tuple',
        internalType: 'struct Pool',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          {
            name: 'seeds',
            type: 'tuple',
            internalType: 'struct PoolSeeds',
            components: [
              { name: 'predictionToken', type: 'address', internalType: 'address' },
              { name: 'stakeToken', type: 'address', internalType: 'address' },
              { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
              { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
              { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
            ]
          },
          { name: 'seedsHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'winAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinners', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPoolPredictionsPaginated',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'predictionsList',
        type: 'tuple[]',
        internalType: 'struct Prediction[]',
        components: [
          { name: 'predicter', type: 'address', internalType: 'address' },
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'claimedWinningsTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isAWinner', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPools',
    inputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    outputs: [
      {
        name: 'poolsList',
        type: 'tuple[]',
        internalType: 'struct Pool[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          {
            name: 'seeds',
            type: 'tuple',
            internalType: 'struct PoolSeeds',
            components: [
              { name: 'predictionToken', type: 'address', internalType: 'address' },
              { name: 'stakeToken', type: 'address', internalType: 'address' },
              { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
              { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
              { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
            ]
          },
          { name: 'seedsHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'winAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinners', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPoolsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'poolsList',
        type: 'tuple[]',
        internalType: 'struct Pool[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          {
            name: 'seeds',
            type: 'tuple',
            internalType: 'struct PoolSeeds',
            components: [
              { name: 'predictionToken', type: 'address', internalType: 'address' },
              { name: 'stakeToken', type: 'address', internalType: 'address' },
              { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
              { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
              { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
            ]
          },
          { name: 'seedsHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'winAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinners', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPrediction',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'prediction',
        type: 'tuple',
        internalType: 'struct Prediction',
        components: [
          { name: 'predicter', type: 'address', internalType: 'address' },
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'claimedWinningsTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isAWinner', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPredictionIdsForAddress',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predicter', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPredictions',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    outputs: [
      {
        name: 'predictionsList',
        type: 'tuple[]',
        internalType: 'struct Prediction[]',
        components: [
          { name: 'predicter', type: 'address', internalType: 'address' },
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'claimedWinningsTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isAWinner', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getRoleAdmin',
    inputs: [{ name: 'role', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserPredictionsPaginated',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'predictionsList',
        type: 'tuple[]',
        internalType: 'struct Prediction[]',
        components: [
          { name: 'predicter', type: 'address', internalType: 'address' },
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'claimedWinningsTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isAWinner', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'grantAdminRole',
    inputs: [{ name: 'admin', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hashPoolSeeds',
    inputs: [
      {
        name: 'seeds',
        type: 'tuple',
        internalType: 'struct PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure'
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [{ name: 'feeCollector_', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'joinedPoolIdsByAddresses',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'noOfJoinedPoolsByAddresses',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'noOfPools',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'poolIdsBySeedsHashes',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pools',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'seeds',
        type: 'tuple',
        internalType: 'struct PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
        ]
      },
      { name: 'seedsHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
      { name: 'snapshotPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
      { name: 'winAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinners', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predict',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'proxiableUUID',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  { type: 'function', name: 'renounceOwnership', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'renounceRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'callerConfirmation', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeAdminRole',
    inputs: [{ name: 'admin', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setFeeCollector',
    inputs: [{ name: 'newFeeCollector', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalClaimedWinningsAmounts',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalNoOfClaimedWinningsPredictions',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalNoOfPredictions',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalStakedAmounts',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'upgradeToAndCall',
    inputs: [
      { name: 'newImplementation', type: 'address', internalType: 'address' },
      { name: 'data', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'ClaimedWinnings',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'winner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'stakeToken', type: 'address', indexed: false, internalType: 'address' },
      { name: 'stakedAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'wonAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CompletedPool',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'snapshotTime', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'snapshotPrice', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'winAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'noOfWinners', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'CreatedPool',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'seedsHash', type: 'bytes32', indexed: true, internalType: 'bytes32' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Initialized',
    inputs: [{ name: 'version', type: 'uint64', indexed: false, internalType: 'uint64' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Predicted',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'predicter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'predictionPrice', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleAdminChanged',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'previousAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Upgraded',
    inputs: [{ name: 'implementation', type: 'address', indexed: true, internalType: 'address' }],
    anonymous: false
  },
  { type: 'error', name: 'AccessControlBadConfirmation', inputs: [] },
  {
    type: 'error',
    name: 'AccessControlUnauthorizedAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'neededRole', type: 'bytes32', internalType: 'bytes32' }
    ]
  },
  { type: 'error', name: 'AddressEmptyCode', inputs: [{ name: 'target', type: 'address', internalType: 'address' }] },
  { type: 'error', name: 'AlreadyClaimedWinnings', inputs: [] },
  {
    type: 'error',
    name: 'ERC1967InvalidImplementation',
    inputs: [{ name: 'implementation', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'ERC1967NonPayable', inputs: [] },
  { type: 'error', name: 'FailedCall', inputs: [] },
  { type: 'error', name: 'InsufficientStakeValue', inputs: [] },
  { type: 'error', name: 'InvalidAddress', inputs: [] },
  { type: 'error', name: 'InvalidInitialization', inputs: [] },
  { type: 'error', name: 'InvalidPoolId', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimes', inputs: [] },
  { type: 'error', name: 'InvalidPredictionId', inputs: [] },
  { type: 'error', name: 'InvalidWinnersCount', inputs: [] },
  { type: 'error', name: 'NoPredictionsInPool', inputs: [] },
  { type: 'error', name: 'NotAWinner', inputs: [] },
  { type: 'error', name: 'NotInitializing', inputs: [] },
  { type: 'error', name: 'NotYetSnapshotTime', inputs: [] },
  { type: 'error', name: 'NotYourPrediction', inputs: [] },
  { type: 'error', name: 'OwnableInvalidOwner', inputs: [{ name: 'owner', type: 'address', internalType: 'address' }] },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'PoolAlreadyCompleted', inputs: [] },
  { type: 'error', name: 'PoolExistsAlready', inputs: [] },
  { type: 'error', name: 'PoolNotYetCompleted', inputs: [] },
  { type: 'error', name: 'ReentrancyGuardReentrantCall', inputs: [] },
  { type: 'error', name: 'UUPSUnauthorizedCallContext', inputs: [] },
  {
    type: 'error',
    name: 'UUPSUnsupportedProxiableUUID',
    inputs: [{ name: 'slot', type: 'bytes32', internalType: 'bytes32' }]
  },
  { type: 'error', name: 'UnmatchingPoolsAndPredictions', inputs: [] },
  { type: 'error', name: 'UnsuccessfulFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendWinnings', inputs: [] },
  { type: 'error', name: 'UnsuccessfulStaking', inputs: [] },
  { type: 'error', name: 'WindowHasClosed', inputs: [] },
  { type: 'error', name: 'ZeroAmountSpecified', inputs: [] }
] as const;

export const castoraPoolsManagerAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'UPGRADE_INTERFACE_VERSION',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allConfig',
    inputs: [],
    outputs: [
      { name: 'castora', type: 'address', internalType: 'address' },
      { name: 'poolsRules', type: 'address', internalType: 'address' },
      { name: 'feeCollector', type: 'address', internalType: 'address' },
      { name: 'completionPoolFeesSplitPercent', type: 'uint256', internalType: 'uint256' },
      { name: 'reserved1', type: 'address', internalType: 'address' },
      { name: 'reserved2', type: 'address', internalType: 'address' },
      { name: 'reserved3', type: 'uint256', internalType: 'uint256' },
      { name: 'reserved4', type: 'uint256', internalType: 'uint256' },
      { name: 'reserved5', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allStats',
    inputs: [],
    outputs: [
      { name: 'noOfUsers', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfUserCreatedPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfUserPaidPoolCreations', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableFeesPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedFeesPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfCreationFeesTokens', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfCompletionFeesTokens', type: 'uint256', internalType: 'uint256' },
      { name: 'reserved1', type: 'uint256', internalType: 'uint256' },
      { name: 'reserved2', type: 'uint256', internalType: 'uint256' },
      { name: 'reserved3', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimPoolCompletionFees',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'claimPoolCompletionFeesBulk',
    inputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'completionFeesTokenInfos',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'totalUseCount', type: 'uint256', internalType: 'uint256' },
      { name: 'totalAmountIssued', type: 'uint256', internalType: 'uint256' },
      { name: 'totalAmountClaimed', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'completionFeesTokens',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      {
        name: 'seeds',
        type: 'tuple',
        internalType: 'struct PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' }
        ]
      },
      { name: 'creationFeeToken', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'creationFeesTokenInfos',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'isAllowed', type: 'bool', internalType: 'bool' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'totalUseCount', type: 'uint256', internalType: 'uint256' },
      { name: 'totalAmountUsed', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'creationFeesTokens',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'disallowCreationFees',
    inputs: [{ name: '_token', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'doesUserCreatedPoolExist',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: 'exists', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllClaimablePoolIdsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllClaimedPoolIdsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllCompletionFeesTokens',
    inputs: [],
    outputs: [{ name: 'tokens', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllConfig',
    inputs: [],
    outputs: [
      {
        name: 'config',
        type: 'tuple',
        internalType: 'struct AllConfig',
        components: [
          { name: 'castora', type: 'address', internalType: 'address' },
          { name: 'poolsRules', type: 'address', internalType: 'address' },
          { name: 'feeCollector', type: 'address', internalType: 'address' },
          { name: 'completionPoolFeesSplitPercent', type: 'uint256', internalType: 'uint256' },
          { name: 'reserved1', type: 'address', internalType: 'address' },
          { name: 'reserved2', type: 'address', internalType: 'address' },
          { name: 'reserved3', type: 'uint256', internalType: 'uint256' },
          { name: 'reserved4', type: 'uint256', internalType: 'uint256' },
          { name: 'reserved5', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllCreatedPoolIdsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllCreationFeesTokens',
    inputs: [],
    outputs: [{ name: 'tokens', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllStats',
    inputs: [],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        internalType: 'struct AllStats',
        components: [
          { name: 'noOfUsers', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfUserCreatedPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfUserPaidPoolCreations', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfCreationFeesTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfCompletionFeesTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'reserved1', type: 'uint256', internalType: 'uint256' },
          { name: 'reserved2', type: 'uint256', internalType: 'uint256' },
          { name: 'reserved3', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllUsersPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'usersList', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCompletionFeesTokenInfo',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        internalType: 'struct CompletionFeesTokenInfo',
        components: [
          { name: 'totalUseCount', type: 'uint256', internalType: 'uint256' },
          { name: 'totalAmountIssued', type: 'uint256', internalType: 'uint256' },
          { name: 'totalAmountClaimed', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreationFeeAmount',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreationFeesTokenInfo',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        internalType: 'struct CreationFeesTokenInfo',
        components: [
          { name: 'isAllowed', type: 'bool', internalType: 'bool' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'totalUseCount', type: 'uint256', internalType: 'uint256' },
          { name: 'totalAmountUsed', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserClaimableFeesPoolIdsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserClaimedFeesPoolIdsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserCompletionTokenFeesInfo',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        internalType: 'struct UserCompletionTokenFeesInfo',
        components: [
          { name: 'claimableAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'claimedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'count', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserCreatedPool',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: 'pool',
        type: 'tuple',
        internalType: 'struct UserCreatedPool',
        components: [
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'completionFeesToken', type: 'address', internalType: 'address' },
          { name: 'creationFeesToken', type: 'address', internalType: 'address' },
          { name: 'nthPoolCount', type: 'uint256', internalType: 'uint256' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'creationFeesAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorClaimTime', type: 'uint256', internalType: 'uint256' },
          { name: 'completionFeesAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'completionFeesPercent', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserCreatedPoolIdsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserCreationTokenFeesInfo',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        internalType: 'struct UserCreationTokenFeesInfo',
        components: [
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'count', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserPaidCreatedPoolIdsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserPoolCompletionFeesTokens',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'tokens', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserPoolCreationFeesTokens',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'tokens', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserStats',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        internalType: 'struct UserStats',
        components: [
          { name: 'nthUserCount', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPoolsCreated', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPaidCreationFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableCompletionFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedCompletionFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfCreationFeeTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfCompletionFeeTokens', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [
      { name: 'castora_', type: 'address', internalType: 'address' },
      { name: 'poolsRules_', type: 'address', internalType: 'address' },
      { name: 'feeCollector_', type: 'address', internalType: 'address' },
      { name: 'splitPercent_', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'isCreationFeeTokenAllowed',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'allowed', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'nonUserPoolHasCollectedFees',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: 'hasCollectedFees', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  { type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'processPoolCompletion',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'proxiableUUID',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  { type: 'function', name: 'renounceOwnership', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'setCastora',
    inputs: [{ name: '_castora', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setCompletionPoolFeesSplitPercent',
    inputs: [{ name: '_percentage', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setCreationFees',
    inputs: [
      { name: '_token', type: 'address', internalType: 'address' },
      { name: '_amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setFeeCollector',
    inputs: [{ name: '_feeCollector', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setPoolsRules',
    inputs: [{ name: '_poolsRules', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'totalClaimablePoolIds',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalClaimedPoolIds',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalCreatedPoolIds',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'upgradeToAndCall',
    inputs: [
      { name: 'newImplementation', type: 'address', internalType: 'address' },
      { name: 'data', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'userClaimableFeesPoolIds',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userClaimedFeesPoolIds',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userCompletionTokenFeesInfo',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'claimableAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'claimedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'count', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userCreatedPoolIds',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userCreatedPools',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'completionFeesToken', type: 'address', internalType: 'address' },
      { name: 'creationFeesToken', type: 'address', internalType: 'address' },
      { name: 'nthPoolCount', type: 'uint256', internalType: 'uint256' },
      { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
      { name: 'creationFeesAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorClaimTime', type: 'uint256', internalType: 'uint256' },
      { name: 'completionFeesAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'completionFeesPercent', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userCreationTokenFeesInfo',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'count', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPaidCreatedPoolIds',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStats',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'nthUserCount', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPoolsCreated', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPaidCreationFeesPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableCompletionFeesPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedCompletionFeesPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfCreationFeeTokens', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfCompletionFeeTokens', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'users',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'ClaimedCompletionFees',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'DisallowedCreationFees',
    inputs: [{ name: 'token', type: 'address', indexed: true, internalType: 'address' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Initialized',
    inputs: [{ name: 'version', type: 'uint64', indexed: false, internalType: 'uint64' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'IssuedCompletionFees',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'completionFeesToken', type: 'address', indexed: true, internalType: 'address' },
      { name: 'completionFeesAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [{ name: 'account', type: 'address', indexed: false, internalType: 'address' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetCastora',
    inputs: [
      { name: 'oldCastora', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newCastora', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetCompletionPoolFeesSplitPercent',
    inputs: [
      { name: 'oldPercentage', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newPercentage', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetCreationFees',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetFeeCollector',
    inputs: [
      { name: 'oldFeeCollector', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newFeeCollector', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetPoolsRules',
    inputs: [
      { name: 'oldPoolsRules', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newPoolsRules', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [{ name: 'account', type: 'address', indexed: false, internalType: 'address' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Upgraded',
    inputs: [{ name: 'implementation', type: 'address', indexed: true, internalType: 'address' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UserHasCreatedPool',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creationFeesToken', type: 'address', indexed: true, internalType: 'address' },
      { name: 'creationFeesAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  { type: 'error', name: 'AddressEmptyCode', inputs: [{ name: 'target', type: 'address', internalType: 'address' }] },
  { type: 'error', name: 'AlreadyClaimedCompletionFees', inputs: [] },
  { type: 'error', name: 'CreationFeeTokenAlreadyDisallowed', inputs: [] },
  { type: 'error', name: 'CreationFeeTokenNotAllowed', inputs: [] },
  {
    type: 'error',
    name: 'ERC1967InvalidImplementation',
    inputs: [{ name: 'implementation', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'ERC1967NonPayable', inputs: [] },
  { type: 'error', name: 'EnforcedPause', inputs: [] },
  { type: 'error', name: 'ExpectedPause', inputs: [] },
  { type: 'error', name: 'FailedCall', inputs: [] },
  { type: 'error', name: 'IncorrectCreationFeeValue', inputs: [] },
  { type: 'error', name: 'InsufficientCreationFeeValue', inputs: [] },
  { type: 'error', name: 'InvalidAddress', inputs: [] },
  { type: 'error', name: 'InvalidInitialization', inputs: [] },
  { type: 'error', name: 'InvalidPoolId', inputs: [] },
  { type: 'error', name: 'InvalidSplitFeesPercent', inputs: [] },
  { type: 'error', name: 'NotInitializing', inputs: [] },
  { type: 'error', name: 'NotYourPool', inputs: [] },
  { type: 'error', name: 'OwnableInvalidOwner', inputs: [{ name: 'owner', type: 'address', internalType: 'address' }] },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'PoolCompletionAlreadyProcessed', inputs: [] },
  { type: 'error', name: 'PoolNotYetCompleted', inputs: [] },
  { type: 'error', name: 'ReentrancyGuardReentrantCall', inputs: [] },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'UUPSUnauthorizedCallContext', inputs: [] },
  {
    type: 'error',
    name: 'UUPSUnsupportedProxiableUUID',
    inputs: [{ name: 'slot', type: 'bytes32', internalType: 'bytes32' }]
  },
  { type: 'error', name: 'UnsuccessfulFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendCompletionFees', inputs: [] },
  { type: 'error', name: 'WithdrawFailed', inputs: [] },
  { type: 'error', name: 'ZeroAmountSpecified', inputs: [] }
] as const;

export const erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'string'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_spender',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'approve',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_from',
        type: 'address'
      },
      {
        name: '_to',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'transferFrom',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'string'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      },
      {
        name: '_spender',
        type: 'address'
      }
    ],
    name: 'allowance',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    payable: true,
    stateMutability: 'payable',
    type: 'fallback'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        name: 'to',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
] as const;
