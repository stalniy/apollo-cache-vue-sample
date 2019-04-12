module.exports = `
type Point {
  id: ID!
  title: String!
  description: String!
}

type CollectionMeta {
  total: Int!
}

type PaginatedPoints {
  items: [Point!]!
  meta: CollectionMeta!
}

input Pagination {
  page: Int!
  pageSize: Int!
}

type Query {
  points(pagination: Pagination!): PaginatedPoints!
}

type PointEvent {
  type: String!
  details: Point!
}

input PointPayload {
  id: ID
  title: String!
  description: String!
}

type Mutation {
  createPoint(point: PointPayload!): PointEvent!
  updatePoint(point: PointPayload!): PointEvent!
  deletePoint(id: ID!): PointEvent!
}
`
