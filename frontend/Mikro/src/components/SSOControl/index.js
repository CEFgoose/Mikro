import React, { useState, useContext } from "react";
import { DataContext } from "common/DataContext";
import {
  RegisterAsUserButton,
  RegisterCompanyButton,
  RegisterWrapper,
} from "./styles";

//COMPONENT DECLARATION & EXPORT - SSO CONTROLS ON MIKRO LOGIN PAGE- SENDS INVITE INFO TO KAART SSO FOR NE USERS
export const SSOControl = (props) => {
  const [Navigate, setRedirect] = useState(false);
  const { history } = useContext(DataContext);
  return (
    <>
      <RegisterWrapper>
        <RegisterAsUserButton onClick={() => history("/registerUser")}>
          Register as user
        </RegisterAsUserButton>
        <RegisterCompanyButton
          // onClick={() =>
          //   window.open(
          //     "http://my.kaart.com/register?method=admin&integrations=".concat(
          //       props.integrations
          //     ),
          //     "_blank",
          //     "width=720, height=800"
          //   )
          // }
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
    </>
  );
};
