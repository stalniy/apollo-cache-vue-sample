import Vue from 'vue'
import Vuex from 'vuex'
import gql from 'graphql-tag';
import { graphQlClient, mapApolloCache } from './plugins/apollo'
import getByPath from 'lodash/get'

Vue.use(Vuex)

const loadPointsQuery = gql`
  query getPoints($pagination: pagination!) {
    points(filter: null, sort: "", pagination: $pagination) {
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

const createPoint = gql`
  mutation createPoint($point: point!) {
    createPoint(point: $point) {
      details {
        id
        title
        description
      }
    }
  }
`

const updatePoint = gql`
  mutation updatePoint($point: point!) {
    updatePoint(point: $point) {
      details {
        id
        title
        description
      }
    }
  }
`

const destroyPoint = gql`
  mutation destroyPoint($id: ID!) {
    deletePoint(id: $id) {
      details {
        id
      }
    }
  }
`
export default new Vuex.Store({
  state: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAiLCJ0aSI6IjEyMzQ1IiwicnVsZXMiOlt7ImFjdGlvbnMiOiJyZWFkIiwic3ViamVjdCI6IlBvaW50In0seyJhY3Rpb25zIjoicmVhZCIsInN1YmplY3QiOiJNZXNzYWdlIn0seyJhY3Rpb25zIjoibWFuYWdlIiwic3ViamVjdCI6IlBvaW50IiwiY29uZGl0aW9ucyI6eyJjcmVhdG9ySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAifX0seyJhY3Rpb25zIjpbInJlYWQiLCJ1cGRhdGUiXSwic3ViamVjdCI6IlVzZXIiLCJjb25kaXRpb25zIjp7Il9pZCI6IjVjNjA3MGNmZjgwMDRkZThkOGE0NjI1MCJ9fSx7ImFjdGlvbnMiOlsiY3JlYXRlIiwiZGVsZXRlIl0sInN1YmplY3QiOiJNZXNzYWdlIiwiY29uZGl0aW9ucyI6eyJjcmVhdG9ySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAifX1dLCJkZXZpY2VJZCI6IjVjNjA3MTBmNTM1YTU5NTkxOThkMjI4YyIsImV4cCI6MTU3OTYzMjI3MX0.SHLIUPk_t8POtIUUAxPVM2ynmSYwFjY8H8ZrFUQxitQ',
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
    myPoint(state, getters) {
      return getters.apollo.readFragment({
        id: `Point:5c7c4c5402eb9635ab554902`,
        fragment: gql`
          fragment myPoint on Point {
            id
            title
            description
          }
        `
      })
    },
    loadPointsQuery(state, getters) {
      return () => {
        const query = getters.apollo.watchQuery({
          fetchPolicy: 'cache-and-network',
          query: loadPointsQuery,
        })

        query.on(createPoint, (current, response) => {
          current.items.push(response.createPoint.details)
          current.meta.total++
        })

        query.on(destroyPoint, (current, response) => {
          const id = response.deletePoint.details.id
          current.items = current.items.filter(item => item.id !== id)
          current.meta.total--
        })

        // query.on(newPoint, (prev, response) => {

        // })

        return query
      }
    }
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
    destroyPointById({ getters, }, id) {
      return getters.apollo.mutate({
        mutation: destroyPoint,
        variables: { id }
      })
    },

    savePoint({ rootGetters }, { id, ...point }) {
      const type = id === -1 ? 'createPoint' : 'updatePoint'
      const data = id === -1 ? point : { id, ...point }

      return rootGetters.apollo.mutate({
        mutation: id === -1 ? createPoint : updatePoint,
        variables: {
          point: JSON.parse(JSON.stringify(data), (key, value) => {
            return key === '__typename' ? undefined : value
          })
        },
        optimisticResponse: {
          __typename: "Mutation",
          [type]: {
            __typename: 'PointEvent',
            details: {
              __typename: 'Point',
              id,
              ...point,
            }
          }
        },
      })
    },

    refreshToken({ commit, rootGetters }, { query, variables }) {
      return rootGetters.apollo.query({ query: loadPointsQuery, variables, fetchPolicy: 'no-cache' })
        .then(({ data }) => commit('setToken', data.refreshToken.token))
    },

    logout({ commit, rootGetters }) {
      rootGetters.apollo.clearStore()
        .then(() => commit('logout'))
    }
  }
})
