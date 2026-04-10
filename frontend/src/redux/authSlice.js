import { createSlice } from '@reduxjs/toolkit'

const persistedToken = localStorage.getItem('token')
const persistedUser = localStorage.getItem('user')

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
        localStorage.setItem('token', token)
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }
    },
    logout(state) {
      state.user = null
      state.role = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const { setAuth, logout } = authSlice.actions
export default authSlice.reducer
