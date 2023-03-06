import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import useToggle from "hooks/useToggle";
import {
  styled,
  Button,
  Box,
  Container,
  Typography,
  Stack,
  StackProps,
} from "@mui/material";

export const LandingPage = (props) => {
  const [redirect, setRedirect] = useToggle(false);
  const handleSetRedirect = () => {
    setRedirect();
  };
  return (
    <>
      <div
        style={{ backgroundColor: "darkGrey", width: "100%", height: "100%" }}
      >
        <div>
          <Typography
            component="span"
            variant="h1"
            sx={{ color: "primary.main" }}
          >
            Mikro
          </Typography>
        </div>

        <div>
          <Typography sx={{ color: "common.white" }}>
            A micro-payments platform for OSM
          </Typography>
        </div>

        <div>
          <Button
            size="large"
            variant="contained"
            onClick={() => handleSetRedirect()}
          >
            Login
          </Button>
        </div>
      </div>
      {!redirect ? <></> : <Redirect push to="/login" />}
    </>
  );
};
