import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import { useLocalStorageState } from "common/useLocalStorageState";
import { SSO_URL } from "components/constants";
import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components";
import dashicon from "../../images/newIcons/round2/dashboard_1.png";
import checklist_icon from "../../images/newIcons/round2/checklists.png";
import projects_icon from "../../images/newIcons/round2/projects_1.png";
import tasks_icon from "../../images/newIcons/round2/tasks.png";
import users_icon from "../../images/newIcons/round2/users_1.png";
import training_icon from "../../images/newIcons/round2/training_1.png";
import payments_icon from "../../images/newIcons/round2/payments.png";
import account_icon from "../../images/newIcons/round2/account.png";
import faq_icon from "../../images/faq alt 2.png";
import logouticon from "../../images/newIcons/round2/log out.png";
import leftArrow from "../../images/newIcons/round2/kaart back_1.png";

import mikroLogo from "../../images/5.png";

import "./styles.css";
import {
  Header,
  MikroLogoClosed,
  MikroLogoOpen,
  MenuItem,
  MenuItemTop,
  ProjectIcon,
  ProjectIconContainer,
  RoleBarWrapper,
  RoleHeader,
  RoleSubHeader,
  SidebarClosedContainer,
  SidebarOpenedContainer,
} from "./styles.js";
import { ConfirmButton } from "components/commonComponents/commonComponents";
let map_url = "https://kaart.com/dev/mikro/";

