//IMPORTS
import { AuthContext } from "common/AuthContext";
import { DataContext } from "common/DataContext";
import { API_URL, SSO_URL } from "components/constants";
import { PreloaderIcon } from "components/Preloader";
import { SSOControl } from "components/SSOControl";
import Cookie from "js-cookie";
import React, { useContext, useEffect, useState } from "react";
import kaartLogo from "../../images/20-KAART-Color.svg";

import {
  LoginButton,
  LoginForm,
  LoginImage,
  LoginInput,
  LoginPage,
} from "./styles";

//VARIABLES
var checkrole;

//COMPONENT SETUP & DECLARATION
export const Login = () => {
  //COMPONENT STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //STATES FROM DATA CONTEXT
  const { fetching, setFetching, showAlert, history } = useContext(DataContext);

  //STATES FROM AUTH CONTEXT
  const { setUser } = useContext(AuthContext);

  //EMAIL FIELD CHANGE HANDLER - SETS ENTRY TO STATE
  const onEmailChange = (e) => {
    setEmail(e.target.value);
  };
  //PASSWORD FIELD CHANGE HANDLER - SETS ENTRY TO STATE
  const onPasswordChange = (e) => {
    setPassword(e.target.value);
  };

  //LOGIN FUNCTION - CHANGE URL FOR DEPLOYMENT
  const login = () => {
    let url = API_URL.concat("login");
    fetch(url, {
      method: "post",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRF-TOKEN": `${Cookie.get("csrf_access_token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw response;
        return response.json();
      })
      .then((data) => {
        setFetching(false);
        setUser(data);
        checkrole = data.role;
      })
      .then(() =>
        history.push(checkrole === "admin" ? "/admindash" : "/dashboard")
      );
    // .catch((error) => {
    //   setFetching(false);
    //   if (error.status && error.status === 400) {
    //     return error.json();
    //   } else alert("danger", "Failed to log in", "An error occurred");
    // })
    // .then((err) => {
    //   if (err) alert("danger", "Failed to log in", err["message"]);
    // });
  };

  //COMPONENT RENDER
  return (
    <>
      <LoginPage>
        <LoginForm
          //TRIGGERS THE LOGIN API CALL ON FORM SUBMIT
          onSubmit={(e) => {
            e.preventDefault();
            fetch(SSO_URL.concat("auth/login"), {
              method: "POST",
              mode: "cors",
              credentials: "include",
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: email,
                password: password,
              }),
            })
              .then((response) => {
                if (!response.ok) throw response;
                return response;
              })
              .then(() => {
                // successfully logged into SSO, now login to Viewer
                login();
              });
            // .catch((error) => {
            //   setFetching(false);
            //   if (error.status && error.status === 400) {
            //     return error.json();
            //   } else
            //     showAlert("danger", "Failed to log in", "An error occurred");
            // })
            // .then((err) => {
            //   if (err)
            //     showAlert("danger", "Failed to log in", err["message"]);
            // });
          }}
        >
          <LoginImage src={kaartLogo} alt="Kaart Logo" />
          <LoginInput
            name="email"
            type="text"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={onEmailChange}
          />
          <LoginInput
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={onPasswordChange}
          />
          <LoginButton type="submit">
            {fetching ? <PreloaderIcon /> : "Login"}
          </LoginButton>
        </LoginForm>
        <div>---------------------- or ----------------------</div>
        <SSOControl integrations="viewer" />
      </LoginPage>
    </>
  );
};
