import React, { useContext } from "react";
import { Redirect, Route } from "react-router-dom";
import { AuthContext } from "common/AuthContext";

export const PrivateRoute = ({ children, role, admin, ...rest }) => {
  const { user } = useContext(AuthContext);
  const loggedIn = () => user;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        loggedIn() && (admin ? user.role === "admin" : true) ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: loggedIn() ? "/dashboard" : "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};