const Sidebar = (props) => {
  // COMPONENT STATES & SETTERS //
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [dashboardLink, setDashboardLink] = useState("/dashboard");
  const [projectPageLink, setProjectPageLink] = useState("/UserProjectsPage");
  const [checklistPageLink, setChecklistPageLink] = useState(
    "/UserChecklistsPage"
  );
  const [accountPageLink, setAccountPageLink] = useState("/UserAccountPage");
  const [paymentsPageLink, setPaymentsPageLink] = useState("/UserPaymentsPage");
  const [trainingPageLink, setTrainingPageLink] = useState("/UserTrainingPage");
  const [tasksPageLink, setTasksPageLink] = useState("/AdminTasksPage");
  const [faqPageLink, setFaqPageLink] = useState("/FAQPage");
  const [localUser, setLocalUser] = useLocalStorageState("mikro.user", null);
  const { history, resetUserStats } = useContext(DataContext);
  const { user, refresh } = useContext(AuthContext);

  const { sidebarOpen, BarOptionSelected } = useContext(DataContext);

  useEffect(() => {
    if (user === null) {
      history("/login");
    }
    if (user) {
      refresh();
    }
    setRole(user.role);
    setName(user.name);
    setFaqPageLink("/FAQPage");
    if (user.role === "admin") {
      setDashboardLink("/admindash");
      setProjectPageLink("/AdminProjectsPage");
      setAccountPageLink("/AdminAccountPage");
      setPaymentsPageLink("/AdminPaymentsPage");
      setTrainingPageLink("/AdminTrainingPage");
      setChecklistPageLink("/AdminChecklistsPage");
    }
    if (user.role === "validator") {
      setDashboardLink("/validatordash");
      setProjectPageLink("/validatorProjectsPage");
      setAccountPageLink("/UserAccountPage");
      setPaymentsPageLink("/ValidatorPaymentsPage");
      setTrainingPageLink("/UserTrainingPage");
      setChecklistPageLink("/ValidatorChecklistsPage");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {sidebarOpen ? (
        <SidebarOpenedContainer>
          <MenuItemTop style={{ marginBottom: "1vh" }}>
            {/* <RoleBarWrapper> */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: "auto",
                alignItems: "left",
                justifyContent: "left",
                // backgroundColor:'lightblue'
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  // backgroundColor:'lightgrey',
                  marginLeft: "5%",
                  marginTop: "5%",
                  width: "auto",
                  height: "auto",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  alt={"Mikro logo"}
                  src={mikroLogo}
                  style={{
                    width: "4rem",
                    height: "auto",
                  }}
                />
                MIKRO
              </div>

              <div
                style={{
                  width: "5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  // backgroundColor:'lightgreen',
                  marginTop: "5%",
                  marginLeft: "2rem",
                }}
              >
                <RoleHeader style={{ marginBottom: "1.2rem" }}>
                  {<strong>{name}</strong>}
                </RoleHeader>

                <RoleSubHeader>{<strong>{role}</strong>}</RoleSubHeader>
              </div>
            </div>
          </MenuItemTop>
          <div
            style={{
              width: "100%",
              backgroundColor: "black",
              height: ".05vh",
              marginTop: "0%",
              marginBottom: "2vh",
            }}
          />

          <NavLink
            to={dashboardLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              backgroundColor:
                BarOptionSelected === "dashboard" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={dashicon} />
              <Header>Dashboard</Header>
            </MenuItem>
          </NavLink>

          <NavLink
            to={checklistPageLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              backgroundColor:
                BarOptionSelected === "checklist" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={checklist_icon} />
              <Header>Checklists</Header>
            </MenuItem>
          </NavLink>

          <NavLink
            to={projectPageLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              backgroundColor:
                BarOptionSelected === "project" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={projects_icon} />

              <Header>Projects</Header>
            </MenuItem>
          </NavLink>

          {role === "admin" ? (
            <NavLink
              to="/AdminTasksPage"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                textDecoration: "none",
                paddingLeft: "1vw",
                marginBottom: "1vh",
                height: "6vh",
                // backgroundColor:'lightsalmon'
              }}
            >
              <MenuItem style={{ width: "100%" }}>
                <ProjectIcon src={tasks_icon} />

                <Header>Tasks</Header>
              </MenuItem>
            </NavLink>
          ) : (
            <></>
          )}
          {role === "admin" ? (
            <NavLink
              to="/AdminUsersPage"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                textDecoration: "none",
                paddingLeft: "1vw",
                marginBottom: "1vh",
                height: "6vh",
                // backgroundColor:'lightsalmon'
              }}
            >
              <MenuItem style={{ width: "100%" }}>
                <ProjectIcon src={users_icon} />

                <Header>Users</Header>
              </MenuItem>
            </NavLink>
          ) : (
            <></>
          )}

          <NavLink
            to={trainingPageLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              backgroundColor:
                BarOptionSelected === "training" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={training_icon} />

              <Header>Training</Header>
            </MenuItem>
          </NavLink>

          <NavLink
            to={paymentsPageLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              backgroundColor:
                BarOptionSelected === "payments" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={payments_icon} />

              <Header>Payments</Header>
            </MenuItem>
          </NavLink>

          <NavLink
            to={accountPageLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              backgroundColor:
                BarOptionSelected === "account" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={account_icon} />
              <Header>Account</Header>
            </MenuItem>
          </NavLink>

          <NavLink
            to={faqPageLink}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",

              height: "6vh",

              backgroundColor: BarOptionSelected === "faq" ? "#0095ff" : null,
            }}
          >
            <MenuItem style={{ width: "100%" }}>
              <ProjectIcon src={faq_icon} />

              <Header>FAQ</Header>
            </MenuItem>
          </NavLink>

          <MenuItem
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              // backgroundColor:'lightsalmon'
            }}
            onClick={logout}
          >
            <ProjectIcon onClick={logout} src={logouticon} />
            <Header onClick={logout}>Log Out</Header>
          </MenuItem>

          <MenuItem
            href={map_url}
            target="_blank"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textDecoration: "none",
              paddingLeft: "1vw",
              marginBottom: "1vh",
              height: "6vh",
              width: "100%",
              // backgroundColor:'lightsalmon'
            }}
          >
            <ProjectIcon href={map_url} target="_blank" src={leftArrow} />

            <Header href={map_url} target="_blank">
              Kaart.com
            </Header>
          </MenuItem>

          {/* <ConfirmButton 
            confirm_action={()=>resetUserStats()}
            confirm_text={"Reset Stats"}
          /> */}
        </SidebarOpenedContainer>
      ) : (
        <SidebarClosedContainer>
          <MenuItemTop>
            <MikroLogoClosed onClick={props.toggleSidebar} />
          </MenuItemTop>
        </SidebarClosedContainer>
      )}
    </div>
  );
};

// COMPONENT EXPORT //
export default Sidebar;
