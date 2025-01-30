# Castora

Castora rewards your predictions with the community. Castora is where you find the decentralized price prediction pools/markets where you can compete with others and get rewarded. 

## Features

In Castora, you can
- See pools (either open or closed)
- Join a Pool by making a prediction and paying an entry fee (stake)
- Claim winnings for your prediction if you won
- View other predictions alongside yours as you predict
- Access your activity on previous pools

### Pools

A pool is where you make a prediction. Each pool has a set of seeds and an ID which together make the pool unique. The PoolSeeds depends on the Prediction Model in question.

Pools are time-bound. You make predictions with a particular future timestamp in mind. As such, there is the concept of a window close time, beyond which no other prediction can be made in a pool. This helps to keep fairness in play and prevent last-hour predictions from outsmarting earlier ones. Also, the reward for earlier-placed predictions is winner precedence in case of a tie.

### Predictions

A prediction is your stake activity in a Pool. It is about you specifying a choice or price and paying an entry fee. Predictions make you eligible to claim winnings if the predictions turned out to be winner ones. You can place multiple predictions in the same pool.

### Stake

The stake is the entry fee for a given pool. You pay it when you place a prediction. In fact, joining a pool is effectively paying the stake and also means placing a prediction. 

The stake amount and stake token could vary or be the same per pool. Notwithstanding, depending on the prediction model, there could be fixed or variable stake amounts. Also, pool rewards are obtained from the stakes.

### Rewards

Each Prediction model specifies how predictions are made and how winners and rewards are computed. 

Castora is decentralized. When you predict, you predict alongside other community members. This makes the rewards to be from the pool stakes. It also ensures that winners are always rewarded as the winners simply share all the pool's funds. 

After a pool is completed (or its winners have been computed), winner predictions can claim their winnings. During the claim process, Castora deducts 5% of the winnings for gas fees and maintenance.

## Models

Castora is all about predictions. Castora has various models for different ways of predicting and getting rewards. So far, the **Duel** model has been completely developed and the **Crosspoint** model is in the pipeline. 

### Duel

In Duel, you predict the price of a token at specific time in future (**snapshot time**). To place your prediction, you provide your **prediction price** for the given token pair and you pay the entry fee (**stake**). Predicting is essentially joining the pool. Every duel pool is uniquely identified by its ID (a numeric value), snapshot time, stake details, and **window close time** (timestamp before snapshot at which no other person can join the pool).

Duel computes rewards by selecting the predictions whose prices were closest to the actual price of the token pair at snapshot time (**snapshot price**). The following is how Duel completes a pool:
* Obtain the snapshot price
* Compare all predicted prices against the snapshot price
* Select the predictions whose prices were closest
* Declare them as winners
* Distribute the entire pool funds into the winners

The distribution is based on the pool's multiplier. This multiplier is the same as the ratio of winners to total number of predictions. If the multiplier is 2x, then half of total predictions will be winners. If 3x, then a third of total predictions will be winners. If 5x, then a fifth, and if 10x then only a tenth of predictions will be winners.

So in a 2x pool, the first half of predictions whose prediction price are closest to the snapshot price are the winners and each winner goes with 2x of their stake. The others simply get unlucky as this is a competition. If it is a 5x pool, then the first fifth of predictions with closest predicted price to snapshot price are the winners and are awarded.

For a more concrete example, if a pool has 1000 predictions and its a 10x pool, then the first 100 predictions whose price are closest to the snapshot price are the winners. If that pool's stake was 50 USDC, it means each winner is going home with 500 USDC. And the entire funds came from all participants. If that pool's stake was 20 USDC, then each winner will go home with 200 USDC (based on the pool's multiplier). And so on.

In case of ties/draws/equal prediction prices, the earlier-placed prediction (based on time) is rewarded or given winner precedence. 

In case of a remainder when calculating the number of winners, the pool rounds down to the lower whole number before sharing the rewards. This is to ensure that every winner gets more winnings rather than less. For example, in 2x pools, if there were 10 total predictions, of course the winners will be 5 in number. But if there are 11 total predictions, then there will be 5 winners. 


### Crosspoint

In Crosspoint, you predict whether the price of a token will bull (go higher) or bear (go lower) than a **target price** by a specific time in future (**snapshot time**). If target action takes place before the snapshot time, then the pool closes. For example, if you predict that in 2 days, BTC's price will go below $100k, if it goes below by the next day, the pool closes (it doesn't need to wait till the 2 days).

Crosspoint pools are Yes and No pools. They present you with choosing Yes or No to whether a token will take a particular direction on a target price by a snapshot time. Window Close time also applies to crosspoint pools to maintain fair play. 

## Contracts

Castora is made up of EVM contracts that are built, maintained, and tested with [Foundry](https://book.getfoundry.sh/). Castora contracts are in the [contracts](./contracts/) directory. There is best effort for code patterns, variable names, documentation, and tests for the contracts. 

Castora contracts are upgradeable in order to help with bug fixes and new features as you make predictions. They also keep all prediction data in them so that every activity is always transparent and verifiable on-chain. 

## Server

The [server](./server/) is a small NodeJS/Express backend that help with managing pools, storing transaction hashes of activities, and sending browser notifications to pool winners. 

Pools need to be continuously available. [GitHub cron jobs](./.github/workflows/cron-sync-live-pools.yml) continuously create pools in the contract and completes them when their snapshot time reaches. Using a server for this helps to prevent abuse and ensures that pools are created in the regulated way. 

## Frontend

The [frontend](./frontend/) is built with [React](https://react.dev), [TailwindCSS](https://tailwindcss.com), and [PrimeReact](https://primereact.org) components. For Web3 tooling, the frontend uses [Reown](https://reown.com), [View](https://view.com), and [Wagmi](https://wagmi.sh).

The overall UI is mobile-responsive and handles both light and dark theme modes. 

## Contributing

Contributions are highly welcome, feel free to reach out to us on [Discord](https://discord.com/invite/wmHceHvNBD).