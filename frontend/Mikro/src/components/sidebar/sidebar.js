import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import { SSO_URL } from "components/constants";
import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import dashicon from "../../images/newIcons/round2/dashboard_1.png";
import checklist_icon from "../../images/newIcons/round2/checklists.png";
import projects_icon from "../../images/newIcons/round2/projects_1.png";
import tasks_icon from "../../images/newIcons/round2/tasks.png";
import users_icon from "../../images/newIcons/round2/users_1.png";
import training_icon from "../../images/newIcons/round2/training_1.png";
import payments_icon from "../../images/newIcons/round2/payments.png";
import logouticon from "../../images/newIcons/round2/log out.png";
import expand_icon from "../../images/Open Menu.svg";
import minimize_icon from "../../images/Close Menu.svg";
import mikroLogo from "../../images/5.png";

import "./styles.css";
import {
  Header,
  MenuItem,
  MenuItemTop,
  ProjectIcon,
  RoleBarWrapper,
  RoleHeader,
  RoleSubHeader,
} from "./styles.js";
import { KaartLogoOpen } from "components/landingPage/styles";
const Sidebar = (props) => {
  // COMPONENT STATES & SETTERS //
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const { history, sidebarOpen, handleSetSidebarState } =
    useContext(DataContext);
  const { user, refresh, setLocalUser } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.name && user.role) {
      setName(user.name);
      setRole(user.role);
      if (user.role === "admin") {
        setLink("admindash");
      } else {
        setLink("dashboard");
      }
    }
  }, [user]);
  // LOG THE CURRENT USER OUT & Navigate TO LOGIN PAGE //
  const logout = () => {
    fetch(SSO_URL.concat("auth/logout"), {
      method: "POST",
    }).then(() => {
      setLocalUser(null);
      history("/login");
    });
  };

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          height: "100vh",
          boxShadow: "0 0 4px gray",
          alignItems: "left",
          zIndex: 999,
          width: sidebarOpen ? "15vw" : "",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: sidebarOpen ? "flex-end" : "flex-start",
          }}
        >
          <div onClick={() => handleSetSidebarState()}>
            <img
              style={{
                height: "4vh",
                width: "4vw",
              }}
              src={sidebarOpen ? minimize_icon : expand_icon}
              alt="whitelogo"
            />
          </div>
        </div>
        {sidebarOpen ? (
          <MenuItemTop>
            <RoleBarWrapper>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <KaartLogoOpen />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <RoleHeader>{name}</RoleHeader>
                  <RoleSubHeader>{role}</RoleSubHeader>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "black",
                  height: ".05vh",
                }}
              />
            </RoleBarWrapper>
          </MenuItemTop>
        ) : (
          <></>
        )}

        <NavLink
          to={
            role === "admin"
              ? "/admindash"
              : role === "validator"
              ? "/validatordash"
              : "/dashboard"
          }
          style={{ textDecoration: "none" }}
        >
          <MenuItem>
            <ProjectIcon src={dashicon} />
            <Header>{sidebarOpen ? "Dashboard" : ""}</Header>
          </MenuItem>
        </NavLink>

        {role === "admin" ? (
          <NavLink to={"/AdminTasksPage"} style={{ textDecoration: "none" }}>
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={tasks_icon} />

              <Header>{sidebarOpen ? "Tasks" : ""}</Header>
            </MenuItem>
          </NavLink>
        ) : (
          <></>
        )}
        <NavLink
          to={
            role === "admin"
              ? "/AdminChecklistsPage"
              : role === "validator"
              ? "/ValidatorChecklistsPage"
              : "/UserChecklistsPage"
          }
          style={{ textDecoration: "none" }}
        >
          <MenuItem>
            <ProjectIcon src={checklist_icon} />
            <Header>{sidebarOpen ? "Activites" : ""}</Header>
          </MenuItem>
        </NavLink>

        <NavLink
          to={role === "admin" ? "/AdminProjectsPage" : "/UserProjectsPage"}
          style={{ textDecoration: "none" }}
        >
          <MenuItem style={{ width: "100%" }}>
            <ProjectIcon src={projects_icon} />
            <Header>{sidebarOpen ? "Projects" : ""}</Header>
          </MenuItem>
        </NavLink>

        {role === "admin" ? (
          <NavLink to={"/AdminUsersPage"} style={{ textDecoration: "none" }}>
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={users_icon} />

              <Header>{sidebarOpen ? "Users" : ""}</Header>
            </MenuItem>
          </NavLink>
        ) : (
          <></>
        )}

        <NavLink
          to={role === "admin" ? "/AdminTrainingPage" : "/UserTrainingPage"}
          style={{ textDecoration: "none" }}
        >
          <MenuItem style={{ width: "100%" }}>
            <ProjectIcon src={training_icon} />

            <Header>{sidebarOpen ? "Training" : ""}</Header>
          </MenuItem>
        </NavLink>

        <NavLink
          to={role === "admin" ? "/AdminPaymentsPage" : "/UserPaymentsPage"}
          style={{ textDecoration: "none" }}
        >
          <MenuItem style={{ width: "100%" }}>
            <ProjectIcon src={payments_icon} />

            <Header>{sidebarOpen ? "Payments" : ""}</Header>
          </MenuItem>
        </NavLink>

        <NavLink to={"/login"} style={{ textDecoration: "none" }}>
          <MenuItem onClick={logout}>
            <ProjectIcon onClick={logout} src={logouticon} />
            <Header onClick={logout}>{sidebarOpen ? "Logout" : ""}</Header>
          </MenuItem>
        </NavLink>
        {/* {role === "admin" ? (
          <NavLink to={"/AdminAccountPage"} style={{ textDecoration: "none" }}>
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={account_icon} />
              <Header>{sidebarOpen ? "Account" : ""}</Header>
            </MenuItem>
          </NavLink>
        ) : (
          <NavLink to={"/UserAccountPage"} style={{ textDecoration: "none" }}>
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={account_icon} />
              <Header>{sidebarOpen ? "Account" : ""}</Header>
            </MenuItem>
          </NavLink>
        )} */}
        {/* <NavLink to={"/FAQPage"} style={{ textDecoration: "none" }}>
          <MenuItem style={{ width: "100%" }}>
            <ProjectIcon src={faq_icon} />
            <Header>{sidebarOpen ? "FAQ" : ""}</Header>
          </MenuItem>
        </NavLink> */}
        {/* <MenuItem href={map_url} target="_blank">
          <ProjectIcon href={map_url} target="_blank" src={leftArrow} />

          <Header href={map_url} target="_blank">
            {sidebarOpen ? "Kaart.com" : ""}
          </Header>
        </MenuItem> */}
      </div>
    </div>
  );
};

// COMPONENT EXPORT //
export default Sidebar;
