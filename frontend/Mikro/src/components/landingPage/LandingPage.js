import React, { useContext } from "react";
import { DataContext } from "common/DataContext";
import { NavLink } from "react-router-dom";
import laptop_image from "../../images/laptop.png";
import "./styles.css";
import { Button, Typography } from "@mui/material";
import { ProjectIcon } from "./styles.js";
import mikro_icon from "../../images/5.png";
export const LandingPage = (props) => {
  const { history } = useContext(DataContext);

  const handleSetRedirect = () => {
    history("/login");
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "0vw",
                }}
              >
                <Typography
                  style={{ marginLeft: "0vw", paddingLeft: "0vw" }}
                  component="span"
                  variant="h1"
                  sx={{ color: "#f4753c" }}
                >
                  Mikro
                </Typography>
                <div>
                  <img
                    style={{ width: "20%", marginLeft: "5%" }}
                    src={mikro_icon}
                    alt="mikro icon"
                  />
                </div>
              </div>
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
                >
                  Start Mapping Today
                </Button>
              </NavLink>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              top: "47%",
              left: "33vw",
              height: "15vh",
            }}
          ></div>
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
    </>
  );
};
