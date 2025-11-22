# Castora

Castora lets you earn rewards for your price predictions. It’s a decentralized platform where you can compete in price pools and win based on your prediction accuracy. You can also create your own price pools with custom rules.

## Features

In Castora, you can

- Create your own price pools
- See pools (either open or closed)
- Join a Pool by making a prediction and paying an entry fee (stake)
- Claim winnings for your prediction if you won
- Claim pool completion fees if you created the pool
- View other predictions alongside yours as you predict
- Access your activity on previous pools

### Pools

A pool is where you make a prediction. Each pool has a set of seeds and an ID which together make the pool unique. The PoolSeeds depends on the Prediction Model in question.

Pools are time-bound. You make predictions with a particular future timestamp in mind. As such, there is the concept of a window close time, beyond which no other prediction can be made in a pool. This helps to keep fairness in play and prevent last-hour predictions from outsmarting earlier ones. Also, the reward for earlier-placed predictions is winner precedence in case of a tie.

### Predictions

A prediction is your entry (stake) into a pool, where you choose a price or outcome and pay a specified fee. If your prediction wins, you can claim the specified rewards.

You can also make multiple predictions in the same pool.

### Stake

The stake is the entry fee required to join a pool. When you place a prediction, you pay this stake, which officially enters you into the pool.

Each pool may have different stake amounts and tokens. Depending on the prediction model, the stake can be fixed or variable. Pool rewards are distributed from the collected stakes.

### Rewards

Each prediction model defines how predictions work and how winners and rewards are determined.

Castora is decentralized, all rewards come from the pool's stakes, and winners share the total pool funds.

Once a pool is completed and winners are determined, they can claim their rewards. A 5% fee is deducted from winnings to cover gas fees and maintenance.

## Model

In Castora, you predict the price of a token at specific time in future (**snapshot time**). To place your prediction, you provide your **prediction price** for the given token pair and you pay the entry fee (**stake**). Predicting is essentially joining the pool. Every duel pool is uniquely identified by its ID (a numeric value), snapshot time, stake details, and **window close time** (timestamp before snapshot at which no other person can join the pool).

Castora computes rewards by selecting the predictions whose prices were closest to the actual price of the token pair at snapshot time (**snapshot price**). The following is how pools are settled:

- Obtain the snapshot price
- Compare all predicted prices against the snapshot price
- Select the predictions whose prices were closest
- Declare them as winners
- Distribute the entire pool funds into the winners

The distribution is based on the pool's multiplier. This multiplier is the same as the ratio of winners to total number of predictions. If the multiplier is 2x, then half of total predictions will be winners. If 3x, then a third of total predictions will be winners. If 5x, then a fifth, and if 10x then only a tenth of predictions will be winners.

So in a 2x pool, the first half of predictions whose prediction price are closest to the snapshot price are the winners and each winner goes with 2x of their stake. The others simply get unlucky as this is a competition. If it is a 5x pool, then the first fifth of predictions with closest predicted price to snapshot price are the winners and are awarded.

For a more concrete example, if a pool has 1000 predictions and its a 10x pool, then the first 100 predictions whose price are closest to the snapshot price are the winners. If that pool's stake was 50 USDC, it means each winner is going home with 500 USDC. And the entire funds came from all participants. If that pool's stake was 20 USDC, then each winner will go home with 200 USDC (based on the pool's multiplier). And so on.

In case of ties/draws/equal prediction prices, the earlier-placed prediction (based on time) is rewarded or given winner precedence.

In case of a remainder when calculating the number of winners, the pool rounds down to the lower whole number before sharing the rewards. This is to ensure that every winner gets more winnings rather than less. For example, in 2x pools, if there were 10 total predictions, of course the winners will be 5 in number. But if there are 11 total predictions, then there will be 5 winners.

## Contracts

Castora is made up of EVM contracts that are built, maintained, and tested with [Foundry](https://book.getfoundry.sh/). Castora contracts are in the [contracts](./contracts/) directory. There is best effort for code patterns, documentation, and tests for the contracts.

Castora contracts are upgradeable in order to help with bug fixes and new features as you use it. They also keep all prediction data in them so that every activity is always transparent and verifiable on-chain.

For more information about the contracts, see the [contracts README](./contracts/README.md).

## Server

The [server](./server/) is an orchestration NodeJS Workers with an Express backend that help with settling pools and sending telegram notifications to pool creators and winners.

Pools need to automatically compute their winners at snapshot time. Various BullMQ Workers continuously archive and complete pools in the contract and completes in the contract at window close and snapshot times respectively. There is also a Worker for publicly listing community created pools once they are created.

## Frontend

The [frontend](./frontend/) is built with [React](https://react.dev), [TailwindCSS](https://tailwindcss.com), and [PrimeReact](https://primereact.org) components. For Web3 tooling, the frontend uses [Reown](https://reown.com), [View](https://view.com), and [Wagmi](https://wagmi.sh).

The overall UI is mobile-responsive and handles both light and dark theme modes.

## Contributing

Contributions are highly welcome, feel free to reach out to us on [Discord](https://discord.com/invite/wmHceHvNBD).
