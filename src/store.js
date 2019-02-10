import Vue from 'vue'
import Vuex from 'vuex'
import gql from 'graphql-tag';
import { graphQlClient, mapApolloCache } from './plugins/apollo'
import getByPath from 'lodash/get'

Vue.use(Vuex)

const query = gql`
  query {
    points @connection(key: "pointsFeed") {
      meta {
        total
      }
      items {
        ... on Point {
          title
          id
          description
        }
      }
    }
  }
`;

function push(path, { to: query }) {
  const [queryDef] = query.definitions
  const name = queryDef.selectionSet.selections[0].name.value

  return (proxy, { data }) => {
    const item = getByPath(data, path)
    const current = proxy.readQuery({ query })

    current[name].items.push(item)
    current[name].meta.total++
    proxy.writeQuery({ query, data: current })
  }
}

export default new Vuex.Store({
  state: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAiLCJ0aSI6IjEyMzQ1IiwicnVsZXMiOlt7ImFjdGlvbnMiOiJyZWFkIiwic3ViamVjdCI6IlBvaW50In0seyJhY3Rpb25zIjoicmVhZCIsInN1YmplY3QiOiJNZXNzYWdlIn0seyJhY3Rpb25zIjoibWFuYWdlIiwic3ViamVjdCI6IlBvaW50IiwiY29uZGl0aW9ucyI6eyJjcmVhdG9ySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAifX0seyJhY3Rpb25zIjpbInJlYWQiLCJ1cGRhdGUiXSwic3ViamVjdCI6IlVzZXIiLCJjb25kaXRpb25zIjp7Il9pZCI6IjVjNjA3MGNmZjgwMDRkZThkOGE0NjI1MCJ9fSx7ImFjdGlvbnMiOlsiY3JlYXRlIiwiZGVsZXRlIl0sInN1YmplY3QiOiJNZXNzYWdlIiwiY29uZGl0aW9ucyI6eyJjcmVhdG9ySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAifX1dLCJkZXZpY2VJZCI6IjVjNjA3MTBmNTM1YTU5NTkxOThkMjI4YyIsImV4cCI6MTU3OTYzMjI3MX0.SHLIUPk_t8POtIUUAxPVM2ynmSYwFjY8H8ZrFUQxitQ'
  },
  getters: {
    apollo(state) {
      graphQlClient.defaultContext = {
        headers: {
          authorization: state.token
        }
      }
      return graphQlClient
    },
    expiresAt(state) {
      return
    },
    points: mapApolloCache(query, {
      defaultValue: {
        items: [],
        meta: {
          total: 0
        }
      }
    })
  },
  mutations: {
    logout(state) {
      state.token = ''
    },

    setToken(state, token) {
      state.token = token
    }
  },
  actions: {
    loadPoints({ rootGetters }, variables) {
      return rootGetters.apollo.query({
        fetchPolicy: 'network-only',
        variables,
        query
      })
    },

    savePoint({ rootGetters }, { id, ...point }) {
      return rootGetters.apollo.mutate({
        mutation: gql`
          mutation createPoint($point: point!) {
            createPoint(point: $point) {
              details {
                id
                title
                description
              }
            }
          }
        `,
        variables: {
          point
        },
        optimisticResponse: {
          __typename: "Mutation",
          createPoint: {
            __typename: 'PointEvent',
            details: {
              __typename: 'Point',
              id,
              ...point,
            }
          }
        },
        update: push('createPoint.details', { to: query })
      })
    },

    refreshToken({ commit, rootGetters }, { query, variables }) {
      return rootGetters.apollo.query({ query, variables, fetchPolicy: 'no-cache' })
        .then(({ data }) => commit('setToken', data.refreshToken.token))
    },

    logout({ commit, rootGetters }) {
      rootGetters.apollo.clearStore()
        .then(() => commit('logout'))
    }
  }
})

export function mapAccessors(accessors) {
  return Object.entries(accessors).reduce((all, [name, deps]) => {

    all[name] = function mappedAccessor() {
      const args = deps.map(path => this[path])
      return this.$store.getters[name](...args)
    };

    return all
  }, {})
}
