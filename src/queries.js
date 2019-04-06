import gql from 'graphql-tag';

export const getAll = gql`
  query getPoints($pagination: pagination!) {
    points(filter: null, sort: "", pagination: $pagination) @connection(key: "points") {
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

export const create = gql`
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

export const update = gql`
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

export const remove = gql`
  mutation deletePoint($id: ID!) {
    deletePoint(id: $id) {
      details {
        id
      }
    }
  }
`
