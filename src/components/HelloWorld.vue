<template>
  <div>
    <el-button @click.native="stop">stop</el-button>
    <button type="button" @click="load">fetch</button>

    <div class="hello" v-if="points">
      <el-table :data="points.items">
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="title" label="Title" />
        <el-table-column prop="description" label="Description" />
        <el-table-column>
          <template slot-scope="{ row }">
            <el-button @click="edit(row)">edit</el-button>
            <el-button type="danger" @click="destroyItem(row)">delete</el-button>
          </template>
        </el-table-column>
      </el-table>


      <el-pagination
        v-if="maxPage > 1"
        layout="prev, pager, next"
        :page-count="maxPage"
        :current-page.sync="variables.pagination.page"
      />

      <el-button @click="fetchMore">Load more</el-button>

      <hr />

      <el-form :model="newPoint">
        <el-form-item prop="title" label="Title">
          <el-input v-model="newPoint.title" />
        </el-form-item>
        <el-form-item prop="description" label="Description">
          <el-input v-model="newPoint.description" type="textarea" />
        </el-form-item>

        <el-button @click.native="save">Save</el-button>
      </el-form>
    </div>
    <div v-else>Loading...</div>
  </div>
</template>

<script>
import { mapMutations } from '../plugins/helpers'
import * as POINT_GQL from '../queries'

// TODO:
// update cache on subscription event ?
// query.fetchMore({ updateQuery() {} }) ?

export default {
  name: 'HelloWorld',

  data: () => ({
    isLoading: false,
    variables: {
      pagination: {
        page: 1,
        pageSize: 5,
      }
    },
    newPoint: {
      title: '',
      description: '',
    }
  }),

  computed: {
    token() {
      return this.$store.state.token
    },

    points() {
      return this.query.results
    },

    maxPage() {
      return Math.ceil(this.points.meta.total / this.variables.pagination.pageSize)
    },
  },

  beforeCreate() {
    this.query = this.$createQuery(POINT_GQL.getAll)
  },

  created() {
    this.load()
  },

  methods: {
    ...mapMutations([
      POINT_GQL.create,
      POINT_GQL.update,
      POINT_GQL.remove
    ]),

    save() {
      const variables = { point: this.newPoint }
      const optimisticResponse = {
        __typename: 'Point',
        id: -1,
        ...this.newPoint
      }
      const options = { optimisticResponse }

      if (this.newPoint.id) {
        this.updatePoint(variables, options)
      } else {
        this.createPoint(variables, options)
      }
    },

    destroyItem(point) {
      return this.deletePoint({ id: point.id })
    },

    edit(point) {
      Object.assign(this.newPoint, point)
    },

    load(vars) {
      return this.query.fetch(vars || this.variables)
    },

    fetchMore() {
      this.variables.pagination.page++
      return this.query.fetchMore(this.variables)
    },

    stop() {
      this.query.abort()
    },

    test() {
      this.variables.pagination.page = 2
      this.load(this.variables)
    }
  },
}
</script>
