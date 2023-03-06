import styled from "styled-components";

export const LoginPage = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  transition: all 0.4s ease;

  ${(props) =>
    props.modalShown
      ? `filter: blur(10px) grayscale(50%);
  -webkit-filter: blur(10px) grayscale(50%);
  -webkit-transform: scale(0.9);
  pointer-events: none;`
      : ``}
`;

export const LoginForm = styled.form`
  font-size: 16px;
  line-height: 2;
  max-width: 450px;
  width: 100%;
  text-align: center;
`;

export const LoginImage = styled.img`
  height: 35vh;
  margin-left: auto;
  margin-right: auto;
  display: block;
`;

export const Title = styled.h1`
  text-align: center;
  font-size: 56px;
`;

export const LoginInput = styled.input`
  width: 80%;
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
`;

export const LoginButton = styled.button`
  margin: 15px 0px;
  margin-right: 10px;
  width: 25%;
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
