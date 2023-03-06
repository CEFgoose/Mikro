//IMPORTS
import React, { useContext } from "react";
import Alert from "react-bootstrap/Alert";
import { InteractionContext } from "common/InteractionContext";
import { NotificationCenterWrapper } from "./styles";

//COMPONENT SETUP & DECLARATION - USER ALERTS WIDGET
export const NotificationCenter = () => {
  //STATES FROM INTERACTION CONTEXT
  const { genericAlert, setGenericAlert } = useContext(InteractionContext);
  //COMPONENT RENDER
  return (
    <NotificationCenterWrapper>
      <Alert
        show={genericAlert.visible}
        variant={genericAlert.type}
        onClose={() =>
          setGenericAlert({
            visible: false,
            type: null,
            heading: null,
            message: null,
          })
        }
        dismissible
      >
        {genericAlert.heading ? (
          <Alert.Heading>{genericAlert.heading}</Alert.Heading>
        ) : (
          ""
        )}
        {genericAlert.message}
      </Alert>
    </NotificationCenterWrapper>
  );
};
