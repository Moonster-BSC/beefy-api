const { startOfMinute, subDays } = require('date-fns');
const BigNumber = require('bignumber.js');
const { bifiSwapQuery } = require('../../apollo/queries');
const { quickClientSwaps } = require('../../apollo/client');
const {
  addressBook: {
    polygon: {
      platforms: { beefyfinance },
    },
  },
} = require('blockchain-addressbook');

const bifiMaxiAddress = '0xd126ba764d2fa052fc14ae012aef590bc6ae0c4f';

const INIT_DELAY = 40 * 1000;
const REFRESH_INTERVAL = 15 * 60 * 1000;

const getUTCSeconds = (date /*: Date*/) => Math.floor(Number(date) / 1000);

const getStartAndEndDate = (daysAgo0, daysAgo1) => {
  // Use data between (now - 2) days and (now - 1) day, since current day data is still being produced
  const endDate = startOfMinute(subDays(Date.now(), daysAgo0));
  const startDate = startOfMinute(subDays(Date.now(), daysAgo1));
  const [start, end] = [startDate, endDate].map(getUTCSeconds);
  return [start, end];
};

const getBuyback = async client => {
  const [start, end] = getStartAndEndDate(1, 2);

  let {
    data: { pairDayDatas },
  } = await client.query({
    query: bifiSwapQuery(bifiMaxiAddress, start, end),
  });

  const pairAddressToAprMap = {};
  for (const pairDayData of pairDayDatas) {
    const pairAddress = pairDayData.id.split('-')[0].toLowerCase();
    pairAddressToAprMap[pairAddress] = new BigNumber(pairDayData.dailyVolumeUSD)
      .times(liquidityProviderFee)
      .times(365)
      .dividedBy(pairDayData.reserveUSD);
  }

  return pairAddressToAprMap;
};

let tvl = {};

const getBifiBuyback = () => {
  return tvl;
};

const updateBifiBuyback = async () => {
  console.log('> updating tvl');

  try {
    let promises = [];

    chains.forEach(chain => promises.push(getChainTvl(chain)));

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        console.warn('getChainTvl error', result.reason);
        continue;
      }
      tvl = { ...tvl, ...result.value };
    }

    console.log('> updated tvl');
  } catch (err) {
    console.error('> tvl initialization failed', err);
  }

  setTimeout(updateBifiBuyback, REFRESH_INTERVAL);
};

setTimeout(updateBifiBuyback, INIT_DELAY);

module.exports = getBifiBuyback;
