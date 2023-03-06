import styled from "styled-components";

export const ImageHubWrapper = styled.div`
  width: 100vw;
`;

export const FormWrapper = styled.div`
  font-weight: bold;
  font-size: 14px;
  line-height: 1.4285em;
  color: rgba(0, 0, 0, 0.87);
  box-sizing: inherit;
  display: flex;
  flex-direction: column;
`;

export const GridBox = styled.div`
  margin: 1em;
  background-color: white;
  border: 0.75px solid black;
  border-radius: 1.5em;
  font-family: Lato, "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.4285em;
  color: rgba(0, 0, 0, 0.87);
  box-sizing: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Button = styled.button`
  font-family: sans-serif;
  font-size: 100%;
  align-self: center;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1.15;
  overflow: visible;
  text-transform: none;
  border-radius: 6px;
  margin-top: 1em;
  margin-bottom: 1em;
  background-color: #f4753c;
  color: white;
  padding: 14px 20px;
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  &:hover {
    background-color: ${(props) => (props.disabled ? "gray" : "#c85823")};
  }
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

export const P = styled.p`
  display: flex;
  align-self: center;
  justify-content: center;
  align-items: center;
  font-weight: 400;
  width: 75%;
`;

// export const Title = styled.h3`
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   padding: 0.5em;
// `;

export const SubTitle = styled.h4`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const RegisterPage = styled.div`
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

export const RegisterForm = styled.form`
  font-size: 16px;
  line-height: 2;
  max-width: 450px;
  width: 100%;
  text-align: center;
`;

export const RegisterImage = styled.img`
  height: 35vh;
  margin-left: auto;
  margin-right: auto;
  display: block;
`;

export const Title = styled.h1`
  text-align: center;
  font-size: 35px;
  color: #253e45;
`;

export const RegisterInput = styled.input`
  width: 80%;
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
`;

export const NameInput = styled.input`
  width: 38%;
  padding: 12px 20px;
  margin: 8px 8px;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
`;

export const RegisterButton = styled.button`
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
