<template>
  <div>
    <el-button @click.native="stop">stop</el-button>

    <div class="hello" v-if="points">
      <button type="button" @click="load">fetch</button>
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
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { graphQlClient } from '../plugins/apollo'
import * as POINT_GQL from '../queries'

// TODO:
// mapQuery ?
// mapMutation ?
// mapQueryResult ?
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
      return this.query.currentResult().data.points
    },

    isLoading2() {
      return this.query.currentResult().loading
    },

    maxPage() {
      return Math.ceil(this.points.meta.total / this.variables.pagination.pageSize)
    },
  },

  watch: {
    'variables.pagination.page': {
      immediate: true,
      handler() {
        this.load(this.variables)
      }
    }
  },

  methods: {
    ...mapActions(['savePoint', 'destroyPointById']),
    ...mapMutations(['check']),

    save() {
      this.savePoint({ id: -1, ...this.newPoint })
    },

    destroyItem(point) {
      return this.destroyPointById(point.id)
    },

    edit(point) {
      Object.assign(this.newPoint, point)
    },

    load(variables) {
      if (this._unsubscribe) {
        this._unsubscribe()
        this.$off('hook:beforeDestroy', this._unsubscribe)
        this._unsubscribe = null
      }

      this.query = graphQlClient.watchQuery({
        query: POINT_GQL.getAll,
        variables
      })
      this.isLoading = true
      const subscription = this.query.subscribe(() => {
        this.isLoading = false
      })

      this._unsubscribe = () => subscription.unsubscribe()
      this.$once('hook:beforeDestroy', this._unsubscribe)
    },

    stop() {
      if (this._unsubscribe) {
        this._unsubscribe()
        this.$off('hook:beforeDestroy', this._unsubscribe)
        this._unsubscribe = null
      }
    },

    test() {
      this.variables.pagination.page = 2
      this.load(this.variables)
    }
  },
}
</script>
