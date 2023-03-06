//IMPORTS
import { DataContext } from "common/DataContext";
import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "components/AdminDash/styles";

//COMPONENT DECLARATION & SETUP - PAGE NOT FOUND PLACEHOLDER PAGE
export const PageNotFound = () => {
  //STATE FROM DATA CONTEXT
  const { history } = useContext(DataContext);
  //USE LOCATION REF
  const location = useLocation();
  const { from } = location.state || { from: { pathname: "/" } };
  //WINDOW HEIGHT VAR FOR RESIZING SCREEN
  const getViewHeight = () => {
    return window.innerHeight - 100;
  };
  // COMPONENT RENDER
  return (
    <div
      style={{
        padding: "10px",
        height: getViewHeight(),
        width: "100%",
        backgroundColor: "white",
      }}
    >
      <p style={{ textAlign: "center", marginTop: "20%" }}>
        Page Not Found
        <br />
        <br />
        <Button onClick={() => history.push(from)}>Go Back</Button>
      </p>
    </div>
  );
};
