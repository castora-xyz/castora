export const castoraAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
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
    name: 'UPGRADE_INTERFACE_VERSION',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'activities',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allStats',
    inputs: [],
    outputs: [
      { name: 'noOfUsers', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictionTokens', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfStakeTokens', type: 'uint256', internalType: 'uint256' }
    ],
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
    name: 'claimablePredictionIdsByAddressesPerPool',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimablePredictionIdsInPoolIndex',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimableRecordHashesByAddresses',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimableRecordHashesIndex',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimedRecordHashes',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      {
        name: 'seeds',
        type: 'tuple',
        internalType: 'struct CastoraStructs.PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
          { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
          { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
          { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    outputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'finalizePoolCompletion',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getPool',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: 'pool',
        type: 'tuple',
        internalType: 'struct CastoraStructs.Pool',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          {
            name: 'seeds',
            type: 'tuple',
            internalType: 'struct CastoraStructs.PoolSeeds',
            components: [
              { name: 'predictionToken', type: 'address', internalType: 'address' },
              { name: 'stakeToken', type: 'address', internalType: 'address' },
              { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
              { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
              { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
              { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
              { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
              { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
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
    name: 'getRoleAdmin',
    inputs: [{ name: 'role', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
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
    name: 'hasPoolCompletionBeenInitiated',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
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
        internalType: 'struct CastoraStructs.PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
          { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
          { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
          { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure'
  },
  {
    type: 'function',
    name: 'hashPredictionRecord',
    inputs: [
      {
        name: 'record',
        type: 'tuple',
        internalType: 'struct CastoraStructs.PredictionRecord',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure'
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [
      { name: 'activities_', type: 'address', internalType: 'address' },
      { name: 'poolsManager_', type: 'address', internalType: 'address' },
      { name: 'poolsRules_', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'initiatePoolCompletion',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'snapshotPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'batchSize', type: 'uint256', internalType: 'uint256' }
    ],
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
    name: 'poolCompletionBatchSize',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'poolCompletionBatchesProcessed',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
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
        internalType: 'struct CastoraStructs.PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
          { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
          { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
          { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
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
    name: 'poolsManager',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'poolsRules',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predict',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'predictionId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'predictionIdsByAddressesPerPool',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionRecordHashes',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionRecords',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionTokenDetails',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionTokens',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictions',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'predicter', type: 'address', internalType: 'address' },
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionPrice', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionTime', type: 'uint256', internalType: 'uint256' },
      { name: 'claimedWinningsTime', type: 'uint256', internalType: 'uint256' },
      { name: 'isAWinner', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
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
    name: 'setActivities',
    inputs: [{ name: '_activities', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setPoolsManager',
    inputs: [{ name: '_poolsManager', type: 'address', internalType: 'address' }],
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
    name: 'setWinnersInBatch',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'winnerPredictionIds', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'stakeTokenDetails',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'totalStaked', type: 'uint256', internalType: 'uint256' },
      { name: 'totalWon', type: 'uint256', internalType: 'uint256' },
      { name: 'totalClaimable', type: 'uint256', internalType: 'uint256' },
      { name: 'totalClaimed', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'stakeTokens',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
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
    name: 'userInPoolPredictionStats',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPredictionRecords',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPredictionTokenDetails',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPredictionTokens',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStakeTokenDetails',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'totalStaked', type: 'uint256', internalType: 'uint256' },
      { name: 'totalWon', type: 'uint256', internalType: 'uint256' },
      { name: 'totalClaimable', type: 'uint256', internalType: 'uint256' },
      { name: 'totalClaimed', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStakeTokens',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStats',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'nthUserCount', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfJoinedPools', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfPredictionTokens', type: 'uint256', internalType: 'uint256' },
      { name: 'noOfStakeTokens', type: 'uint256', internalType: 'uint256' }
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
    name: 'winnerPredictionIdsByAddressesPerPool',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'winnerRecordHashes',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'winnerRecordHashesByAddresses',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'AuthorizedContractUpdated',
    inputs: [
      { name: 'contractAddr', type: 'address', indexed: true, internalType: 'address' },
      { name: 'authorized', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
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
    name: 'NewUserCreatedPool',
    inputs: [
      { name: 'predicter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'nthUserCount', type: 'uint256', indexed: true, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'NewUserPredicted',
    inputs: [
      { name: 'predicter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'nthUserCount', type: 'uint256', indexed: true, internalType: 'uint256' }
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
    name: 'PoolCompleted',
    inputs: [{ name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PoolCompletionInitiated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'noOfWinners', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'winAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'seedsHash', type: 'bytes32', indexed: true, internalType: 'bytes32' }
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
    name: 'ReceiveWasCalled',
    inputs: [
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
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
    name: 'SetActivitiesInCastora',
    inputs: [
      { name: 'oldActivities', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newActivities', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetActivitiesInPoolsManager',
    inputs: [
      { name: 'oldActivities', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newActivities', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetCastoraInPoolsManager',
    inputs: [
      { name: 'oldCastora', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newCastora', type: 'address', indexed: true, internalType: 'address' }
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
    name: 'SetCreatorPoolCompletionFeesSplitPercent',
    inputs: [
      { name: 'oldPercentage', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newPercentage', type: 'uint256', indexed: false, internalType: 'uint256' }
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
    name: 'SetPoolsManagerInCastora',
    inputs: [
      { name: 'oldPoolsManager', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newPoolsManager', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetPoolsRulesInCastora',
    inputs: [
      { name: 'oldPoolsRules', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newPoolsRules', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetWinnersInBatch',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'batchesProcessed', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'totalBatches', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'winnersInBatch', type: 'uint256', indexed: false, internalType: 'uint256' }
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
    name: 'UpdatedAllowedPoolMultiplier',
    inputs: [
      { name: 'multiplier', type: 'uint16', indexed: false, internalType: 'uint16' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedAllowedPredictionToken',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedAllowedStakeAmount',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedAllowedStakeToken',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedCurrentPoolFeesPercent',
    inputs: [
      { name: 'oldPercent', type: 'uint16', indexed: false, internalType: 'uint16' },
      { name: 'newPercent', type: 'uint16', indexed: false, internalType: 'uint16' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedRequiredTimeInterval',
    inputs: [
      { name: 'oldInterval', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newInterval', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
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
  { type: 'error', name: 'AlreadyClaimedCompletionFees', inputs: [] },
  { type: 'error', name: 'AlreadyClaimedWinnings', inputs: [] },
  { type: 'error', name: 'CastoraAddressNotSet', inputs: [] },
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
  { type: 'error', name: 'IncorrectStakeValue', inputs: [] },
  { type: 'error', name: 'InsufficientCreationFeeValue', inputs: [] },
  { type: 'error', name: 'InsufficientStakeValue', inputs: [] },
  { type: 'error', name: 'InvalidActivityId', inputs: [] },
  { type: 'error', name: 'InvalidAddress', inputs: [] },
  { type: 'error', name: 'InvalidInitialization', inputs: [] },
  { type: 'error', name: 'InvalidPoolCompletionBatchSize', inputs: [] },
  { type: 'error', name: 'InvalidPoolFeesPercent', inputs: [] },
  { type: 'error', name: 'InvalidPoolId', inputs: [] },
  { type: 'error', name: 'InvalidPoolMultiplier', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimeInterval', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimes', inputs: [] },
  { type: 'error', name: 'InvalidPredictionId', inputs: [] },
  { type: 'error', name: 'InvalidRecordHash', inputs: [] },
  { type: 'error', name: 'InvalidSplitFeesPercent', inputs: [] },
  { type: 'error', name: 'InvalidTimeRange', inputs: [] },
  { type: 'error', name: 'InvalidWinnersCount', inputs: [] },
  { type: 'error', name: 'NoPredictionsInPool', inputs: [] },
  { type: 'error', name: 'NotAWinner', inputs: [] },
  { type: 'error', name: 'NotInitializing', inputs: [] },
  { type: 'error', name: 'NotYetSnapshotTime', inputs: [] },
  { type: 'error', name: 'NotYourPool', inputs: [] },
  { type: 'error', name: 'NotYourPrediction', inputs: [] },
  { type: 'error', name: 'OwnableInvalidOwner', inputs: [{ name: 'owner', type: 'address', internalType: 'address' }] },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'PoolAlreadyCompleted', inputs: [] },
  { type: 'error', name: 'PoolCompletionAlreadyInitiated', inputs: [] },
  { type: 'error', name: 'PoolCompletionAlreadyProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionBatchesAllProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionBatchesNotAllProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionNotInitiated', inputs: [] },
  { type: 'error', name: 'PoolExistsAlready', inputs: [] },
  { type: 'error', name: 'PoolNotYetCompleted', inputs: [] },
  {
    type: 'error',
    name: 'PredictionAlreadyMarkedAsWinner',
    inputs: [{ name: 'predictionId', type: 'uint256', internalType: 'uint256' }]
  },
  { type: 'error', name: 'PredictionTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'ReentrancyGuardReentrantCall', inputs: [] },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'StakeAmountNotAllowed', inputs: [] },
  { type: 'error', name: 'StakeTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'UUPSUnauthorizedCallContext', inputs: [] },
  {
    type: 'error',
    name: 'UUPSUnsupportedProxiableUUID',
    inputs: [{ name: 'slot', type: 'bytes32', internalType: 'bytes32' }]
  },
  { type: 'error', name: 'UnauthorizedActivityLogger', inputs: [] },
  { type: 'error', name: 'UnmatchingPoolsAndPredictions', inputs: [] },
  { type: 'error', name: 'UnsuccessfulCreationFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendCompletionFees', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendWinnings', inputs: [] },
  { type: 'error', name: 'WindowHasClosed', inputs: [] },
  { type: 'error', name: 'ZeroAmountSpecified', inputs: [] }
] as const;

export const gettersAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'castora_', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allStats',
    inputs: [],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        internalType: 'struct CastoraStructs.AllPredictionStats',
        components: [
          { name: 'noOfUsers', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictionTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfStakeTokens', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'castora',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimedRecordsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'records',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.PredictionRecord[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'pool',
    inputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct CastoraStructs.Pool',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          {
            name: 'seeds',
            type: 'tuple',
            internalType: 'struct CastoraStructs.PoolSeeds',
            components: [
              { name: 'predictionToken', type: 'address', internalType: 'address' },
              { name: 'stakeToken', type: 'address', internalType: 'address' },
              { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
              { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
              { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
              { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
              { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
              { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
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
    name: 'pools',
    inputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    outputs: [
      {
        name: 'poolsList',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.Pool[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          {
            name: 'seeds',
            type: 'tuple',
            internalType: 'struct CastoraStructs.PoolSeeds',
            components: [
              { name: 'predictionToken', type: 'address', internalType: 'address' },
              { name: 'stakeToken', type: 'address', internalType: 'address' },
              { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
              { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
              { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
              { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
              { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
              { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
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
    name: 'prediction',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct CastoraStructs.Prediction',
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
    name: 'predictionRecord',
    inputs: [{ name: 'recordHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: 'record',
        type: 'tuple',
        internalType: 'struct CastoraStructs.PredictionRecord',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionRecordsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'records',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.PredictionRecord[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionTokenDetails',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'details',
        type: 'tuple',
        internalType: 'struct CastoraStructs.PredictionTokenDetails',
        components: [
          { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictionTokensPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'tokensList', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'predictions',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }
    ],
    outputs: [
      {
        name: 'predictionsList',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.Prediction[]',
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
    name: 'stakeTokenDetails',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'details',
        type: 'tuple',
        internalType: 'struct CastoraStructs.StakeTokenDetails',
        components: [
          { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'totalStaked', type: 'uint256', internalType: 'uint256' },
          { name: 'totalWon', type: 'uint256', internalType: 'uint256' },
          { name: 'totalClaimable', type: 'uint256', internalType: 'uint256' },
          { name: 'totalClaimed', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'stakeTokensPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'tokensList', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'state',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract CastoraState' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userClaimableRecordsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'records',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.PredictionRecord[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userInPoolClaimablePredictionIdsPaginated',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userInPoolPredictionIdsPaginated',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userInPoolPredictionStats',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        internalType: 'struct CastoraStructs.UserInPoolPredictionStats',
        components: [
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userInPoolWinnerPredictionIdsPaginated',
    inputs: [
      { name: 'poolId', type: 'uint256', internalType: 'uint256' },
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'predictionIds', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userJoinedPoolIdsPaginated',
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
    name: 'userPredictionRecordsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'records',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.PredictionRecord[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPredictionTokenDetails',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: 'details',
        type: 'tuple',
        internalType: 'struct CastoraStructs.PredictionTokenDetails',
        components: [
          { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPredictionTokensPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'tokensList', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStakeTokenDetails',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' }
    ],
    outputs: [
      {
        name: 'details',
        type: 'tuple',
        internalType: 'struct CastoraStructs.StakeTokenDetails',
        components: [
          { name: 'noOfPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'totalStaked', type: 'uint256', internalType: 'uint256' },
          { name: 'totalWon', type: 'uint256', internalType: 'uint256' },
          { name: 'totalClaimable', type: 'uint256', internalType: 'uint256' },
          { name: 'totalClaimed', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStakeTokensPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'tokensList', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userStats',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        internalType: 'struct CastoraStructs.UserPredictionStats',
        components: [
          { name: 'nthUserCount', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfJoinedPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictionTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfStakeTokens', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userWinnerRecordsPaginated',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'records',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.PredictionRecord[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usersPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'usersList', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'usersStatsBulk',
    inputs: [{ name: 'users', type: 'address[]', internalType: 'address[]' }],
    outputs: [
      {
        name: 'statsList',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.UserPredictionStats[]',
        components: [
          { name: 'nthUserCount', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfJoinedPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictions', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedWinnings', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfPredictionTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfStakeTokens', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'winnerRecordsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      {
        name: 'records',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.PredictionRecord[]',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'predictionId', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  { type: 'error', name: 'AlreadyClaimedCompletionFees', inputs: [] },
  { type: 'error', name: 'AlreadyClaimedWinnings', inputs: [] },
  { type: 'error', name: 'CastoraAddressNotSet', inputs: [] },
  { type: 'error', name: 'CreationFeeTokenAlreadyDisallowed', inputs: [] },
  { type: 'error', name: 'CreationFeeTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'IncorrectCreationFeeValue', inputs: [] },
  { type: 'error', name: 'IncorrectStakeValue', inputs: [] },
  { type: 'error', name: 'InsufficientCreationFeeValue', inputs: [] },
  { type: 'error', name: 'InsufficientStakeValue', inputs: [] },
  { type: 'error', name: 'InvalidActivityId', inputs: [] },
  { type: 'error', name: 'InvalidAddress', inputs: [] },
  { type: 'error', name: 'InvalidPoolCompletionBatchSize', inputs: [] },
  { type: 'error', name: 'InvalidPoolFeesPercent', inputs: [] },
  { type: 'error', name: 'InvalidPoolId', inputs: [] },
  { type: 'error', name: 'InvalidPoolMultiplier', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimeInterval', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimes', inputs: [] },
  { type: 'error', name: 'InvalidPredictionId', inputs: [] },
  { type: 'error', name: 'InvalidRecordHash', inputs: [] },
  { type: 'error', name: 'InvalidSplitFeesPercent', inputs: [] },
  { type: 'error', name: 'InvalidTimeRange', inputs: [] },
  { type: 'error', name: 'InvalidWinnersCount', inputs: [] },
  { type: 'error', name: 'NoPredictionsInPool', inputs: [] },
  { type: 'error', name: 'NotAWinner', inputs: [] },
  { type: 'error', name: 'NotYetSnapshotTime', inputs: [] },
  { type: 'error', name: 'NotYourPool', inputs: [] },
  { type: 'error', name: 'NotYourPrediction', inputs: [] },
  { type: 'error', name: 'PoolAlreadyCompleted', inputs: [] },
  { type: 'error', name: 'PoolCompletionAlreadyInitiated', inputs: [] },
  { type: 'error', name: 'PoolCompletionAlreadyProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionBatchesAllProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionBatchesNotAllProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionNotInitiated', inputs: [] },
  { type: 'error', name: 'PoolExistsAlready', inputs: [] },
  { type: 'error', name: 'PoolNotYetCompleted', inputs: [] },
  {
    type: 'error',
    name: 'PredictionAlreadyMarkedAsWinner',
    inputs: [{ name: 'predictionId', type: 'uint256', internalType: 'uint256' }]
  },
  { type: 'error', name: 'PredictionTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'StakeAmountNotAllowed', inputs: [] },
  { type: 'error', name: 'StakeTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'UnauthorizedActivityLogger', inputs: [] },
  { type: 'error', name: 'UnmatchingPoolsAndPredictions', inputs: [] },
  { type: 'error', name: 'UnsuccessfulCreationFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendCompletionFees', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendWinnings', inputs: [] },
  { type: 'error', name: 'WindowHasClosed', inputs: [] },
  { type: 'error', name: 'ZeroAmountSpecified', inputs: [] }
] as const;

export const poolsManagerAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    name: 'UPGRADE_INTERFACE_VERSION',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'activities',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
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
      { name: 'noOfCompletionFeesTokens', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'castora',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
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
        internalType: 'struct CastoraStructs.PoolSeeds',
        components: [
          { name: 'predictionToken', type: 'address', internalType: 'address' },
          { name: 'stakeToken', type: 'address', internalType: 'address' },
          { name: 'stakeAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'snapshotTime', type: 'uint256', internalType: 'uint256' },
          { name: 'windowCloseTime', type: 'uint256', internalType: 'uint256' },
          { name: 'feesPercent', type: 'uint16', internalType: 'uint16' },
          { name: 'multiplier', type: 'uint16', internalType: 'uint16' },
          { name: 'isUnlisted', type: 'bool', internalType: 'bool' }
        ]
      },
      { name: 'creationFeeToken', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: 'poolId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'creationFeesTokenExists',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'exists', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
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
    name: 'creatorPoolCompletionFeesSplitPercent',
    inputs: [],
    outputs: [{ name: '', type: 'uint16', internalType: 'uint16' }],
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
    name: 'feeCollector',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
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
    name: 'getAllPaidCreatedPoolIdsPaginated',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
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
        internalType: 'struct CastoraStructs.AllUserCreatedPoolStats',
        components: [
          { name: 'noOfUsers', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfUserCreatedPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfUserPaidPoolCreations', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimableFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfClaimedFeesPools', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfCreationFeesTokens', type: 'uint256', internalType: 'uint256' },
          { name: 'noOfCompletionFeesTokens', type: 'uint256', internalType: 'uint256' }
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
        internalType: 'struct CastoraStructs.CompletionFeesTokenInfo',
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
        internalType: 'struct CastoraStructs.CreationFeesTokenInfo',
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
        internalType: 'struct CastoraStructs.UserCompletionTokenFeesInfo',
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
        internalType: 'struct CastoraStructs.UserCreatedPool',
        components: [
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'completionFeesToken', type: 'address', internalType: 'address' },
          { name: 'creationFeesToken', type: 'address', internalType: 'address' },
          { name: 'nthAllCreatedPoolsCount', type: 'uint256', internalType: 'uint256' },
          { name: 'nthCreatorPoolCount', type: 'uint256', internalType: 'uint256' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'creationFeesAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorClaimTime', type: 'uint256', internalType: 'uint256' },
          { name: 'completionFeesAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorCompletionFeesPercent', type: 'uint16', internalType: 'uint16' }
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
    name: 'getUserCreatedPools',
    inputs: [{ name: 'poolIds', type: 'uint256[]', internalType: 'uint256[]' }],
    outputs: [
      {
        name: 'pools',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.UserCreatedPool[]',
        components: [
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'completionFeesToken', type: 'address', internalType: 'address' },
          { name: 'creationFeesToken', type: 'address', internalType: 'address' },
          { name: 'nthAllCreatedPoolsCount', type: 'uint256', internalType: 'uint256' },
          { name: 'nthCreatorPoolCount', type: 'uint256', internalType: 'uint256' },
          { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
          { name: 'creationFeesAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorClaimTime', type: 'uint256', internalType: 'uint256' },
          { name: 'completionFeesAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'creatorCompletionFeesPercent', type: 'uint16', internalType: 'uint16' }
        ]
      }
    ],
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
        internalType: 'struct CastoraStructs.UserCreationTokenFeesInfo',
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
        internalType: 'struct CastoraStructs.UserCreatedPoolStats',
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
    name: 'getUserStatsBulk',
    inputs: [{ name: 'addresses', type: 'address[]', internalType: 'address[]' }],
    outputs: [
      {
        name: 'statsList',
        type: 'tuple[]',
        internalType: 'struct CastoraStructs.UserCreatedPoolStats[]',
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
      { name: 'activities_', type: 'address', internalType: 'address' },
      { name: 'feeCollector_', type: 'address', internalType: 'address' },
      { name: 'splitPercent_', type: 'uint16', internalType: 'uint16' }
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
    name: 'setActivities',
    inputs: [{ name: '_activities', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'setCastora',
    inputs: [{ name: '_castora', type: 'address', internalType: 'address' }],
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
    name: 'setCreatorPoolCompletionFeesSplitPercent',
    inputs: [{ name: '_percentage', type: 'uint16', internalType: 'uint16' }],
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
    name: 'totalPaidCreatedPoolIds',
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
      { name: 'nthAllCreatedPoolsCount', type: 'uint256', internalType: 'uint256' },
      { name: 'nthCreatorPoolCount', type: 'uint256', internalType: 'uint256' },
      { name: 'creationTime', type: 'uint256', internalType: 'uint256' },
      { name: 'creationFeesAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'completionTime', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorClaimTime', type: 'uint256', internalType: 'uint256' },
      { name: 'completionFeesAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'creatorCompletionFeesPercent', type: 'uint16', internalType: 'uint16' }
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
    name: 'userPoolCompletionFeesTokens',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'tokens', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'userPoolCreationFeesTokens',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: 'tokens', type: 'address', internalType: 'address' }],
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
    type: 'event',
    name: 'AuthorizedContractUpdated',
    inputs: [
      { name: 'contractAddr', type: 'address', indexed: true, internalType: 'address' },
      { name: 'authorized', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
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
    name: 'NewUserCreatedPool',
    inputs: [
      { name: 'predicter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'nthUserCount', type: 'uint256', indexed: true, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'NewUserPredicted',
    inputs: [
      { name: 'predicter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'nthUserCount', type: 'uint256', indexed: true, internalType: 'uint256' }
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
    name: 'PoolCompleted',
    inputs: [{ name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PoolCompletionInitiated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'noOfWinners', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'winAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'seedsHash', type: 'bytes32', indexed: true, internalType: 'bytes32' }
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
    name: 'ReceiveWasCalled',
    inputs: [
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetActivitiesInCastora',
    inputs: [
      { name: 'oldActivities', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newActivities', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetActivitiesInPoolsManager',
    inputs: [
      { name: 'oldActivities', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newActivities', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetCastoraInPoolsManager',
    inputs: [
      { name: 'oldCastora', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newCastora', type: 'address', indexed: true, internalType: 'address' }
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
    name: 'SetCreatorPoolCompletionFeesSplitPercent',
    inputs: [
      { name: 'oldPercentage', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newPercentage', type: 'uint256', indexed: false, internalType: 'uint256' }
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
    name: 'SetPoolsManagerInCastora',
    inputs: [
      { name: 'oldPoolsManager', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newPoolsManager', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetPoolsRulesInCastora',
    inputs: [
      { name: 'oldPoolsRules', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newPoolsRules', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SetWinnersInBatch',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'batchesProcessed', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'totalBatches', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'winnersInBatch', type: 'uint256', indexed: false, internalType: 'uint256' }
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
    name: 'UpdatedAllowedPoolMultiplier',
    inputs: [
      { name: 'multiplier', type: 'uint16', indexed: false, internalType: 'uint16' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedAllowedPredictionToken',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedAllowedStakeAmount',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedAllowedStakeToken',
    inputs: [
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedCurrentPoolFeesPercent',
    inputs: [
      { name: 'oldPercent', type: 'uint16', indexed: false, internalType: 'uint16' },
      { name: 'newPercent', type: 'uint16', indexed: false, internalType: 'uint16' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'UpdatedRequiredTimeInterval',
    inputs: [
      { name: 'oldInterval', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newInterval', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
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
  { type: 'error', name: 'AlreadyClaimedWinnings', inputs: [] },
  { type: 'error', name: 'CastoraAddressNotSet', inputs: [] },
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
  { type: 'error', name: 'IncorrectStakeValue', inputs: [] },
  { type: 'error', name: 'InsufficientCreationFeeValue', inputs: [] },
  { type: 'error', name: 'InsufficientStakeValue', inputs: [] },
  { type: 'error', name: 'InvalidActivityId', inputs: [] },
  { type: 'error', name: 'InvalidAddress', inputs: [] },
  { type: 'error', name: 'InvalidInitialization', inputs: [] },
  { type: 'error', name: 'InvalidPoolCompletionBatchSize', inputs: [] },
  { type: 'error', name: 'InvalidPoolFeesPercent', inputs: [] },
  { type: 'error', name: 'InvalidPoolId', inputs: [] },
  { type: 'error', name: 'InvalidPoolMultiplier', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimeInterval', inputs: [] },
  { type: 'error', name: 'InvalidPoolTimes', inputs: [] },
  { type: 'error', name: 'InvalidPredictionId', inputs: [] },
  { type: 'error', name: 'InvalidRecordHash', inputs: [] },
  { type: 'error', name: 'InvalidSplitFeesPercent', inputs: [] },
  { type: 'error', name: 'InvalidTimeRange', inputs: [] },
  { type: 'error', name: 'InvalidWinnersCount', inputs: [] },
  { type: 'error', name: 'NoPredictionsInPool', inputs: [] },
  { type: 'error', name: 'NotAWinner', inputs: [] },
  { type: 'error', name: 'NotInitializing', inputs: [] },
  { type: 'error', name: 'NotYetSnapshotTime', inputs: [] },
  { type: 'error', name: 'NotYourPool', inputs: [] },
  { type: 'error', name: 'NotYourPrediction', inputs: [] },
  { type: 'error', name: 'OwnableInvalidOwner', inputs: [{ name: 'owner', type: 'address', internalType: 'address' }] },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'PoolAlreadyCompleted', inputs: [] },
  { type: 'error', name: 'PoolCompletionAlreadyInitiated', inputs: [] },
  { type: 'error', name: 'PoolCompletionAlreadyProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionBatchesAllProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionBatchesNotAllProcessed', inputs: [] },
  { type: 'error', name: 'PoolCompletionNotInitiated', inputs: [] },
  { type: 'error', name: 'PoolExistsAlready', inputs: [] },
  { type: 'error', name: 'PoolNotYetCompleted', inputs: [] },
  {
    type: 'error',
    name: 'PredictionAlreadyMarkedAsWinner',
    inputs: [{ name: 'predictionId', type: 'uint256', internalType: 'uint256' }]
  },
  { type: 'error', name: 'PredictionTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'ReentrancyGuardReentrantCall', inputs: [] },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'StakeAmountNotAllowed', inputs: [] },
  { type: 'error', name: 'StakeTokenNotAllowed', inputs: [] },
  { type: 'error', name: 'UUPSUnauthorizedCallContext', inputs: [] },
  {
    type: 'error',
    name: 'UUPSUnsupportedProxiableUUID',
    inputs: [{ name: 'slot', type: 'bytes32', internalType: 'bytes32' }]
  },
  { type: 'error', name: 'UnauthorizedActivityLogger', inputs: [] },
  { type: 'error', name: 'UnmatchingPoolsAndPredictions', inputs: [] },
  { type: 'error', name: 'UnsuccessfulCreationFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulFeeCollection', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendCompletionFees', inputs: [] },
  { type: 'error', name: 'UnsuccessfulSendWinnings', inputs: [] },
  { type: 'error', name: 'WindowHasClosed', inputs: [] },
  { type: 'error', name: 'ZeroAmountSpecified', inputs: [] }
] as const;
