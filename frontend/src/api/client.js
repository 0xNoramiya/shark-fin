import axios from 'axios'

const API_KEY = import.meta.env.VITE_API_KEY || 'sharkfin-demo-key-2026'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
})

export default client
