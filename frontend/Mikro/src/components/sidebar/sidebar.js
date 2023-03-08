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
import { SectionTitle } from "components/commonComponents/commonComponents";
import "./styles.css";
import {
  CollapseMenuIcon,
  Header,
  KaartLogoClosed,
  KaartLogoOpen,
  MenuItem,
  MenuItemTop,
  OpenMenuIcon,
  OpenMenuIconButton,
  OpenMenuIconContainer,
  ProjectIcon,
  ProjectIconContainer,
  RoleBarWrapper,
  RoleHeader,
  RoleSubHeader,
  SidebarClosedContainer,
  SidebarOpenedContainer,
} from "./styles.js";
import { Divider } from "@mui/material";
let map_url = "https://kaart.com/dev/viewer/";

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
  const [dashboardLink, setDashboardLink] = useState('/dashboard');
  const [projectPageLink, setProjectPageLink] = useState("/UserProjectsPage");
  const [accountPageLink, setAccountPageLink] = useState("/UserAccountPage");
  const [paymentsPageLink, setPaymentsPageLink] = useState("/UserPaymentsPage");
  const [localUser, setLocalUser] = useLocalStorageState("viewer.user", null);

  const { history, sidebarOpen } = useContext(DataContext);
  const { user, refresh } = useContext(AuthContext);

  useEffect(() => {
    if (user === null) {
      history.push("/login");
    }
    if (user) {
      refresh();
    }
    setRole(user.role);
    setName(user.name);
    if (user.role==='admin'){
      setDashboardLink('/admindash')
      setProjectPageLink("/AdminProjectsPage")
      setAccountPageLink('/AdminAccountPage')
      setPaymentsPageLink("/AdminPaymentsPage")
    }
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // LOG THE CURRENT USER OUT & REDIRECT TO LOGIN PAGE //
  const logout = () => {
    fetch(SSO_URL.concat("auth/logout"), {
      method: "POST",
    }).then(() => {
      setLocalUser(null);
      history.push("/login");
    });
  };

  
  return (
    <div>
      {sidebarOpen ? (
        <SidebarOpenedContainer>
          <MenuItemTop>
            <KaartLogoOpen onClick={props.toggleSidebar} />
            <CollapseMenuIcon onClick={props.toggleSidebar} />
          </MenuItemTop>
          <SectionTitle title_text={"Welcome to Mikro"} />
          <Divider/>
          <MenuItemTop>
            <RoleBarWrapper>
              <RoleHeader>{name}</RoleHeader>
              <RoleSubHeader>{role}</RoleSubHeader>
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

          <NavLink to={projectPageLink} style={{ textDecoration: "none" }}>
            <MenuItem>
              <ProjectIconContainer>
                <ProjectIcon src={projects_icon} />
              </ProjectIconContainer>
              <Header>Projects</Header>
            </MenuItem>
          </NavLink>

          { role==='admin'?
          <NavLink to="/AdminUsersPage" style={{ textDecoration: "none" }}>
          <MenuItem>
            <ProjectIconContainer>
              <ProjectIcon src={users_icon} />
            </ProjectIconContainer>
            <Header>Users</Header>
          </MenuItem>
        </NavLink>
        :
        <></>
          }


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

        </SidebarOpenedContainer>
      ) : (
        <SidebarClosedContainer>
          <MenuItemTop>
            <KaartLogoClosed onClick={props.toggleSidebar} />
            <OpenMenuIconContainer>
              <OpenMenuIconButton>
                <OpenMenuIcon onClick={props.toggleSidebar} />
              </OpenMenuIconButton>
            </OpenMenuIconContainer>
          </MenuItemTop>
        </SidebarClosedContainer>
      )}
    </div>
  );
};

// COMPONENT EXPORT //
export default Sidebar;
