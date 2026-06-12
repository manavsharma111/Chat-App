import axios from 'axios'

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
})

export default axiosInstance