import React, { useState } from "react";
import {
  RegisterAsUserButton,
  RegisterCompanyButton,
  RegisterWrapper,
} from "./styles";
import { Redirect } from "react-router-dom";
//COMPONENT DECLARATION & EXPORT - SSO CONTROLS ON VIEWER LOGIN PAGE- SENDS INVITE INFO TO KAART SSO FOR NE USERS
export const SSOControl = (props) => {
  const [redirect, setRedirect] = useState(false);
  return (
    <>
      <RegisterWrapper>
        <RegisterAsUserButton
          // style={{
          //   display: "inline-block",
          //   position: "relative",
          //   backgroundColor: "transparent",
          //   cursor: "pointer",
          //   border: 0,
          //   paddingLeft: "0.25rem",
          //   color: "#4183c4",
          //   textDecoration: "none",
          // }}
          onClick={() => setRedirect(true)}
        >
          Register as user
        </RegisterAsUserButton>
        <RegisterCompanyButton
          onClick={() =>
            window.open(
              "http://my.kaart.com/register?method=admin&integrations=".concat(
                props.integrations
              ),
              "_blank",
              "width=720, height=800"
            )
          }
        >
          Register as admin
        </RegisterCompanyButton>
      </RegisterWrapper>
      <button
        style={{
          display: "inline-block",
          position: "relative",
          backgroundColor: "transparent",
          cursor: "pointer",
          border: 0,
          paddingLeft: "0.25rem",
          color: "#4183c4",
          textDecoration: "none",
        }}
        onClick={() =>
          window.open(
            "https://my.kaart.com/password-reset",
            "_blank",
            "width=800, height=600"
          )
        }
      >
        Forgot password?
      </button>
      {!redirect ? <></> : <Redirect push to="/registerUser" />}
    </>
  );
};
