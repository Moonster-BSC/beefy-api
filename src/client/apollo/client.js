import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'

const uniswapSubgraphUri = 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2' // for testing
const quickswapSubgraphUri = 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap02'

const getTheGraphClient = (uri) => {
    const client = new ApolloClient({
        link: new HttpLink({
        uri,
        }),
        cache: new InMemoryCache(),
        shouldBatch: true,
    })
}

const quickswapClient = getTheGraphClient(quickswapSubgraphUri)
const uniswapClient = getTheGraphClient(uniswapSubgraphUri)


