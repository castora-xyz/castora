export const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'feeCollector_',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'AccessControlBadConfirmation',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'bytes32',
        name: 'neededRole',
        type: 'bytes32'
      }
    ],
    name: 'AccessControlUnauthorizedAccount',
    type: 'error'
  },
  {
    inputs: [],
    name: 'AlreadyClaimedWinnings',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InsufficientStakeValue',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidAddress',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidPoolId',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidPoolTimes',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidPredictionId',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidWinnersCount',
    type: 'error'
  },
  {
    inputs: [],
    name: 'NoPredictionsInPool',
    type: 'error'
  },
  {
    inputs: [],
    name: 'NotAWinner',
    type: 'error'
  },
  {
    inputs: [],
    name: 'NotYetSnapshotTime',
    type: 'error'
  },
  {
    inputs: [],
    name: 'NotYourPrediction',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'OwnableInvalidOwner',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error'
  },
  {
    inputs: [],
    name: 'PoolAlreadyCompleted',
    type: 'error'
  },
  {
    inputs: [],
    name: 'PoolExistsAlready',
    type: 'error'
  },
  {
    inputs: [],
    name: 'PoolNotYetCompleted',
    type: 'error'
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error'
  },
  {
    inputs: [],
    name: 'UnsuccessfulFeeCollection',
    type: 'error'
  },
  {
    inputs: [],
    name: 'UnsuccessfulSendWinnings',
    type: 'error'
  },
  {
    inputs: [],
    name: 'UnsuccessfulStaking',
    type: 'error'
  },
  {
    inputs: [],
    name: 'WindowHasClosed',
    type: 'error'
  },
  {
    inputs: [],
    name: 'ZeroAmountSpecified',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'predictionId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'winner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'stakeToken',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'stakedAmount',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'wonAmount',
        type: 'uint256'
      }
    ],
    name: 'ClaimedWinnings',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'snapshotTime',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'snapshotPrice',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'winAmount',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'noOfWinners',
        type: 'uint256'
      }
    ],
    name: 'CompletedPool',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'seedsHash',
        type: 'bytes32'
      }
    ],
    name: 'CreatedPool',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'predictionId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'predicter',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'predictionPrice',
        type: 'uint256'
      }
    ],
    name: 'Predicted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32'
      }
    ],
    name: 'RoleAdminChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address'
      }
    ],
    name: 'RoleGranted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address'
      }
    ],
    name: 'RoleRevoked',
    type: 'event'
  },
  {
    stateMutability: 'payable',
    type: 'fallback'
  },
  {
    inputs: [],
    name: 'ADMIN_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'PREDICTION_DECIMALS',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'WINNER_FEE_PERCENT',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'predictionId',
        type: 'uint256'
      }
    ],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'snapshotPrice',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'noOfWinners',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'winAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: 'winnerPredictions',
        type: 'uint256[]'
      }
    ],
    name: 'completePool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'predictionToken',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'stakeToken',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'stakeAmount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'snapshotTime',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'windowCloseTime',
            type: 'uint256'
          }
        ],
        internalType: 'struct PoolSeeds',
        name: 'seeds',
        type: 'tuple'
      }
    ],
    name: 'createPool',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'feeCollector',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'predictionId',
        type: 'uint256'
      }
    ],
    name: 'getPrediction',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'predicter',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'poolId',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'predictionId',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'predictionPrice',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'predictionTime',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'claimedWinningsTime',
            type: 'uint256'
          },
          {
            internalType: 'bool',
            name: 'isAWinner',
            type: 'bool'
          }
        ],
        internalType: 'struct Prediction',
        name: 'prediction',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'predicter',
        type: 'address'
      }
    ],
    name: 'getPredictionIdsForAddress',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'predictionIds',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      }
    ],
    name: 'getRoleAdmin',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'admin',
        type: 'address'
      }
    ],
    name: 'grantAdminRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'hasRole',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'predictionToken',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'stakeToken',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'stakeAmount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'snapshotTime',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'windowCloseTime',
            type: 'uint256'
          }
        ],
        internalType: 'struct PoolSeeds',
        name: 'seeds',
        type: 'tuple'
      }
    ],
    name: 'hashPoolSeeds',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'joinedPoolIdsByAddresses',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'noOfJoinedPoolsByAddresses',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'noOfPools',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    name: 'poolIdsBySeedsHashes',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'pools',
    outputs: [
      {
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'predictionToken',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'stakeToken',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'stakeAmount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'snapshotTime',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'windowCloseTime',
            type: 'uint256'
          }
        ],
        internalType: 'struct PoolSeeds',
        name: 'seeds',
        type: 'tuple'
      },
      {
        internalType: 'bytes32',
        name: 'seedsHash',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: 'creationTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'noOfPredictions',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'snapshotPrice',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'completionTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'winAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'noOfWinners',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'noOfClaimedWinnings',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'poolId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'predictionPrice',
        type: 'uint256'
      }
    ],
    name: 'predict',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        internalType: 'address',
        name: 'callerConfirmation',
        type: 'address'
      }
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'admin',
        type: 'address'
      }
    ],
    name: 'revokeAdminRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32'
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newFeeCollector',
        type: 'address'
      }
    ],
    name: 'setFeeCollector',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4'
      }
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'totalClaimedWinningsAmounts',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalNoOfClaimedWinningsPredictions',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalNoOfPredictions',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'totalStakedAmounts',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    stateMutability: 'payable',
    type: 'receive'
  }
] as const;
