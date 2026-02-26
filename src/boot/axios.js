import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'

const api = axios.create({ baseURL: API_BASE_URL })

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  // Provide for Composition API (inject)
  app.provide('api', api)
  app.provide('axios', axios)
})

export { axios, api }
