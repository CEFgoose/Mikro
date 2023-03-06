import { style } from "@mui/system";
import styled from "styled-components";
import LayerImage from "../../images/icn-topographic-white.svg";

export const DirectionImage = styled.img`
  width: 5%;
  height: 3%;
  opacity: 0.8;
  transform-origin: bottom;
  transform: rotate(${(props) => props.rotation});
`;

export const MapLayerToggleContainer = styled.div`
  top: 50%;
  right: 1.5rem;
  position: absolute;
  /* bottom: 90px;
  right: 14px; */
  width: auto;
  height: auto;
  pointer-events: none;
  z-index: 999;
  background: rgba(66, 71, 75, 0.6);
`;

export const MapLayerToggleButton = styled.div`
  border-radius: 25px;
  width: 75%;
  height: 25px;
  pointer-events: auto;
  background-color: rgba(145, 165, 172, 0.5);
  cursor: pointer;
`;

export const MapLayerToggleIcon = styled.div`
  background-image: url(${LayerImage});
  position: relative;
  top: 0;
  left: 0;
  background-size: contain;
  background-repeat: no-repeat;
  /* opacity: 1; */
  width: 24px;
  height: 24px;
  &:hover {
    cursor: pointer;
    opacity: 0.7;
  }
`;

export const LayerToggle = styled.div`
  position: relative;
  margin: auto;
  width: 25px;
  height: 25px;
  border: none;
`;

export const LayerRadioGroup = styled.div`
  position: absolute;
  margin: auto;
  left: 95%;
  top: 25rem;
  background-color: black;
  color: white;
  font-weight: bold;
  border-radius: 6px;
  font-size: 0.6vw;
  z-index: 1;
`;

export const LayerRadioGroupSmall = styled.div`
  position: absolute;
  margin: auto;
  right: 2rem;
  top: 20%;
  background-color: white;
  font-weight: bold;
  border-radius: 6px;
  font-size: 0.6vw;
  z-index: 1;
`;

export const LayerRadioGroupText = styled.label`
  color: white;
  font-weight: bold;
  text-size-adjust: auto;
  z-index: 1;
  &:hover {
    opacity: 0.7;
    cursor: pointer;
  }
`;

export const Fullscreen = styled.button`
  top: 1%;
  right: 1%;
  font-size: 20px;
  position: absolute;
  background-color: black;
  color: white;
  border: none;
  margin-right: 3px;
  margin-top: 3px;
  border-radius: 50%;
  max-width: 4vw;
  max-height: 4vh;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  &:hover {
    background-color: white;
    color: black;
  }
`;
export const MapLayers = styled.div`
  bottom: 60px;
  left: 1154px;
  transform-origin: 100% 100%;
`;
export const MapLayerPickerWrapper = styled.div`
  bottom: 26.5rem;
  right: 2rem;
  position: absolute;
  box-sizing: border-box;
  background-color: white;
  border-radius: 6px;
`;

export const MapLayerPickerContent = styled.div`
  /* width: 200px; */
  box-shadow: 0 22px 20px -16px var(--shadow-color);
  font-size: 14px;
  min-height: 160px;
  padding: 0.5rem;
`;

export const MapLayerPickerLabel = styled.label`
  cursor: pointer;
  margin-bottom: 0.5rem;
  display: block;
  font-size: 14px;
`;

export const MapLayerPickerInput = styled.input`
  margin-right: 0.5rem;
`;

export const ArrowRight = styled.div`
  /* bottom: 95px;
  border-left-color: white;
  border-bottom-color: transparent;
  border-bottom-width: 0;
  border-top-width: 5rem;
  right: 0;
  border-right-color: transparent;
border-top-color: transparent;
border-left-width: 5rem;
border-right-width: 0;
border-style: solid;
height: 0;
position: absolute;
width: 0;
background-color:red;
z-index: 9999; */
`;
