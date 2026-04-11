import { createSlice } from '@reduxjs/toolkit'

const persistedToken = sessionStorage.getItem('token') || localStorage.getItem('token')
const persistedUser = sessionStorage.getItem('user') || localStorage.getItem('user')

if (persistedToken && !sessionStorage.getItem('token')) {
  sessionStorage.setItem('token', persistedToken)
}

if (persistedUser && !sessionStorage.getItem('user')) {
  sessionStorage.setItem('user', persistedUser)
}

localStorage.removeItem('token')
localStorage.removeItem('user')

const initialState = {
  user: persistedUser ? JSON.parse(persistedUser) : null,
  token: persistedToken,
  role: persistedUser ? JSON.parse(persistedUser).role : null,
  isAuthenticated: Boolean(persistedToken),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      const { user, role, token } = action.payload
      state.user = user
      state.role = role
      state.token = token
      state.isAuthenticated = true
      if (token) {
        sessionStorage.setItem('token', token)
      }
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user))
      }
    },
    logout(state) {
      state.user = null
      state.role = null
      state.token = null
      state.isAuthenticated = false
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const { setAuth, logout } = authSlice.actions
export default authSlice.reducer
