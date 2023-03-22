import { DataContext } from "common/DataContext";
import React, { useContext, useState } from "react";
import useToggle from "hooks/useToggle";
import { Redirect } from "react-router-dom";
import kaartLogo from "../../images/20-KAART-Color.svg";
import mikro_icon from "../../images/5.png";
import {
  SectionTitle,
  SectionSubtitle,
  StyledButton,
} from "components/commonComponents/commonComponents";
import { FirstLoginModal } from "./welcomePageCompnants";
import { LoginImage } from "./styles";
import { Typography } from "@mui/material";

export const WelcomeUserPage = () => {
  const [redirect, setRedirect] = useState(false);
  const [modalOpen, toggleModalOpen] = useToggle(false);
  const [modalPage, setModalPage] = useState(1);
  const [OSMusername, setOSMusername] = useState(null);
  const [payoneerEmail, setPayoneerEmail] = useState(null);
  const [termsAgreement, toggleTermsAgreement] = useToggle(false);
  const [country, setCountry] = useState(null);
  const [city, setCity] = useState(null);

  const { firstLoginUpdate, isValidEmail } = useContext(DataContext);

  const handleModalOpen = () => {
    toggleModalOpen();
    setModalPage(1);
    setOSMusername("");
    setPayoneerEmail("");
    setCity(null);
    setCountry(null);
  };

  const handleSetPayoneerEmail = (e) => {
    setPayoneerEmail(e.target.value);
  };

  const handleSetOSMusername = (e) => {
    setOSMusername(e.target.value);
  };

  const handleSetTermsAgreement = () => {
    toggleTermsAgreement();
  };

  const handleSetCountry = (e) => {
    console.log(e);
    setCountry(e.target.value);
  };

  const handleSetCity = (e) => {
    setCity(e.target.value);
  };

  const handleSetModalPage = (e) => {
    if (e === 2) {
      if (OSMusername) {
        setModalPage(e);
      } else {
        alert("You Must Enter Your OSM Username to Proceed");
      }
    }
    if (e === 3) {
      if (payoneerEmail && isValidEmail(payoneerEmail)) {
        setModalPage(e);
      } else {
        alert("You Must Enter Your Payoneer Email address to Proceed");
      }
    }
    if (e === 4) {
      if (city && country) {
        setModalPage(e);
      } else {
        alert("You enter your Country and City of residence to Proceed");
      }
    }

    if (e === 5) {
      if (termsAgreement !== false) {
        setModalPage(e);
      } else {
        alert(
          "You must check the box indicating you agree to the Mikro terms of service to Proceed"
        );
      }
    }
    if (e === 0) {
      firstLoginUpdate(
        OSMusername,
        payoneerEmail,
        country,
        city,
        termsAgreement
      );
      setRedirect(true);
    }
  };

  //COMPONENT RENDER
  return (
    <>
      <FirstLoginModal
        modalOpen={modalOpen}
        handleModalOpen={handleModalOpen}
        OSMusername={OSMusername}
        handleSetOSMusername={handleSetOSMusername}
        modalPage={modalPage}
        handleSetModalPage={handleSetModalPage}
        payoneerEmail={payoneerEmail}
        handleSetPayoneerEmail={handleSetPayoneerEmail}
        termsAgreement={termsAgreement}
        handleSetTermsAgreement={handleSetTermsAgreement}
        city={city}
        country={country}
        handleSetCity={handleSetCity}
        handleSetCountry={handleSetCountry}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <LoginImage
          style={{ marginTop: "10vh" }}
          src={mikro_icon}
          alt="Kaart Logo"
        />
        <Typography component="span" variant="h1" sx={{ color: "#000000" }}>
          Welcome to Mikro!
        </Typography>
        <SectionTitle
          title_text={
            "There are a few more steps to get you ready to use Mikro"
          }
        />
        <SectionTitle title_text={"Press the button below to begin"} />
        <div style={{ marginTop: "2vh" }}>
          <StyledButton
            button_text={"Begin"}
            button_action={() => handleModalOpen()}
          />
        </div>
      </div>
      {!redirect ? <></> : <Redirect push to="/dashboard" />}
    </>
  );
};
