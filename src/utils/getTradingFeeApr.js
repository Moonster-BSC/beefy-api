const { startOfMinute, subDays } = require('date-fns');

const getTradingFeeApr = async (client, pairAddresses) => {
  const date = startOfMinute(subDays(Date.now(), 1));
  const start = Math.floor(Number(date) / 1000);

  let {
    data: { pairDayDatas },
  } = await quickclient.query({
    query: pairDayDataQuery(pairAddresses, start),
  });

  const pairAddressToAprMap = {};
  for (const pairDayData of pairDayDatas) {
    pairAddressToAprMap[pairDayData.pairAddress] = new Bignumber(pairDayData.dailyVolumeUSD)
      .times(0.003)
      .times(365)
      .dividedBy(pairDayData.reserveUSD);
  }

  return pairAddressToAprMap;
};
