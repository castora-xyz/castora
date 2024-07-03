import {
  loadFixture,
  time
} from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { getAddress, zeroAddress } from 'viem';

type stake = 'ETH' | 'USDC';

describe('Castora', () => {
  const now = BigInt(Math.trunc(Date.now() / 1000));
  const fifteenMinsAfter = now + 900n;
  const twentyMinsAfter = now + 1200n;
  const stakeAmountEth = 3000000000000000n;
  const stakeAmountUsdc = 10000000n;

  const createPool = async (
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    stake: stake
  ): Promise<bigint> => {
    const { castora, validSeedsEthStake, validSeedsUsdcStake, publicClient } =
      fixture;
    await publicClient.waitForTransactionReceipt({
      hash: await castora.write.createPool([
        stake === 'ETH' ? validSeedsEthStake : validSeedsUsdcStake
      ])
    });
    return await castora.read.noOfPools();
  };

  const completePool = async (
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    poolId: bigint
  ): Promise<void> => {
    const { castora, publicClient } = fixture;
    const [, poolSeeds, , , noOfPredictions] = await castora.read.pools([
      poolId
    ]);
    const predictions = [];
    for (let i = 0; i < Number(noOfPredictions); i++) {
      const prediction = await getPrediction(fixture, poolId, BigInt(i + 1));
      predictions.push(prediction);
    }
    const noOfWinners = BigInt(getNoOfWinners(predictions.length));
    const winAmount =
      (poolSeeds.stakeAmount * noOfPredictions * 95n) / (noOfWinners * 100n);
    const winners = getWinnerPredictionIds(0, predictions);
    await publicClient.waitForTransactionReceipt({
      hash: await castora.write.completePool([
        poolId,
        0n,
        noOfWinners,
        winAmount,
        winners
      ])
    });
  };

  const deployFixture = async () => {
    const { deployContract, getWalletClients, getPublicClient } = viem;
    const publicClient = await getPublicClient();
    const [owner, otherAccount, feeCollector] = await getWalletClients();
    const castora = await deployContract('Castora', [
      feeCollector.account.address
    ]);
    const eth = getAddress(castora.address); // using the contract address as native token
    const usdcContract = await deployContract('USDC');
    const usdc = getAddress(usdcContract.address);
    const validSeedsEthStake = seeds(
      eth,
      eth,
      stakeAmountEth,
      fifteenMinsAfter,
      twentyMinsAfter
    );
    const validSeedsUsdcStake = seeds(
      eth,
      usdc,
      stakeAmountUsdc,
      fifteenMinsAfter,
      twentyMinsAfter
    );

    return {
      castora,
      eth,
      feeCollector,
      otherAccount,
      owner,
      publicClient,
      usdc,
      usdcContract,
      validSeedsEthStake,
      validSeedsUsdcStake
    };
  };

  const getNoOfWinners = (noOfPredictions: number): number =>
    noOfPredictions == 1 ? 1 : Math.floor(noOfPredictions / 2);

  const getPrediction = async (
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    poolId: bigint,
    predictionId: bigint
  ) => {
    return await fixture.castora.read.getPrediction([poolId, predictionId]);
  };

  const getWinnerPredictionIds = (
    snapshotPrice: number,
    predictions: Awaited<ReturnType<typeof getPrediction>>[]
  ) => {
    // 1. Calculate the absolute differences between the predictionPrices
    // against the snapshotPrice.
    const extracted = [];
    for (let i = 0; i < predictions.length; i++) {
      const { predictionId, predictionPrice } = predictions[i];
      const diff = Math.abs(Number(predictionPrice) - snapshotPrice);
      extracted.push({ diff, predictionId });
    }

    // 2. Compare these differences and rank them from lowest to highest.
    // In case of ties or draws or equal differences, rank them by
    // the earlier-made predictions (first predicter wins).
    const sorted = extracted.sort((a, b) => {
      if (a.diff - b.diff != 0) return a.diff - b.diff;
      else return Number(a.predictionId - b.predictionId);
    });

    // 3. Set the winners as the first half of predicters with the lowest
    // differences (closest predictionPrices to the snapshotPrice) as the
    // winnerPredictions.
    const winners = sorted.slice(0, getNoOfWinners(predictions.length));
    return winners.map(({ predictionId }) => predictionId);
  };

  const fundUsdc = async (
    fixture: Awaited<ReturnType<typeof deployFixture>>
  ) => {
    await fixture.usdcContract.write.transfer(
      [fixture.otherAccount.account.address, stakeAmountUsdc],
      { account: fixture.owner.account.address }
    );
  };

  const predict = async (
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    poolId: bigint
  ): Promise<bigint> => {
    const { castora, eth, otherAccount, owner, publicClient, usdcContract } =
      fixture;
    const [, poolSeeds] = await castora.read.pools([poolId]);
    const { stakeToken, stakeAmount } = poolSeeds;
    const account = getAddress(otherAccount.account.address);
    if (stakeToken !== eth) {
      await usdcContract.write.approve([castora.address, stakeAmount], {
        account
      });
    }
    await publicClient.waitForTransactionReceipt({
      hash: await castora.write.predict([poolId, 0n], {
        account,
        ...(stakeToken === eth ? { value: stakeAmount } : {})
      })
    });
    return Array.from(
      await castora.read.getPredictionIdsForAddress([poolId, account])
    ).pop()!;
  };

  const seeds = (
    predictionToken: `0x${string}`,
    stakeToken: `0x${string}`,
    stakeAmount: bigint,
    windowCloseTime: bigint,
    snapshotTime: bigint
  ) => ({
    predictionToken,
    stakeToken,
    stakeAmount,
    windowCloseTime,
    snapshotTime
  });

  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      const { castora, owner } = await loadFixture(deployFixture);
      expect(await castora.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe('Admin Role', () => {
    it('Can set a new admin', async () => {
      const { castora, otherAccount } = await loadFixture(deployFixture);
      const address = getAddress(otherAccount.account.address);
      const adminRole = await castora.read.ADMIN_ROLE();
      await castora.write.grantAdminRole([address]);
      expect(await castora.read.hasRole([adminRole, address])).to.eq(true);
    });

    it('Can revoke an admin', async () => {
      const { castora, otherAccount } = await loadFixture(deployFixture);
      const address = getAddress(otherAccount.account.address);
      const adminRole = await castora.read.ADMIN_ROLE();
      await castora.write.grantAdminRole([address]);
      expect(await castora.read.hasRole([adminRole, address])).to.eq(true);
      await castora.write.revokeAdminRole([address]);
      expect(await castora.read.hasRole([adminRole, address])).to.eq(false);
    });
  });

  describe('Creating Pools', () => {
    it('Should revert if caller is not an admin', async () => {
      const { castora, otherAccount } = await loadFixture(deployFixture);
      const account = getAddress(otherAccount.account.address);
      await expect(
        castora.write.createPool(
          [seeds(zeroAddress, zeroAddress, 0n, 0n, 0n)],
          { account }
        )
      ).to.be.rejectedWith('Unauthorized');
    });

    it('Should revert if predictionToken or stakeTokens are invalid', async () => {
      const { castora, eth } = await loadFixture(deployFixture);
      await expect(
        castora.write.createPool([seeds(zeroAddress, zeroAddress, 0n, 0n, 0n)])
      ).to.be.rejectedWith('InvalidAddress');
      await expect(
        castora.write.createPool([seeds(eth, zeroAddress, 0n, 0n, 0n)])
      ).to.be.rejectedWith('InvalidAddress');
    });

    it('Should revert if stakeAmountUsdc is zero', async () => {
      const { castora, eth, usdc } = await loadFixture(deployFixture);
      await expect(
        castora.write.createPool([seeds(eth, usdc, 0n, 0n, 0n)])
      ).to.be.rejectedWith('ZeroAmount');
    });

    it('Should revert if windowCloseTime is in the past', async () => {
      const { castora, eth, usdc } = await loadFixture(deployFixture);
      await expect(
        castora.write.createPool([seeds(eth, usdc, stakeAmountUsdc, 0n, 0n)])
      ).to.be.rejectedWith('WindowHasClosed');
    });

    it('Should revert if windowCloseTime is after snapshotTime', async () => {
      const { castora, eth, usdc } = await loadFixture(deployFixture);
      await expect(
        castora.write.createPool([
          seeds(eth, usdc, stakeAmountUsdc, fifteenMinsAfter, now)
        ])
      ).to.be.rejectedWith('InvalidPoolTimes');
    });

    it('Should create with valid arguments and emit event', async () => {
      const { castora, publicClient, validSeedsUsdcStake } = await loadFixture(
        deployFixture
      );
      const prevNoOfPools = await castora.read.noOfPools();

      const hash = await castora.write.createPool([validSeedsUsdcStake]);
      await publicClient.waitForTransactionReceipt({ hash });

      const newNoOfPools = await castora.read.noOfPools();
      const [poolId, poolSeeds, seedsHash] = await castora.read.pools([
        newNoOfPools
      ]);
      const {
        predictionToken,
        stakeToken,
        stakeAmount,
        windowCloseTime,
        snapshotTime
      } = validSeedsUsdcStake;
      const createdPoolEvents = await castora.getEvents.CreatedPool();

      expect(newNoOfPools - prevNoOfPools).to.eq(1n);
      expect(newNoOfPools).to.eq(poolId);
      expect(poolSeeds.predictionToken).to.eq(getAddress(predictionToken));
      expect(poolSeeds.stakeToken).to.eq(getAddress(stakeToken));
      expect(poolSeeds.stakeAmount).to.eq(stakeAmount);
      expect(poolSeeds.windowCloseTime).to.eq(windowCloseTime);
      expect(poolSeeds.snapshotTime).to.eq(snapshotTime);
      expect(createdPoolEvents).to.have.lengthOf(1);
      expect(createdPoolEvents[0].args.poolId).to.eq(newNoOfPools);
      expect(createdPoolEvents[0].args.seedsHash).to.eq(seedsHash);
    });

    it('Should revert if a pool exists with the same PoolSeeds', async () => {
      const { castora, validSeedsUsdcStake } = await loadFixture(deployFixture);
      await castora.write.createPool([validSeedsUsdcStake]);
      await expect(
        castora.write.createPool([validSeedsUsdcStake])
      ).to.be.rejectedWith('PoolExists');
    });
  });

  describe('Predicting', () => {
    it('should revert if invalid poolIds are provided', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await expect(castora.write.predict([0n, 0n])).to.be.rejectedWith(
        'InvalidPoolId'
      );
      await expect(castora.write.predict([poolId + 3n, 0n])).to.be.rejectedWith(
        'InvalidPoolId'
      );
    });

    it('should revert if window has closed', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await time.increaseTo(fifteenMinsAfter);
      await expect(castora.write.predict([poolId, 0n])).to.be.rejectedWith(
        'WindowHasClosed'
      );
    });

    it("should revert if stakeToken's value (as native) was not provided", async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'ETH');
      await expect(castora.write.predict([poolId, 0n])).to.be.rejectedWith(
        'Insufficient'
      );
    });

    it('should revert if stakeToken (as ERC20) was not authorized', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await expect(castora.write.predict([poolId, 0n])).to.be.rejected;
    });

    const testSuccessfulPrediction = async (
      fixture: Awaited<ReturnType<typeof deployFixture>>,
      stake: stake
    ) => {
      const { castora, otherAccount } = fixture;
      const poolId = await createPool(fixture, stake);
      const address = getAddress(otherAccount.account.address);

      const prevTotalNoOfPredictions =
        await castora.read.totalNoOfPredictions();
      const [, poolSeeds] = await castora.read.pools([poolId]);
      const { stakeToken, stakeAmount } = poolSeeds;
      const prevTotalStakedAmount = await castora.read.totalStakedAmounts([
        stakeToken
      ]);
      const prevPoolNoOfPredictions = (await castora.read.pools([poolId]))[4];
      const prevMyNoOfJoinedPools =
        await castora.read.noOfJoinedPoolsByAddresses([address]);

      const predictionId = await predict(fixture, poolId);

      const newTotalNoOfPredictions = await castora.read.totalNoOfPredictions();
      const newTotalStakedAmount = await castora.read.totalStakedAmounts([
        stakeToken
      ]);
      const newPoolNoOfPredictions = (await castora.read.pools([poolId]))[4];
      const newMyNoOfJoinedPools =
        await castora.read.noOfJoinedPoolsByAddresses([address]);
      const myLatestJoinedPoolId = await castora.read.joinedPoolIdsByAddresses([
        address,
        newMyNoOfJoinedPools - 1n
      ]);
      const {
        predicter,
        predictionPrice,
        predictionId: fromPoolPredictionId
      } = await castora.read.getPrediction([poolId, predictionId]);
      const predictedEvents = await castora.getEvents.Predicted();

      expect(newTotalNoOfPredictions - prevTotalNoOfPredictions).to.eq(1n);
      expect(newTotalStakedAmount - prevTotalStakedAmount).to.eq(stakeAmount);
      expect(newPoolNoOfPredictions - prevPoolNoOfPredictions).to.eq(1n);
      expect(newMyNoOfJoinedPools - prevMyNoOfJoinedPools).to.eq(1n);
      expect(myLatestJoinedPoolId).to.eq(poolId);
      expect(predicter).to.eq(address);
      expect(predictionPrice).to.eq(0n);
      expect(fromPoolPredictionId).to.eq(predictionId);
      expect(predictedEvents).to.have.lengthOf(1);
      expect(predictedEvents[0].args.poolId).to.eq(poolId);
      expect(predictedEvents[0].args.predictionId).to.eq(predictionId);
      expect(predictedEvents[0].args.predicter).to.eq(address);
      expect(predictedEvents[0].args.predictionPrice).to.eq(0n);
      return stakeAmount;
    };

    it('should join pool with Native Token Stake when everything is right and emit event', async () => {
      const fixture = await loadFixture(deployFixture);
      const address = getAddress(fixture.otherAccount.account.address);
      const getBalance = fixture.publicClient.getBalance;
      const prevBalance = await getBalance({ address });
      const stakeAmount = await testSuccessfulPrediction(fixture, 'ETH');
      const newBalance = await getBalance({ address });

      // checking for greather than or equal because of gas fees
      expect(Number(prevBalance - newBalance)).to.greaterThanOrEqual(
        Number(stakeAmount)
      );
    });

    it('should join pool with ERC20 Token Stake when everything is right and emit event', async () => {
      const fixture = await loadFixture(deployFixture);
      const address = getAddress(fixture.otherAccount.account.address);
      const getBalance = async () =>
        await fixture.usdcContract.read.balanceOf([address]);
      await fundUsdc(fixture);
      const prevBalance = await getBalance();
      const stakeAmount = await testSuccessfulPrediction(fixture, 'USDC');
      const newBalance = await getBalance();
      expect(prevBalance - newBalance).to.eq(stakeAmount);
    });
  });

  describe('Completing Pools', () => {
    it('Should revert if caller is not an admin', async () => {
      const { castora, otherAccount } = await loadFixture(deployFixture);
      const account = getAddress(otherAccount.account.address);
      await expect(
        castora.write.completePool([0n, 0n, 0n, 0n, []], { account })
      ).to.be.rejectedWith('Unauthorized');
    });

    it('should revert if invalid poolIds are provided', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await expect(
        castora.write.completePool([0n, 0n, 0n, 0n, []])
      ).to.be.rejectedWith('InvalidPoolId');
      await expect(
        castora.write.completePool([poolId + 3n, 0n, 0n, 0n, []])
      ).to.be.rejectedWith('InvalidPoolId');
    });

    it('should revert if it is not yet snapshot time', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await expect(
        castora.write.completePool([poolId, 0n, 0n, 0n, []])
      ).to.be.rejectedWith('NotYetSnapshotTime');
    });

    it('should revert if there are no predictions in the pool', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      const [, poolSeeds] = await castora.read.pools([poolId]);
      await time.increaseTo(poolSeeds.snapshotTime);
      await expect(
        castora.write.completePool([poolId, 0n, 1n, 0n, []])
      ).to.be.rejectedWith('NoPredictionsInPool');
    });

    it('should revert if provided noOfWinners is invalid', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);
      const [, poolSeeds] = await castora.read.pools([poolId]);
      await time.increaseTo(poolSeeds.snapshotTime);
      await expect(
        castora.write.completePool([poolId, 0n, 0n, 0n, []])
      ).to.be.rejectedWith('InvalidWinnersCount');
      await expect(
        castora.write.completePool([poolId, 0n, 2n, 0n, []])
      ).to.be.rejectedWith('InvalidWinnersCount');
      await expect(
        castora.write.completePool([
          poolId,
          0n,
          1n,
          0n,
          [predictionId, predictionId]
        ])
      ).to.be.rejectedWith('InvalidWinnersCount');
    });

    it('should revert if provided winAmount is zero', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);
      const [, poolSeeds] = await castora.read.pools([poolId]);
      await time.increaseTo(poolSeeds.snapshotTime);
      await expect(
        castora.write.completePool([poolId, 0n, 1n, 0n, [predictionId]])
      ).to.be.rejectedWith('ZeroAmountSpecified');
    });

    const testSuccessfulCompletePool = async (
      fixture: Awaited<ReturnType<typeof deployFixture>>,
      stake: stake
    ) => {
      const { castora } = fixture;
      const poolId = await createPool(fixture, stake);
      await fundUsdc(fixture);
      await predict(fixture, poolId);
      const [, poolSeeds, , , noOfPredictions] = await castora.read.pools([
        poolId
      ]);
      const { snapshotTime, stakeAmount } = poolSeeds;
      await time.increaseTo(snapshotTime);
      const feePercent = await castora.read.WINNER_FEE_PERCENT();
      const fees = (stakeAmount * BigInt(feePercent)) / 100n;

      await completePool(fixture, poolId);

      const pool = await castora.read.pools([poolId]);
      const predictions = [];
      for (let i = 0; i < Number(noOfPredictions); i++) {
        const prediction = await getPrediction(fixture, poolId, BigInt(i + 1));
        predictions.push(prediction);
      }
      const noOfWinners = BigInt(getNoOfWinners(predictions.length));
      const winAmount =
        (poolSeeds.stakeAmount * noOfPredictions * 95n) / (noOfWinners * 100n);
      const completedPoolEvents = await castora.getEvents.CompletedPool();

      expect(pool[5]).to.eq(0n); // snapshotPrice
      expect(Number(pool[6])).to.be.greaterThan(Number(now)); // completionTime
      expect(pool[7]).to.eq(winAmount);
      expect(pool[8]).to.eq(noOfWinners);
      expect(completedPoolEvents[0].args.poolId).to.eq(poolId);
      expect(completedPoolEvents[0].args.snapshotTime).to.eq(snapshotTime);
      expect(completedPoolEvents[0].args.snapshotPrice).to.eq(0n);
      expect(completedPoolEvents[0].args.winAmount).to.eq(winAmount);
      expect(completedPoolEvents[0].args.noOfWinners).to.eq(noOfWinners);
      return fees;
    };

    it('should complete pool with Native Token Stake when everything is right, collect fees, and emit event', async () => {
      const fixture = await loadFixture(deployFixture);
      const address = getAddress(fixture.feeCollector.account.address);
      const getBalance = fixture.publicClient.getBalance;
      const prevFeeCollectorBalance = await getBalance({ address });
      const gainedFees = await testSuccessfulCompletePool(fixture, 'ETH');
      const newFeeCollectorBalance = await getBalance({ address });
      expect(newFeeCollectorBalance - prevFeeCollectorBalance).to.eq(
        gainedFees
      );
    });

    it('should complete pool with ERC20 Token Stake when everything is right, collect fees, and emit event', async () => {
      const fixture = await loadFixture(deployFixture);
      const address = getAddress(fixture.feeCollector.account.address);
      const getBalance = async () =>
        await fixture.usdcContract.read.balanceOf([address]);
      const prevFeeCollectorBalance = await getBalance();
      const gainedFees = await testSuccessfulCompletePool(fixture, 'USDC');
      const newFeeCollectorBalance = await getBalance();
      expect(newFeeCollectorBalance - prevFeeCollectorBalance).to.eq(
        gainedFees
      );
    });

    it('Should revert if a pool has already been completed', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await fundUsdc(fixture);
      await predict(fixture, poolId);
      const [, poolSeeds] = await castora.read.pools([poolId]);
      const { snapshotTime, stakeAmount } = poolSeeds;
      await time.increaseTo(snapshotTime);
      const feePercent = await castora.read.WINNER_FEE_PERCENT();
      const fees = (stakeAmount * BigInt(feePercent)) / 100n;

      await completePool(fixture, poolId);

      await expect(
        castora.write.completePool([poolId, 0n, 1n, stakeAmount - fees, [0n]])
      ).to.be.rejectedWith('AlreadyCompleted');
    });
  });

  describe('Claim Winnings', () => {
    it('should revert if invalid poolIds are provided', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');

      await expect(castora.write.claimWinnings([0n, 0n])).to.be.rejectedWith(
        'InvalidPoolId'
      );
      await expect(
        castora.write.claimWinnings([poolId + 3n, 0n])
      ).to.be.rejectedWith('InvalidPoolId');
    });

    it('should revert if pool has not been completed', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');

      await expect(
        castora.write.claimWinnings([poolId, 0n])
      ).to.be.rejectedWith('PoolNotYetCompleted');
    });

    it('should revert if invalid predictionIds are provided', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);
      const [, poolSeeds] = await castora.read.pools([poolId]);
      const { snapshotTime } = poolSeeds;
      await time.increaseTo(snapshotTime);
      await completePool(fixture, poolId);

      await expect(
        castora.write.claimWinnings([poolId, 0n])
      ).to.be.rejectedWith('InvalidPredictionId');
      await expect(
        castora.write.claimWinnings([poolId, predictionId + 3n])
      ).to.be.rejectedWith('InvalidPredictionId');
    });

    it("should revert if caller doesn't own the prediction", async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);
      const [, poolSeeds] = await castora.read.pools([poolId]);
      const { snapshotTime } = poolSeeds;
      await time.increaseTo(snapshotTime);
      await completePool(fixture, poolId);

      await expect(
        castora.write.claimWinnings([poolId, predictionId])
      ).to.be.rejectedWith('NotYourPrediction');
    });

    it('Should revert if prediction is not a winner', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora, otherAccount, owner, usdcContract } = fixture;
      const poolId = await createPool(fixture, 'USDC');

      // predicting twice. the second prediction will lose since prediction
      // prices are both 0 and the first predicter wins in case of ties.
      await fundUsdc(fixture);
      await predict(fixture, poolId);

      await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);

      const [, poolSeeds] = await castora.read.pools([poolId]);
      const { snapshotTime } = poolSeeds;
      await time.increaseTo(snapshotTime);
      await completePool(fixture, poolId);
      const account = getAddress(fixture.otherAccount.account.address);

      await expect(
        castora.write.claimWinnings([poolId, predictionId], { account })
      ).to.be.rejectedWith('NotAWinner');
    });

    const testSuccessfulClaimWinnings = async (
      fixture: Awaited<ReturnType<typeof deployFixture>>,
      stake: stake
    ) => {
      const { castora, eth, publicClient, usdc } = fixture;
      const poolId = await createPool(fixture, stake);
      if (stake === 'USDC') await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);
      const oldPool = await castora.read.pools([poolId]);
      const [, poolSeeds] = oldPool;
      const { snapshotTime, stakeAmount, stakeToken } = poolSeeds;
      await time.increaseTo(snapshotTime);
      await completePool(fixture, poolId);
      const account = getAddress(fixture.otherAccount.account.address);

      const prevTotalNoOfClaimedWinnings =
        await castora.read.totalNoOfClaimedWinningsPredictions();
      const prevTotalClaimedWinningsAmount =
        await castora.read.totalClaimedWinningsAmounts([
          stake === 'ETH' ? eth : usdc
        ]);
      const prevPoolNoOfClaimedWinnings = oldPool.pop() as bigint;

      await publicClient.waitForTransactionReceipt({
        hash: await castora.write.claimWinnings([poolId, predictionId], {
          account
        })
      });

      const pool = await castora.read.pools([poolId]);
      const newTotalNoOfClaimedWinnings =
        await castora.read.totalNoOfClaimedWinningsPredictions();
      const newTotalClaimedWinningsAmount =
        await castora.read.totalClaimedWinningsAmounts([
          stake === 'ETH' ? eth : usdc
        ]);
      const newPoolNoOfClaimedWinnings = pool.pop() as bigint;
      const claimedWinningsEvents = await castora.getEvents.ClaimedWinnings();

      expect(newTotalNoOfClaimedWinnings - prevTotalNoOfClaimedWinnings).to.eq(
        1n
      );
      expect(
        newTotalClaimedWinningsAmount - prevTotalClaimedWinningsAmount
      ).to.eq(pool[7]); // winAmount
      expect(newPoolNoOfClaimedWinnings - prevPoolNoOfClaimedWinnings).to.eq(
        1n
      );
      expect(claimedWinningsEvents[0].args.poolId).to.eq(poolId);
      expect(claimedWinningsEvents[0].args.predictionId).to.eq(predictionId);
      expect(claimedWinningsEvents[0].args.winner).to.eq(account);
      expect(claimedWinningsEvents[0].args.stakeToken).to.eq(stakeToken);
      expect(claimedWinningsEvents[0].args.stakedAmount).to.eq(stakeAmount);
      expect(claimedWinningsEvents[0].args.wonAmount).to.eq(pool[7]);
      return pool[7];
    };

    it('Should claim winnings with native token stake when everything is right and emit event', async () => {
      const fixture = await loadFixture(deployFixture);
      const address = getAddress(fixture.otherAccount.account.address);
      const getBalance = fixture.publicClient.getBalance;
      const prevBalance = await getBalance({ address });
      const winAmount = await testSuccessfulClaimWinnings(fixture, 'ETH');
      const newBalance = await getBalance({ address });

      // The accounts are loaded with native tokens for tests already
      // so we can't test for winAmount difference directly as we do with
      // ERC20 tokens. However, ensuring that the balance difference
      // (even when the prediction won) is greater than or equal to the
      // winner fees serves testing purpose since other gas token would have
      // gone in for other contract calls
      expect(Number(prevBalance - newBalance)).to.greaterThanOrEqual(
        Number(stakeAmountEth - winAmount)
      );
    });

    it('Should claim winnings with ERC20 token stake when everything is right and emit event', async () => {
      const fixture = await loadFixture(deployFixture);
      const address = getAddress(fixture.otherAccount.account.address);
      const getBalance = async () =>
        await fixture.usdcContract.read.balanceOf([address]);
      const prevBalance = await getBalance();
      const winAmount = await testSuccessfulClaimWinnings(fixture, 'USDC');
      const newBalance = await getBalance();
      expect(newBalance - prevBalance).to.eq(winAmount);
    });

    it('Should revert if winnings have been claimed', async () => {
      const fixture = await loadFixture(deployFixture);
      const { castora } = fixture;
      const poolId = await createPool(fixture, 'USDC');
      await fundUsdc(fixture);
      const predictionId = await predict(fixture, poolId);
      const [, poolSeeds] = await castora.read.pools([poolId]);
      const { snapshotTime, stakeAmount } = poolSeeds;
      await time.increaseTo(snapshotTime);
      await completePool(fixture, poolId);
      const account = getAddress(fixture.otherAccount.account.address);
      await castora.write.claimWinnings([poolId, predictionId], {
        account
      });

      await expect(
        castora.write.claimWinnings([poolId, predictionId], { account })
      ).to.be.rejectedWith('AlreadyClaimed');
    });
  });
});
