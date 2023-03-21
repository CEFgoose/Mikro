import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import useToggle from "hooks/useToggle";
import { NavLink } from "react-router-dom";
import laptop_image from "../../images/laptop.png";
import "./styles.css";
import { Button, Typography } from "@mui/material";
import { ProjectIcon } from "./styles.js";
import mikro_icon from "../../images/5.png";
export const LandingPage = (props) => {
  const [redirect, setRedirect] = useToggle(false);
  const handleSetRedirect = () => {
    setRedirect();
  };
  return (
    <>
      <div
        style={{
          backgroundColor: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "right",
            height: "auto",
          }}
        >
          <NavLink to={"/login"} style={{ textDecoration: "none" }}>
            <Button
              style={{
                marginRight: "9vw",
                marginTop: "4vh",
                backgroundColor: "#f4753c",
                color: "black",
              }}
              size="large"
              variant="contained"
              onClick={() => handleSetRedirect()}
            >
              Login
            </Button>
          </NavLink>
        </div>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "10vw",
              marginTop: "13vh",
            }}
          >
            <Typography variant="h2" sx={{ color: "common.white" }}>
              Make Maps
              <br />
              Make Money
              <br />
              Make a Difference
              <br />
              with
              <Typography
                component="span"
                variant="h1"
                sx={{ color: "#f4753c" }}
              >
                &nbsp;Mikro
              </Typography>

            </Typography>
            <div style={{ marginTop: "4vh" }}>
              <Typography variant="h6" sx={{ color: "common.white" }}>
                Micro-payments platform for Open Street Map©
              </Typography>
            </div>

            <div>
              <NavLink to={"/login"} style={{ textDecoration: "none" }}>
                <Button
                  size="large"
                  variant="contained"
                  style={{
                    marginRight: "1vw",
                    marginTop: "5vh",
                    backgroundColor: "#f4753c",
                    color: "black",
                  }}
                  // to={PATH_AUTH.login}
                  // component={RouterLink}
                >
                  Start Mapping Today
                </Button>
              </NavLink>
            </div>
          </div>

          <div style={{position:'absolute',top:'47%',left:'33vw',height:"15vh"}}>
          <img style={{height:'9vh'}} src={mikro_icon}></img>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              width: "50%",
              height: "100%",
              marginLeft: "18vh",
              marginTop: "12vh",
            }}
          >
            
            <ProjectIcon style={{ marginTop: "5vh" }} src={laptop_image} />
          </div>
        </div>
      </div>
      {!redirect ? <></> : <Redirect push to="/login" />}
    </>
  );
};
//

// <div>
// <Typography
//   component="span"
//   variant="h1"
//   sx={{ color: "primary.main" }}
// >
//   Mikro
// </Typography>
// </div>

// <div>
// <Typography sx={{ color: "common.white" }}>
//   A micro-payments platform for OSM
// </Typography>
// </div>

// <div>

// </div>
