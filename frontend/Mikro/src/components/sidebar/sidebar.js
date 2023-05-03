import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import { useLocalStorageState } from "common/useLocalStorageState";
import { SSO_URL } from "components/constants";
import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components";
import dashicon from "../../images/bullet-list-50.png";
import leftArrow from "../../images/left-arrow-50.png";
import logouticon from "../../images/log-out-50.png";
import projects_icon from "../../images/project_icon.png";
import users_icon from "../../images/users_icon.png";
import payments_icon from "../../images/payments_icon.png";
import account_icon from "../../images/account_icon.png";
import checklist_icon from "../../images/checklist_icon.png";
import mikro_icon from "../../images/5.png";
import training_icon from "../../images/training-icon.png";
import "./styles.css";
import {
  Header,
  MenuItem,
  MenuItemTop,
  ProjectIcon,
  ProjectIconContainer,
  RoleBarWrapper,
  RoleHeader,
  RoleSubHeader,
  SidebarOpenedContainer,
} from "./styles.js";
import { ConfirmButton } from "components/commonComponents/commonComponents";
let map_url = "https://kaart.com/dev/mikro/";

export const ListItems = styled.li`
  margin-right: 6%;
  color: #9095a4;

  ${(props) =>
    props.activeTab &&
    css`
      color: #0095ff;
      ::after {
        content: "";
        position: relative;
        height: 5px;
        margin-top: 0.5rem;
        border-radius: 5px 5px 0 0;
        background-color: #0095ff;
        display: block;
      }
    `}
`;

export const List = styled.ul`
  display: flex;
  list-style-type: none;
  float: right;
  flex-direction: row;
  border-bottom: 1px solid lightgray;
  width: 100%;
`;

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

  const [localUser, setLocalUser] = useLocalStorageState("mikro.user", null);
  const { history, sidebarOpe, resetUserStats } = useContext(DataContext);
  const { user, refresh } = useContext(AuthContext);

  useEffect(() => {
    if (user === null) {
      history("/login");
    }
    if (user) {
      refresh();
    }
    setRole(user.role);
    setName(user.name);
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
      <SidebarOpenedContainer>
        <MenuItemTop>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "5%",
            }}
          >
            <div style={{ marginLeft: ".7vw" }}></div>
          </div>
        </MenuItemTop>

        <MenuItemTop style={{ marginBottom: "10%" }}>
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
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <img
                  style={{
                    height: "5vh",
                    marginLeft: ".8vw",
                    marginRight: "1vw",
                  }}
                  src={mikro_icon}
                  alt="Kaart Logo"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <RoleHeader>{<strong>{name}</strong>}</RoleHeader>
                <RoleSubHeader>{<strong>{role}</strong>}</RoleSubHeader>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginTop: "5%",
              }}
            />
          </RoleBarWrapper>
        </MenuItemTop>

        <NavLink to={dashboardLink} style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={dashicon} />
            </ProjectIconContainer>
            <Header>Dashboard</Header>
          </MenuItem>
        </NavLink>

        <NavLink to={checklistPageLink} style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={checklist_icon} />
            </ProjectIconContainer>
            <Header>Checklists</Header>
          </MenuItem>
        </NavLink>

        <NavLink to={projectPageLink} style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={projects_icon} />
            </ProjectIconContainer>
            <Header>Projects</Header>
          </MenuItem>
        </NavLink>

        {role === "admin" ? (
          <NavLink to="/AdminUsersPage" style={{ textDecoration: "none" }}>
            <MenuItem>
              <ProjectIconContainer>
                <ProjectIcon src={users_icon} />
              </ProjectIconContainer>
              <Header>Users</Header>
            </MenuItem>
          </NavLink>
        ) : (
          <></>
        )}

        <NavLink to={trainingPageLink} style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={training_icon} />
            </ProjectIconContainer>
            <Header>Training</Header>
          </MenuItem>
        </NavLink>

        <NavLink to={paymentsPageLink} style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={payments_icon} />
            </ProjectIconContainer>
            <Header>Payments</Header>
          </MenuItem>
        </NavLink>

        <NavLink to={accountPageLink} style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={account_icon} />
            </ProjectIconContainer>
            <Header>Account</Header>
          </MenuItem>
        </NavLink>

        <MenuItem onClick={logout}>
          <ProjectIconContainer>
            <ProjectIcon onClick={logout} src={logouticon} />
          </ProjectIconContainer>
          <Header onClick={logout}>Log Out</Header>
        </MenuItem>

        <MenuItem href={map_url} target="_blank">
          <ProjectIconContainer>
            <ProjectIcon href={map_url} target="_blank" src={leftArrow} />
          </ProjectIconContainer>
          <Header href={map_url} target="_blank">
            Kaart.com
          </Header>
        </MenuItem>

        {/* <ConfirmButton 
            confirm_action={()=>resetUserStats()}
            confirm_text={"Reset Stats"}
          /> */}
      </SidebarOpenedContainer>
    </div>
  );
};

// COMPONENT EXPORT //
export default Sidebar;
