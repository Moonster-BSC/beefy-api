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
const fetchPrice = require('../../utils/fetchPrice');

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

  //   let {
  //     data: { swaps },
  //   }
  const resp = await client.query({
    query: bifiSwapQuery(bifiMaxiAddress, start, end),
  });

  const {
    data: { swaps },
  } = resp;

  let bifiBuybackTokenAmount = new BigNumber(0);
  for (const swap of swaps) {
    const { pair } = swap;
    // just a double check
    if (pair.id === wethBifiLpAddress) {
      bifiBuybackTokenAmount = bifiBuybackTokenAmount.plus(new BigNumber(swap.amount1Out));
    }
  }

  return bifiBuybackTokenAmount;
};

let dailyBifiBuybackInUsd;

const getBifiBuyback = () => {
  return dailyBifiBuybackInUsd;
};

const updateBifiBuyback = async () => {
  console.log('> updating bifi buyback');

  try {
    const dailyBifiBuyback = await getBuyback(quickClientSwaps);
    const bifiPrice = await fetchPrice({ oracle: 'tokens', id: 'BIFI' });
    dailyBifiBuybackInUsd = dailyBifiBuyback.times(new BigNumber(bifiPrice));

    console.log('> updated bifi buyback');
  } catch (err) {
    console.error('> bifi buyback initialization failed', err);
  }

  setTimeout(updateBifiBuyback, REFRESH_INTERVAL);
};

setTimeout(updateBifiBuyback, INIT_DELAY);

module.exports = getBifiBuyback;
