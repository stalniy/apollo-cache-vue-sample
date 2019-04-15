const { ApolloServer, gql } = require('apollo-server')
const schema = require('./schema')

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const points = Array.from({ length: 3 }).map((_, i) => ({ id: String(i + 1), title: `Point #${i + 1}`, description: 'test' }))
const resolvers = {
  Query: {
    async points(_, { pagination }) {
      const startIndex = (pagination.page - 1) * pagination.pageSize
      return {
        items: points.slice(startIndex, startIndex + pagination.pageSize),
        meta: {
          total: points.length
        }
      }
    }
  },
  Mutation: {
    async createPoint(_, { point }) {
      const lastId = points.length > 0 ? Number(points[points.length - 1].id) : 0

      await delay(1000)
      point.id = String(lastId + 1)
      points.push(point)

      return {
        type: 'create',
        details: point
      }
    },

    async updatePoint(_, variables) {
      const point = points.find(p => variables.point.id === p.id)

      await delay(1000)

      if (point) {
        Object.assign(point, variables.point)
      }

      return {
        type: 'update',
        details: point
      }
    },

    deletePoint(_, { id }) {
      const index = points.findIndex(p => p.id === id)
      const point = points[index]

      if (index !== -1) {
        points.splice(index, 1)
      }

      return {
        type: 'delete',
        details: point
      }
    }
  }
}

async function createServer() {
  return new ApolloServer({
    typeDefs: gql(schema),
    resolvers,
    introspection: true,
    playground: true,
  })
}

createServer()
  .then((server) => {
    const port = 4444
    server.listen(port, () => {
      console.log(`🚀  Server ready at http://localhost:${port}${server.graphqlPath}`) // eslint-disable-line
    })
  })
  .catch((error) => {
    console.error('Unable to start appState') // eslint-disable-line
    console.error(error) // eslint-disable-line
  })
