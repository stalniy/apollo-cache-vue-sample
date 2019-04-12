import gql from 'graphql-tag';

export const getAll = gql`
  query getPoints($pagination: Pagination!) {
    points(pagination: $pagination) @connection(key: "points") {
      meta {
        total
      }
      items {
        title
        id
        description
      }
    }
  }
`;

export const create = gql`
  mutation createPoint($point: PointPayload!) {
    createPoint(point: $point) {
      details {
        id
        title
        description
      }
    }
  }
`

export const update = gql`
  mutation updatePoint($point: PointPayload!) {
    updatePoint(point: $point) {
      details {
        id
        title
        description
      }
    }
  }
`

export const remove = gql`
  mutation deletePoint($id: ID!) {
    deletePoint(id: $id) {
      details {
        id
      }
    }
  }
`
