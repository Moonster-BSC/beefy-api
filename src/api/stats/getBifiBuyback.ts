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
const wethBifiLpAddress = '0x8b80417d92571720949fc22404200ab8faf7775f';

const INIT_DELAY = 40 * 1000;
const REFRESH_INTERVAL = 15 * 60 * 1000;

const getUTCSeconds = (date /*: Date*/) => Math.floor(Number(date) / 1000);

const getStartAndEndDate = (daysAgo0, daysAgo1) => {
  const endDate = startOfMinute(subDays(Date.now(), daysAgo0));
  const startDate = startOfMinute(subDays(Date.now(), daysAgo1));
  const [start, end] = [startDate, endDate].map(getUTCSeconds);
  return [start, end];
};

const getBuyback = async client => {
  const [start, end] = getStartAndEndDate(1, 2);

  let {
    data: { swaps },
  } = await client.query({
    query: bifiSwapQuery(bifiMaxiAddress, start, end),
  });

  let bifiBuybackTokenAmount = 0;
  for (const swap of swaps) {
    const { pair } = swap;
    if (pair.id === wethBifiLpAddress) {
      bifiBuybackTokenAmount += swap.amount1Out;
    }
  }

  return bifiBuybackTokenAmount;
};

let dailyBifiBuyback;

const getBifiBuyback = () => {
  return dailyBifiBuyback;
};

const updateBifiBuyback = async () => {
  console.log('> updating bifi buyback');

  try {
    dailyBifiBuyback = await getBuyback(quickClientSwaps);

    console.log('> updated bifi buyback');
  } catch (err) {
    console.error('> bifi buyback initialization failed', err);
  }

  setTimeout(updateBifiBuyback, REFRESH_INTERVAL);
};

setTimeout(updateBifiBuyback, INIT_DELAY);

module.exports = getBifiBuyback;
