const { startOfMinute, subDays } = require('date-fns');
const BigNumber = require('bignumber.js');
const { bifiSwapQuery, blockQuery } = require('../../apollo/queries');
const { quickClientSwaps, polygonBlockClient } = require('../../apollo/client');
const {
  addressBook: {
    polygon: {
      platforms: { beefyfinance },
    },
  },
} = require('blockchain-addressbook');
const fetchPrice = require('../../utils/fetchPrice');
const fetch = require('node-fetch');

const bifiMaxiAddress = '0xd126ba764d2fa052fc14ae012aef590bc6ae0c4f';
const wethBifiLpAddress = '0x8b80417d92571720949fc22404200ab8faf7775f';
const uniPairAddress = '0x8b80417d92571720949fc22404200ab8faf7775f';

const INIT_DELAY = 40 * 1000;
const REFRESH_INTERVAL = 15 * 60 * 1000;

const offsetInterval = 100;

interface Result {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

interface RootObject {
  status: string;
  message: string;
  result: Result[];
}

const getUTCSeconds = (date /*: Date*/) => Math.floor(Number(date) / 1000);

const getStartAndEndDate = (daysAgo0, daysAgo1) => {
  const endDate = startOfMinute(subDays(Date.now(), daysAgo0));
  const startDate = startOfMinute(subDays(Date.now(), daysAgo1));
  const [start, end] = [startDate, endDate].map(getUTCSeconds);
  return [start, end];
};

const getOneDayBlocks = async () => {
  const [start, end] = getStartAndEndDate(7, 8);

  const blocksDataStart = await polygonBlockClient.query({
    query: blockQuery,
    variables: {
      start,
      end: start + 600,
    },
    context: {
      clientName: 'blocklytics',
    },
    fetchPolicy: 'network-only',
  });

  const blocksDataEnd = await polygonBlockClient.query({
    query: blockQuery,
    variables: {
      start: end,
      end: end + 600,
    },
    context: {
      clientName: 'blocklytics',
    },
    fetchPolicy: 'network-only',
  });

  const getBlock = data => {
    return data?.data?.blocks[0].number;
  };

  const [startBlock, endBlock] = [blocksDataStart, blocksDataEnd].map(getBlock);

  return [startBlock, endBlock];
};

const getBuyback = async client => {
  const first = offsetInterval;
  let offset = 0;
  let bifiBuybackTokenAmount = new BigNumber(0);
  // const [start, end] = getStartAndEndDate(7, 8);
  // const [start, end] = [1624196707, 1624319569];
  const [startBlock, endBlock] = await getOneDayBlocks();
  // rough estimate, could set to true, but don't want potential infinite loop
  const url = `https://api.polygonscan.com/api?module=account&action=tokentx&address=${bifiMaxiAddress}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=YourApiKeyToken`;
  const resp: RootObject = fetch(url);
  for (const entry of resp.result) {
    if (entry.from === uniPairAddress) {
      // replace with token decimals
      bifiBuybackTokenAmount = bifiBuybackTokenAmount.plus(
        new BigNumber(entry.value).dividedBy('1e18')
      );
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
