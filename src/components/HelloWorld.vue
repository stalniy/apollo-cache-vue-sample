<template>
  <div class="hello">
    <button type="button" @click="loadPoints">fetch</button>

    <el-table :data="points.items">
      <el-table-column prop="id" label="ID" />
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="description" label="Description" />
    </el-table>

    <el-pagination
      v-if="maxPage > 0"
      layout="prev, pager, next"
      :total="maxPage"
      :current-page.sync="page"
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
import { mapActions } from 'vuex'
import { mapAccessors } from '../store'

export default {
  name: 'HelloWorld',

  data: () => ({
    page: 1,
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
    points() {
      return this.$store.getters.points(this.variables)
    },

    maxPage() {
      return Math.ceil(this.points.meta.total / 20)
    }
  },

  methods: {
    ...mapActions(['loadPoints', 'savePoint']),

    save() {
      this.savePoint({ id: -1, ...this.newPoint })
    }
  },
  async created() {
    await this.loadPoints()
  }
}
</script>
