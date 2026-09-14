import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  getAccessToken,
  loginUser,
  saveAccessToken,
  logoutUser,
} from "../services/api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);


  /*
    Check whether an existing JWT is still valid
    when the application starts.
  */
  useEffect(() => {
    async function restoreSession() {
      const token = getAccessToken();

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error(
          "Failed to restore authentication session:",
          error
        );

        logoutUser();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);


  /*
    Normal username/password login.
  */
  async function login(credentials) {
    const response = await loginUser(credentials);

    saveAccessToken(response.access_token);

    const currentUser = await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  }


  /*
    Logout the current user.
  */
  function logout() {
    logoutUser();
    setUser(null);
  }


  const value = {
    user,
    isAuthenticated: Boolean(user),
    authLoading,
    login,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


/*
  Hook used by components/pages that need
  authentication information.
*/
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}