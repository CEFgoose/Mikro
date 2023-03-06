//IMPORTS
import styled, { keyframes } from "styled-components";
import React from "react";
import loadingArrow from "images/25.svg";

//PRELOADER ICON ROTATE TRANSFORM
const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
//PRELOADER ICON SETUP
export const Preloader = styled.img.attrs({
  src: loadingArrow,
})`
  //   animation: ${rotate360} 1s linear infinite;
  //   transform: translateZ(0);

  background: transparent;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  position: absolute;
`;

//COMPONENT DECLARATION SETUP & RENDER - IMAGE PRELOADER ICON (SPINNING CIRCLES WHILE IMAGE LOADING)
export const PreloaderIcon = () => {
  return (
    <Preloader
      style={{
        position: "relative",
        left: "7px",
        top: "11px",
        width: "25%",
      }}
    />
  );
};
