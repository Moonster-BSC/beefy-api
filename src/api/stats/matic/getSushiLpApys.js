const BigNumber = require('bignumber.js');
const { polygonWeb3: web3, web3Factory } = require('../../../utils/web3');

const SushiMiniChefV2 = require('../../../abis/matic/SushiMiniChefV2.json');
const SushiComplexRewarderTime = require('../../../abis/matic/SushiComplexRewarderTime.json');
const fetchPrice = require('../../../utils/fetchPrice');
const pools = require('../../../data/matic/sushiLpPools.json');
const { compound } = require('../../../utils/compound');
const { POLYGON_CHAIN_ID } = require('../../../constants');
const getBlockNumber = require('../../../utils/getBlockNumber');

const ERC20 = require('../../../abis/ERC20.json');
const { lpTokenPrice } = require('../../../utils/lpTokens');

const minichef = '0x0769fd68dFb93167989C6f7254cd0D766Fb2841F';
const oracleId = 'SUSHI';
const oracle = 'tokens';
const DECIMALS = '1e18';

// matic
const complexRewarderTime = '0xa3378Ca78633B3b9b2255EAa26748770211163AE';
const oracleIdMatic = 'MATIC';

const getSushiLpApys = async () => {
  let apys = {};

  let promises = [];
  pools.forEach(pool => promises.push(getPoolApy(minichef, pool)));
  const values = await Promise.all(promises);

  for (item of values) {
    apys = { ...apys, ...item };
  }

  return apys;
};

const getPoolApy = async (minichef, pool) => {
  const [yearlyRewardsInUsd, yearlyMaticRewardsInUsd, totalStakedInUsd] = await Promise.all([
    getYearlyRewardsInUsd(minichef, pool),
    getYearlyMaticRewardsInUsd(complexRewarderTime, pool),
    getTotalLpStakedInUsd(minichef, pool),
  ]);

  const totalRewardsInUSD = yearlyRewardsInUsd + yearlyMaticRewardsInUsd;
  const simpleApy = totalRewardsInUSD.dividedBy(totalStakedInUsd);
  const apy = compound(simpleApy, process.env.BASE_HPY, 1, 0.955);
  return { [pool.name]: apy };
};

const getYearlyRewardsInUsd = async (minichef, pool) => {
  const blockNum = await getBlockNumber(POLYGON_CHAIN_ID);
  const minichefContract = new web3.eth.Contract(SushiMiniChefV2, minichef);

  const rewards = new BigNumber(await minichefContract.methods.sushiPerSecond().call());

  let { allocPoint } = await minichefContract.methods.poolInfo(pool.poolId).call();
  allocPoint = new BigNumber(allocPoint);

  const totalAllocPoint = new BigNumber(await minichefContract.methods.totalAllocPoint().call());
  const poolBlockRewards = rewards.times(allocPoint).dividedBy(totalAllocPoint);

  const secondsPerBlock = 1;
  const secondsPerYear = 31536000;
  const yearlyRewards = poolBlockRewards.dividedBy(secondsPerBlock).times(secondsPerYear);

  const tokenPrice = await fetchPrice({ oracle, id: oracleId });
  const yearlyRewardsInUsd = yearlyRewards.times(tokenPrice).dividedBy(DECIMALS);

  return yearlyRewardsInUsd;
};

const getYearlyMaticRewardsInUsd = async (complexRewarderTime, pool) => {
  const blockNum = await getBlockNumber(POLYGON_CHAIN_ID);
  const complexRewarderTimeContract = new web3.eth.Contract(
    SushiComplexRewarderTime,
    complexRewarderTime
  );

  const rewards = new BigNumber(await complexRewarderTimeContract.methods.rewardPerSecond().call());

  let { allocPoint } = await complexRewarderTimeContract.methods.poolInfo(pool.poolId).call();
  allocPoint = new BigNumber(allocPoint);

  const totalAllocPoint = new BigNumber(
    await complexRewarderTimeContract.methods.totalAllocPoint().call()
  );
  const poolBlockRewards = rewards.times(allocPoint).dividedBy(totalAllocPoint);

  const secondsPerBlock = 1;
  const secondsPerYear = 31536000;
  const yearlyRewards = poolBlockRewards.dividedBy(secondsPerBlock).times(secondsPerYear);

  const tokenPrice = await fetchPrice({ oracle, id: oracleIdMatic });
  const yearlyRewardsInUsd = yearlyRewards.times(tokenPrice).dividedBy(DECIMALS);

  return yearlyRewardsInUsd;
};

const getTotalLpStakedInUsd = async (targetAddr, pool) => {
  const web3 = web3Factory(POLYGON_CHAIN_ID);

  const tokenPairContract = new web3.eth.Contract(ERC20, pool.address);
  const totalStaked = new BigNumber(await tokenPairContract.methods.balanceOf(targetAddr).call());
  const tokenPrice = await lpTokenPrice(pool);
  const totalStakedInUsd = totalStaked.times(tokenPrice).dividedBy('1e18');
  return totalStakedInUsd;
};

module.exports = getSushiLpApys;
