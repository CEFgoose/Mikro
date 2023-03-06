import { createTheme } from "@mui/material/styles";
import React, { createContext, useState, useRef, useCallback } from "react";

export const InteractionContext = createContext({});

export const InteractionProvider = (props) => {
  const { children } = props;

  const [genericAlert, setGenericAlert] = useState({
    visible: false,
    type: null,
    heading: null,
    message: null,
  });

  const name = "Tabula Rasa";

  const theme = createTheme({
    palette: {
      primary: {
        main: "#ffffff",
      },
      secondary: {
        main: "#6a6c7c",
      },
    },
  });

  const value = {
    name,
    theme,
    setGenericAlert,
  };

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  );
};
