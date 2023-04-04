import React, { useState, useContext } from "react";
import { DataContext } from "common/DataContext/index.js";
import { SSO_URL } from "components/constants.js";
import { poster } from "calls.js";
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

  


  


    async function RegisterUserSSO() {
      let url = "register_user";
      let outpack = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        org: org,
      };

      await poster(outpack, url).then((response) => {
        let code = response.code;
        setResponseMessage(response.message);
        setResponseCode(code);
      });
    }

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
