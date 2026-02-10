import api from "./api";

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

/**
 * Extract data from the standardized API response format.
 * Backend returns: { status: 'success'|'error', data: {...}|null, error: {...}|null }
 * @param {object} response - Axios response object
 * @returns {object} The data payload from the response
 * @throws {Error} If response indicates an error
 */
const extractResponseData = (response) => {
  const { status, data, error } = response.data;

  if (status === "error" || error) {
    const errorMessage = error?.message || "An unexpected error occurred";
    const errorCode = error?.code || "UNKNOWN_ERROR";
    const err = new Error(errorMessage);
    err.code = errorCode;
    throw err;
  }

  return data;
};

export const authService = {
  /**
   * Login with email and password
   * Matches backend: POST /api/auth/login
   * Response: { status, data: { message, user: { id, email, role }, token, refresh_token, auth_mode }, error }
   */
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const data = extractResponseData(response);

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    }

    return {
      message: data.message,
      token: data.token,
      refresh_token: data.refresh_token,
      user: data.user,
      auth_mode: data.auth_mode,
    };
  },

  /**
   * Register a new user
   * Matches backend: POST /api/auth/register
   * Response: { status, data: { message, user: { id, email, role, firebase_uid? }, token, refresh_token, auth_mode }, error }
   */
  async register(userData) {
    const response = await api.post("/auth/register", {
      email: userData.email,
      password: userData.password,
      role: userData.role || "user",
    });
    const data = extractResponseData(response);

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    }

    return {
      message: data.message,
      token: data.token,
      refresh_token: data.refresh_token,
      user: data.user,
      auth_mode: data.auth_mode,
    };
  },

  /**
   * Update user profile
   * Matches backend: PUT /api/auth/profile
   * Response: { status, data: { message, user: { id, email, role, firebase_uid, synced }, firebase_synced }, error }
   */
  async updateProfile(userData) {
    const response = await api.put("/auth/profile", userData);
    const data = extractResponseData(response);

    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return {
      message: data.message,
      user: data.user,
      firebase_synced: data.firebase_synced,
    };
  },

  /**
   * Refresh access token using refresh token
   * Matches backend: POST /api/auth/refresh
   * Response: { status, data: { message, user: { id, email, role }, token, refresh_token, auth_mode }, error }
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    const data = extractResponseData(response);

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    }

    return {
      message: data.message,
      token: data.token,
      refresh_token: data.refresh_token,
      user: data.user,
      auth_mode: data.auth_mode,
    };
  },

  /**
   * Get current authenticated user info from backend
   * Matches backend: GET /api/auth/me
   * Response: { status, data: { user: { id, email, role, firebase_uid }, auth_mode }, error }
   */
  async fetchCurrentUser() {
    const response = await api.get("/auth/me");
    const data = extractResponseData(response);

    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return {
      user: data.user,
      auth_mode: data.auth_mode,
    };
  },

  /**
   * Logout user
   * Matches backend: POST /api/auth/logout
   * Response: { status, data: { message }, error }
   */
  async logout() {
    try {
      // Notify backend (optional, for stateless API)
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore errors on logout - we'll clear local storage anyway
      console.warn("Logout API call failed:", error.message);
    } finally {
      // Always clear local storage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Get current user from local storage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get access token from local storage
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get refresh token from local storage
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Check if current user is a manager
   */
  isManager() {
    const user = this.getCurrentUser();
    return user?.role === "manager" || user?.role === "admin";
  },
};
