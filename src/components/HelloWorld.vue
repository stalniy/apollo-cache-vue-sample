<template>
  <div>
    <el-button @click="abort">abort request</el-button>
    <el-button @click="load()">fetch</el-button>

    <el-button @click="indirectCacheUpdate">fetch point</el-button>

    <h2>test client cache mapping</h2>
    {{ ui.items }}
    <el-collapse v-model="ui.items">
      <el-collapse-item title="Consistency" name="1">
        <div>Consistent with real life: in line with the process and logic of real life, and comply with languages and habits that the users are used to;</div>
        <div>Consistent within interface: all elements should be consistent, such as: design style, icons and texts, position of elements, etc.</div>
      </el-collapse-item>
      <el-collapse-item title="Feedback" name="2">
        <div>Operation feedback: enable the users to clearly perceive their operations by style updates and interactive effects;</div>
        <div>Visual feedback: reflect current state by updating or rearranging elements of the page.</div>
      </el-collapse-item>
      <el-collapse-item title="Efficiency" name="3">
        <div>Simplify the process: keep operating process simple and intuitive;</div>
        <div>Definite and clear: enunciate your intentions clearly so that the users can quickly understand and make decisions;</div>
        <div>Easy to identify: the interface should be straightforward, which helps the users to identify and frees them from memorizing and recalling.</div>
      </el-collapse-item>
      <el-collapse-item title="Controllability" name="4">
        <div>Decision making: giving advices about operations is acceptable, but do not make decisions for the users;</div>
        <div>Controlled consequences: users should be granted the freedom to operate, including canceling, aborting or terminating current operation.</div>
      </el-collapse-item>
    </el-collapse>

    <h2>test CRUD</h2>
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
import { mapMutations, mapClientQueries } from '../plugins/helpers'
import * as POINT_GQL from '../queries'

// TODO:
// update cache on subscription event ?

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
    points() {
      return this.query.results
    },

    maxPage() {
      return Math.ceil(this.points.meta.total / this.variables.pagination.pageSize)
    },

    ...mapClientQueries([
      POINT_GQL.visibility,
    ]),
  },

  beforeCreate() {
    this.query = this.$createQuery(POINT_GQL.getAll)
    this.pointQuery = this.$createQuery(POINT_GQL.getPoint)
  },

  created() {
    this.load()
  },

  methods: {
    ...mapMutations([
      POINT_GQL.create,
      POINT_GQL.update,
      POINT_GQL.remove,
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

    abort() {
      this.query.abort()
    },

    toggleVisibility() {
      this.ui.items.pop()
    },

    indirectCacheUpdate() {
      return this.pointQuery.fetch()
    }
  },
}
</script>
