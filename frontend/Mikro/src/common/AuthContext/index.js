import React, { createContext, useContext } from "react";
import { SSO_URL } from "components/constants";
import { useLocalStorageState } from "common/useLocalStorageState";
import Cookie from "js-cookie";
import { DataContext } from "common/DataContext";
export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorageState("viewer.user", null);

  const { history } = useContext(DataContext);

  const logout = () => {
    fetch(SSO_URL.concat("auth/logout"), {
      method: "POST",
    }).then(() => {
      setUser(null);
    });
  };

  const refresh = () => {
    fetch(SSO_URL.concat("auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-TOKEN": Cookie.get("csrf_access_token") },
    })
      .then((response) => {
        if (!response.ok) {
          alert("Refreshing access token failed, please log in again");
          history.push("/login");
        }
        return response;
      })
      .catch(() => {
        alert("Refreshing access token failed, please log in again");
        history.push("/login");
      })
      .then(() => {});
  };

  const value = {
    logout,
    refresh,
    user,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
