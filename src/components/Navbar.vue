<script>
import gql from 'graphql-tag'

export default {
  created() {
    this.query = this.$createQuery(gql`
      query getUser {
        user {
          firstName
          lastName
        }
      }
    `)
    this.query.fetch()
  },

  render(h) {
    console.log('called user render?')

    const text = this.query.results ? `${this.query.results.firstName} ${this.query.results.lastName}` : 'Loading...'

    return h('div', null, [text])
  }
}
</script>
