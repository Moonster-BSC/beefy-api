const gql = require('graphql-tag');

const bifiSwapQuery = (first, offset, maxiAddress, startTimestamp, endTimestamp) => {
  // TODO: need to specify bifi-eth pair
  const queryString = `
  {
    swaps(skip: ${offset}, orderBy: timestamp, orderDirection: desc, where: {to_in: ["${maxiAddress}"], timestamp_gt: "${startTimestamp}", timestamp_lt: "${endTimestamp}"}) {
      id
    pair{
      id
      token0 {
        id
      }
      token1 {
        id
      }
    }
    transaction {
      id
    }
    from
    amount0In
    amount1In
    amount0Out
    amount1Out
    }
}
`;
  return gql(queryString);
};

const blockFieldsQuery = gql`
  fragment blockFields on Block {
    id
    number
    timestamp
  }
`;

const blockQuery = gql`
  query blockQuery($start: Int!, $end: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $start, timestamp_lt: $end }
    ) {
      ...blockFields
    }
  }
  ${blockFieldsQuery}
`;

const pairDayDataQuery = (pairs, startTimestamp, endTimestamp) => {
  let pairsString = `[`;
  pairs.map(pair => {
    return (pairsString += `"${pair}"`);
  });
  pairsString += ']';
  const queryString = `
    query days {
      pairDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { pairAddress_in: ${pairsString}, date_gt: ${startTimestamp}, date_lt: ${endTimestamp} }) {
        id
        pairAddress
        date
        dailyVolumeToken0
        dailyVolumeToken1
        dailyVolumeUSD
        totalSupply
        reserveUSD
      }
    } 
`;
  return gql(queryString);
};

const pairDayDataSushiQuery = (pairs, startTimestamp, endTimestamp) => {
  let pairsString = `[`;
  pairs.map(pair => {
    return (pairsString += `"${pair}"`);
  });
  pairsString += ']';
  const queryString = `
    query days {
      pairs(where: { id_in: ${pairsString}}) {
        dayData(first: 1000, orderBy: date, orderDirection: asc, where: { date_gt: ${startTimestamp}, date_lt: ${endTimestamp} }) {
          id
          pair
          date
          volumeToken0
          volumeToken1
          volumeUSD
          totalSupply
          reserveUSD
        }
      }
    } 
`;
  return gql(queryString);
};

module.exports = {
  pairDayDataQuery,
  pairDayDataSushiQuery,
  bifiSwapQuery,
  blockQuery,
};
