import styled from "styled-components";
import close_icon from "../../images/close_icon.png";
import { Card } from "@mui/material";

export const Container = styled.div`
  display: flex;
  justify-content: space-evenly;
`;

export const Button = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-transform: capitalize;
  background-color: #253e45;
  width: 8rem;
  min-height: 2.8em;
  margin-right: 1vw;
  height: 2.8em;
  border-radius: 6px;
  &:hover {
    cursor: pointer;
    background-color: white;
    color: #253e45;
    border: solid;
    border-width: 1px;
  }
`;

export const DashCard = styled(Card)(() => ({
  display: "flex",
  position: "relative",
  flexDirection: "column",
  height: "23vh",
  width: "25vw",
  boxShadow: "0 0 4px gray",
  marginBottom: "1vh",
  padding: "1vh",
}));

export const ButtonLabel = styled.div`
  margin: 2px;
`;

export const RegisterButton = styled.button`
  margin: 15px 0px;
  margin-right: 10px;
  width: 50%;
  background-color: #f4753c;
  color: white;
  padding: 14px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: #c85823;
  }
`;

export const CloseButtonImg = styled.img`
  background-image: url(${close_icon});
  position: relative;
  left: 95%;
  width: 2%;
  background-repeat: no-repeat;
  background-position: 50%;
`;

export const Input = styled.input`
  box-sizing: inherit;
  font-family: sans-serif;
  font-size: 100%;
  line-height: 1.15;
  overflow: visible;
  width: 90%;
  display: flex;
  align-self: center;
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

export const TextArea = styled.textarea`
  font-family: sans-serif;
  font-size: 100%;
  line-height: 1.15;
  overflow: visible;
  width: 90%;
  display: flex;
  align-self: center;
  padding: 12px 20px;
  height: 75%;
  resize: none;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
`;

export const ProjectCardContainer = styled(Card)(() => ({
  boxShadow: "1px 1px 6px gray",
  width: "18vw",
  marginLeft: "2vw",
  marginTop: "2vh",
  transition: "box-shadow 0.3s ease",
  "&:hover": {
    boxShadow: "2px 2px 6px gray",
    cursor: "pointer",
  },
}));
