import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  responseType: "json",
})

export default apiClient
