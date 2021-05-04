async function getData() {
    // get top pairs by reserves
    let {
      data: { pairs },
    } = await client.query({
      query: PAIRS_CURRENT,
      fetchPolicy: 'cache-first',
    })

    // format as array of addresses
    const formattedPairs = pairs.map((pair) => {
      return pair.id
    })

    // get data for every pair in list
    let topPairs = await getBulkPairData(formattedPairs, ethPrice)
    topPairs && updateTopPairs(topPairs)
  }

async function getBulkPairData(pairList, ethPrice) {
    const [t1, t2, tWeek] = getTimestampsForChanges()
    let [{ number: b1 }, { number: b2 }, { number: bWeek }] = await getBlocksFromTimestamps([t1, t2, tWeek])
  
    try {
      let current = await client.query({
        query: PAIRS_BULK,
        variables: {
          allPairs: pairList,
        },
        fetchPolicy: 'cache-first',
      })
  
      let [oneDayResult, twoDayResult, oneWeekResult] = await Promise.all(
        [b1, b2, bWeek].map(async (block) => {
          let result = client.query({
            query: PAIRS_HISTORICAL_BULK(block, pairList),
            fetchPolicy: 'cache-first',
          })
          return result
        })
      )
  
      let oneDayData = oneDayResult?.data?.pairs.reduce((obj, cur, i) => {
        return { ...obj, [cur.id]: cur }
      }, {})
  
      let twoDayData = twoDayResult?.data?.pairs.reduce((obj, cur, i) => {
        return { ...obj, [cur.id]: cur }
      }, {})
  
      let oneWeekData = oneWeekResult?.data?.pairs.reduce((obj, cur, i) => {
        return { ...obj, [cur.id]: cur }
      }, {})
  
      let pairData = await Promise.all(
        current &&
          current.data.pairs.map(async (pair) => {
            let data = pair
            let oneDayHistory = oneDayData?.[pair.id]
            if (!oneDayHistory) {
              let newData = await client.query({
                query: PAIR_DATA(pair.id, b1),
                fetchPolicy: 'cache-first',
              })
              oneDayHistory = newData.data.pairs[0]
            }
            let twoDayHistory = twoDayData?.[pair.id]
            if (!twoDayHistory) {
              let newData = await client.query({
                query: PAIR_DATA(pair.id, b2),
                fetchPolicy: 'cache-first',
              })
              twoDayHistory = newData.data.pairs[0]
            }
            let oneWeekHistory = oneWeekData?.[pair.id]
            if (!oneWeekHistory) {
              let newData = await client.query({
                query: PAIR_DATA(pair.id, bWeek),
                fetchPolicy: 'cache-first',
              })
              oneWeekHistory = newData.data.pairs[0]
            }
            data = parseData(data, oneDayHistory, twoDayHistory, oneWeekHistory, ethPrice, b1)
            return data
          })
      )
      return pairData
    } catch (e) {
      console.log(e)
    }
  }