import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import GraphQlClient, { FETCH_MORE } from '../services/GraphqlClient'
import ApolloCache from '../services/ApolloCache'
import * as POINT_GQL from '../queries'

const setContextLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    ...graphQlClient.defaultContext
  })
  return forward(operation)
})

export const graphQlClient = new GraphQlClient({
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    }
  },
  cache: new ApolloCache({
    data: {
      ui: {
        __typename: 'UI',
        token: 'test'
      }
    }
  }),
  configureCache: {
    getPoints(query) {
      query.on(POINT_GQL.create, (current, response, { variables }) => {
        if (current.items.length < variables.pagination.pageSize) {
          current.items.push(response.createPoint.details)
        }

        current.meta.total++
      })

      query.on(POINT_GQL.remove, (current, response) => {
        const id = response.deletePoint.details.id
        current.items = current.items.filter(item => item.id !== id)
        current.meta.total--
      })

      query.on(FETCH_MORE, (current, response) => {
        return {
          meta: response.meta,
          items: current.items.concat(response.items)
        }
      })
    }
  },
  link: setContextLink
    .concat(new HttpLink({
      uri: 'http://localhost:4444/api/gql'
    })),
})
