import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components";
import whiteKaartLogo from "../../images/20-KAART-White.svg";
import close_icon from "../../images/close-icon.svg";
import kaartLogo from "../../images/logo-kaart-standard.svg";
import menu_icon from "../../images/menu-icon.png";

export const SidebarOpenedContainer = styled.div`
  border-width: 0px;
  z-index: 9999;
  position: absolute;
  box-shadow: 3px 0px 5px #253e45;
  left: 0;
  height: 100%;
  width: 220px;
  transition: left 0.3s ease-in-out;
  background-color: white;
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
  position: relative;
  color: #253e45 !important;
  padding-left: 4rem;
  padding: 1rem;
  display: block;
  text-decoration: none;
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

export const KaartLogoOpen = styled.div`
  background-image: url(${kaartLogo});
  background-repeat: no-repeat;
  background-position: 50%;
  max-width: 100%;
  width: 100px;
  height: 80px;
  /* position: relative; */
  &:hover {
    cursor: pointer;
  }
`;

export const KaartLogoClosed = styled.div`
  background-image: url(${whiteKaartLogo});
  background-repeat: no-repeat;
  background-position: 50%;
  max-width: 100%;
  width: 100px;
  height: 80px;
  position: relative;
  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }
`;
export const ProjectIconContainer = styled.span`
  border-radius: 50%;
  height: 16px;
  width: 16px;
  text-align: center;
  box-sizing: border-box;
  font-size: var(--h3);
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
  /* padding-top: 0.5vw; */
  text-align: center;
  margin: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
  height: 4rem;
  width: 16rem;
  background: rgba(145, 165, 172, 0.2);
  border-radius: 6px;
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
