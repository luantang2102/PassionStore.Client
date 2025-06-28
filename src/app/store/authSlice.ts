import { createSlice } from "@reduxjs/toolkit";
import { User } from "../models/responses/user";
import { authApi } from "../api/authApi";

interface AuthState {
  isAuthenticated: boolean;
  user: null | User;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.checkAuth.matchFulfilled, (state, { payload }) => {
      console.log("checkAuth fulfilled:", payload);
      state.isAuthenticated = true;
      state.user = payload;
      state.loading = false;
    });
    builder.addMatcher(authApi.endpoints.checkAuth.matchRejected, (state) => {
      console.log("checkAuth rejected");
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
    });
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.isAuthenticated = true;
      state.user = payload;
      state.loading = false;
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
    });
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;