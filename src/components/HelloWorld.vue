<template>
  <div class="hello" v-if="points">
    <button type="button" @click="load">fetch</button>
    {{ point }}

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
      :current-page.sync="variables.page"
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
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'HelloWorld',

  data: () => ({
    query: null,
    variables: {
      page: 1,
      pageSize: 5,
    },
    newPoint: {
      title: '',
      description: '',
      geo: {
        type: 'Point',
        coordinates: [50.400178, 30.326637]
      }
    }
  }),

  computed: {
    ...mapGetters({
      buildQuery: 'loadPointsQuery',
      point: 'myPoint',
    }),

    points() {
      return this.query.currentResult().data.points
    },

    maxPage() {
      return Math.ceil(this.points.meta.total / 5)
    }
  },

  watch: {
    'variables.page': 'load'
  },

  methods: {
    ...mapActions(['savePoint', 'destroyPointById']),

    save() {
      this.savePoint({ id: -1, ...this.newPoint })
    },

    destroyItem(point) {
      return this.destroyPointById(point.id)
    },

    edit(point) {
      Object.assign(this.newPoint, point)
    },

    load() {
      return this.query.load({ pagination: this.variables })
    }
  },
  async created() {
    this.query = this.buildQuery()
    await this.load()

    this.$once('hook:beforeDestroy', () => this.query.tearDownQuery())
  }
}
</script>
