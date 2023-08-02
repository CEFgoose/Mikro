import styled from "styled-components";
import close_icon from "../../images/close-icon.svg";
import mikroLogo from "../../images/5.png";
import menu_icon from "../../images/menu-icon.png";

export const SidebarOpenedContainer = styled.div`
  border-width: 0px;
  z-index: 9999;
  position: relative;
  box-shadow: 3px 0px 5px #253e45;
  left: 0;
  height: 100%;
  width: 220px;
  transition: left 0.3s ease-in-out;
  background-color: white;
  marginright: 0.5vw;
`;

export const SidebarClosedContainer = styled.div`
  border-width: 0px;
  z-index: 9999;
  position: absolute;
  left: 0;
  height: 100%;
  width: 15vw;
  transition: left 0.3s ease-in-out;
  background-color: transparent;
`;

export const MenuItem = styled.a`
  display: flex;
  flexdirection: row;
  align-items: center;
  height: 6vh;
  padding-left: 1vw;
  margin-top: 1.5vh;
  color: #253e45 !important;
  // display: block;
  box-sizing: border-box;
  &:hover {
    cursor: pointer;
    background: rgba(145, 165, 172, 0.1);
  }
`;

export const MenuItemTop = styled.div`
  display: flex;
  align-items: center;
  &:hover {
    cursor: pointer;
  }
`;

export const MikroLogoOpen = styled.div`
  background-image: url(${mikroLogo});
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: contain;
  max-width: 100%;
  height: 5vh;
  width: 5vw;

  position: relative;
  &:hover {
    cursor: pointer;
  }
`;

export const MikroLogoClosed = styled.div`
  background-image: url(${mikroLogo});
  background-repeat: no-repeat;
  background-origin: padding-box;
  padding-left: 50%;
  padding-top: 50%;
  background-position: 50%;
  background-size: 60%;
  max-width: 100%;
  height: 4vh;
  width: 4vw;
  position: relative;
  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }
`;
export const ProjectIconContainer = styled.span`
  // display:flex;
  // // flex-direction:column;
  // align-items:center;
  // border-radius: 50%;
  height: 19px;
  width: 25px;
  // text-align: center;
  // box-sizing: border-box;
  // font-size: var(--h3);
  margintop: 1vh;
`;

export const ProjectIcon = styled.img`
  width: 35px;
  height: 35px;
`;

export const OpenMenuIconContainer = styled.div`
  top: 1.5%;
  right: 20px;
  position: absolute;
  height: 66px;
  width: 32px;
  pointer-events: none;
  z-index: 999;
`;

export const OpenMenuIconButton = styled.div`
  border-radius: 25px;
  width: 75%;
  height: 25px;
  pointer-events: auto;
  background: rgba(145, 165, 172, 0.3);
  cursor: pointer;
`;

export const OpenMenuIcon = styled.div`
  background-image: url(${menu_icon});
  position: relative;
  top: 0;
  left: 0;
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 1;
  width: 24px;
  height: 24px;
  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }
`;

export const CollapseMenuIcon = styled.div`
  background-image: url(${close_icon});
  background-repeat: no-repeat;
  background-size: 20px 20px;
  position: absolute;
  left: 14rem;
  width: 13%;
  height: 3rem;
  top: 15px;
  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }
`;

export const Header = styled.a`
  text-align: left;
  margin-left: 1.2vw;
  color: #253e45 !important;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  background-color: transparent !important;
  border-right: none !important;
`;

export const RoleBarWrapper = styled.div`
  text-align: center;
  // margin: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
  height: 1.5rem;
  width: 16vw;
`;

export const RoleHeader = styled.h6`
  /* text-align: center; */
  /* font-size: 1.1rem; */
  padding-top: 5px;
  color: #253e45;
  font-weight: 700;
`;

export const RoleSubHeader = styled.h6`
  /* text-align: center; */
  color: #253e45;
  opacity: 0.7;
`;
