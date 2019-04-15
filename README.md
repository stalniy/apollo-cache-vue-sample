# vue-graphql

## Project setup

UI:
```sh
npm ci
```

API:

```sh
cd api
npm ci
```

### Compiles and hot-reloads for development

```sh
npm run serve
```

### Compiles and minifies for production
```sh
npm run build
```

### Run server

```sh
cd api
npm run dev
```

## Issues which this repo solves

1. Reactive Apollo Cache (with help of Vue reactivity)
2. Apollo cache updates (https://github.com/apollographql/apollo-feature-requests/issues/97)
3. Apollo mutations integration similar to Vuex `mapMutations` (with easier use of `optimisticResponse`)
4. Ability to easily create apollo queries with auto disposal mechanism and simpler interface to access query response (`thi.$createQuery`)

## Explanations

The idea is to make integration between Apollo and Vue to be similar to [Vuex](https://vuex.vuejs.org/guide/) as much as possible.

In this repository, I implemented idea which I shared in apollo-features repo. In short, I think that Apollo should allow queries to subscribe to mutations and update own cache.

To make the process transparent and clear I exposed `configureCache` object in `GraphqlClient` ([sample](./src/plugins/apollo.js#L28)). Each key in that object is a function with the name that corresponds to GraphQL query name. Each time a new query is created (`watchQuery` is invoked), it calls one of that functions.

For example, the next query has name `getPoints` and it should be used as `configureCache` function in case if you want to update that query cache:

```graphql
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
```

By the way, every `GqlQuery` has observable `isLoading` property

Similar approach is used in `mapMutations` mapper. It takes mutation name and converts it to method with that name in Vue component.
For example, if we map this mutation inside component

```graphql
mutation updatePoint($point: PointPayload!) {
  updatePoint(point: $point) {
    details {
      id
      title
      description
    }
  }
}
```

it can be used like this later:

```js
this.updatePoint({ point: ... }, otherOptionalOptions)
```
