import Vue from 'vue'
import Vuex from 'vuex'
import { graphQlClient } from './plugins/apollo'
import getByPath from 'lodash/get'
import * as POINT_GQL from './queries'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAiLCJ0aSI6IjEyMzQ1IiwicnVsZXMiOlt7ImFjdGlvbnMiOiJyZWFkIiwic3ViamVjdCI6IlBvaW50In0seyJhY3Rpb25zIjoicmVhZCIsInN1YmplY3QiOiJNZXNzYWdlIn0seyJhY3Rpb25zIjoibWFuYWdlIiwic3ViamVjdCI6IlBvaW50IiwiY29uZGl0aW9ucyI6eyJjcmVhdG9ySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAifX0seyJhY3Rpb25zIjpbInJlYWQiLCJ1cGRhdGUiXSwic3ViamVjdCI6IlVzZXIiLCJjb25kaXRpb25zIjp7Il9pZCI6IjVjNjA3MGNmZjgwMDRkZThkOGE0NjI1MCJ9fSx7ImFjdGlvbnMiOlsiY3JlYXRlIiwiZGVsZXRlIl0sInN1YmplY3QiOiJNZXNzYWdlIiwiY29uZGl0aW9ucyI6eyJjcmVhdG9ySWQiOiI1YzYwNzBjZmY4MDA0ZGU4ZDhhNDYyNTAifX1dLCJkZXZpY2VJZCI6IjVjNjA3MTBmNTM1YTU5NTkxOThkMjI4YyIsImV4cCI6MTU3OTYzMjI3MX0.SHLIUPk_t8POtIUUAxPVM2ynmSYwFjY8H8ZrFUQxitQ',
    test: true
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
  },
  mutations: {
    logout(state) {
      state.token = ''
    },

    setToken(state, token) {
      state.token = token
    },

    check(state) {
      console.log('call', state)
      state.test = Date.now()
    }
  },
  actions: {
    destroyPointById({ getters, }, id) {
      return getters.apollo.mutate({
        mutation: POINT_GQL.remove,
        variables: { id }
      })
    },

    savePoint({ rootGetters }, { id, ...point }) {
      const type = id === -1 ? 'createPoint' : 'updatePoint'
      const data = id === -1 ? point : { id, ...point }

      return rootGetters.apollo.mutate({
        mutation: id === -1 ? POINT_GQL.create : POINT_GQL.update,
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
