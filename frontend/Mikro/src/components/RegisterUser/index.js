import React, { useState, useContext } from "react";
import { DataContext } from "common/DataContext/index.js";
import useToggle from "hooks/useToggle";
import { poster } from "calls.js";
import {
  ConfirmButton,
  SectionSubtitle,
} from "../commonComponents/commonComponents.js";
import { TermsModal } from "./registrationComponents";
import { RegisterPage, RegisterForm, Title } from "./styles.js";
import mikro_icon from "../../images/5.png";
import { LoginImage } from "./styles";

import "../../App.css";

var checkrole;

export const RegisterUser = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setlastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [responseMessage, setResponseMessage] = useState(null);
  const [responseCode, setResponseCode] = useState(null);

  const [OSMusername, setOSMusername] = useState(null);
  const [payoneerEmail, setPayoneerEmail] = useState(null);
  const [termsAgreement, toggleTermsAgreement] = useToggle(false);
  const [country, setCountry] = useState(null);
  const [city, setCity] = useState(null);
  const { history } = useContext(DataContext);
  const [modalOpen, toggleModalOpen] = useToggle(false);

  const handleModalOpen = () => {
    toggleModalOpen();
  };

  async function RegisterUserSSO() {
    let url = "register_user";
    let outpack = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      org: org,
    };

    const registerResponse = await poster(outpack, url);
    let code = registerResponse.code;
    setResponseMessage(registerResponse.message);
    setResponseCode(code);
    intialLoginValues();
  }

  const intialLoginValues = () => {
    localStorage.setItem("firstLogin", "true");
    localStorage.setItem("osm_username", OSMusername);
    localStorage.setItem("payment_email", payoneerEmail);
    localStorage.setItem("country", country);
    localStorage.setItem("city", city);
    localStorage.setItem("termsAgreement", termsAgreement);
  };

  const handleSetTermsAgreement = () => {
    toggleTermsAgreement();
  };

  return (
    <>
      <TermsModal
        modalOpen={modalOpen}
        handleModalOpen={handleModalOpen}
        termsAgreement={termsAgreement}
        handleSetTermsAgreement={handleSetTermsAgreement}
      />
      <RegisterPage>
        <RegisterForm>
          <LoginImage
            style={{ marginTop: "2vh", marginBottom: "2vh" }}
            src={mikro_icon}
            alt="Kaart Logo"
          />
          <Title>Sign Up for Mikro</Title>
          <div
            style={{
              display: "flex",
              gap: "1vw",
            }}
          >
            <input
              type="text"
              name="First Name"
              placeholder="First Name"
              onChange={(e) => {
                setFirstName(e.target.value);
              }}
            />
            <input
              type="text"
              name="Last Name"
              placeholder="Last Name"
              onChange={(e) => {
                setlastName(e.target.value);
              }}
            />
          </div>
          <input
            type="text"
            name="Email"
            placeholder="Email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <input
            type="text"
            name="OSM Username"
            placeholder="OSM Username"
            onChange={(e) => {
              setOSMusername(e.target.value);
            }}
          />
          <input
            type="text"
            name="Payoneer Email"
            placeholder="Payoneer Email"
            onChange={(e) => {
              setPayoneerEmail(e.target.value);
            }}
          />

          <input
            type="password"
            name="Password"
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <input
            type="text"
            name="Organization"
            placeholder="Organization"
            onChange={(e) => {
              setOrg(e.target.value);
            }}
          />
          <div
            style={{
              display: "flex",
              gap: "1vw",
            }}
          >
            <input
              type="text"
              name="City"
              placeholder="City"
              onChange={(e) => {
                setCity(e.target.value);
              }}
            />
            <input
              type="text"
              name="Country"
              placeholder="Country"
              onChange={(e) => {
                setCountry(e.target.value);
              }}
            />
          </div>
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1vh",
          }}
        >
          <ConfirmButton
            confirm_action={() => handleModalOpen()}
            confirm_text={"Terms of Service"}
          />
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
                ? history("/dashboard")
                : RegisterUserSSO
            }
          />
        </div>
      </RegisterPage>
    </>
  );
};
