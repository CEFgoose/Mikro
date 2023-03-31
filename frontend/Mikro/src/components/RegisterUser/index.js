import React, { useState, useContext } from "react";
import { DataContext } from "common/DataContext/index.js";
import { SSO_URL } from "components/constants.js";
import {
  ConfirmButton,
  SectionSubtitle,
} from "../commonComponents/commonComponents.js";
import {
  RegisterPage,
  RegisterForm,
  Title,
  RegisterInput,
  NameInput,
} from "./styles.js";

export const RegisterUser = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setlastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [responseMessage, setResponseMessage] = useState(null);
  const [responseCode, setResponseCode] = useState(null);
  const { history } = useContext(DataContext);

  


  
  const RegisterUserSSO = async () => {
    const body = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      org: org,
      int: "micro",
    };

    await fetch(SSO_URL.concat('auth/register_user?method=user&integrations=micro'), {
      method: "POST",
      // mode: "cors",
      credentials: "include",
      headers: {
        // "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body:body
    })
    .then((response)=>{
      if (response.ok) {
        let code = response.code;
        setResponseCode(code);
        if (code === 0) {
          setResponseMessage(
            "Mikro integration added to your Kaart account, you may log into Mikro any time."
          );
        } else if (code === 1) {
          setResponseMessage(
            "Account already exists with Mikro integration, you may log into Mikro any time."
          );
        } else if (code === 2) {
          setResponseMessage(
            "Your Kaart account has been created with Mikro integration, press the button below to activate your account!"
          );
        }
        return { responseMessage, responseCode };
      } else {
        throw new Error(
          `Failed to register user: ${response.status} ${response.statusText}`
        );
      }
    })
  };

  return (
    <>
      <RegisterPage>
        <RegisterForm>
          {/* <RegisterImage src={kaartLogo} alt="Kaart Logo"/> */}
          <Title>Sign Up Now</Title>
          <NameInput
            type="text"
            name="First Name"
            placeholder="First Name"
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
          <NameInput
            type="text"
            name="Last Name"
            placeholder="Last Name"
            onChange={(e) => {
              setlastName(e.target.value);
            }}
          />
          <RegisterInput
            type="text"
            name="Email"
            placeholder="Email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />

          <RegisterInput
            type="text"
            name="Password"
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <RegisterInput
            type="text"
            name="Organization"
            placeholder="Organization"
            onChange={(e) => {
              setOrg(e.target.value);
            }}
          />
          {responseCode && responseCode ? (
            <>
              <SectionSubtitle
                style={{ marginTop: "2vh" }}
                subtitle_text={responseMessage}
              />
            </>
          ) : (
            <></>
          )}
        </RegisterForm>
        <ConfirmButton
          confirm_text={
            responseCode &&
            (responseCode === 0 || responseCode === 1 || responseCode === 2)
              ? "Log In"
              : responseCode === 3
              ? "Activate Account"
              : "Submit"
          }
          confirm_action={
            responseCode === 0
              ? history("/login")
              : responseCode === 1
              ? history("/login")
              : responseCode === 2
              ? history("/login")
              : RegisterUserSSO
          }
        />
      </RegisterPage>
    </>
  );
};
