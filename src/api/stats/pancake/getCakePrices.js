const { BSC_CHAIN_ID } = require('../../../../constants');
const { fetchPoolTokensPrices } = require('../../../utils/getPoolStats')

const pools = require('../../../data/cakeLpPools.json');
const oracle = 'pancake';

const knownPrices = {
  BUSD: 1
}

const refreshInterval = 10 * 60 * 1000;
let priceCache = {};
let isProcessing = false;

const fetchCakeTokensPrices = async () => {
  isProcessing = true;
  try {
    priceCache = await fetchPoolTokensPrices(
      oracle,
      pools,
      knownPrices,
      BSC_CHAIN_ID
    )
  } catch (err) {
    console.error(err)
  }
  isProcessing = false;
}
fetchCakeTokensPrices();

const fetchInterval = setInterval(() => {
  if (!isProcessing) {
    fetchCakeTokensPrices();
  }
}, refreshInterval);

const getCakeTokensPrices = async () => {
  while (isProcessing) {
    await sleep(500);
  }
  return priceCache;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { getCakeTokensPrices };