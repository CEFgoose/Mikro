import React from "react";
import { styled } from "@mui/material/styles";
import { Modal, Divider, Card, Grid } from "@mui/material";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
} from "../commonComponents/commonComponents";

export const AdminCardMediaStyle = styled("div")(({ theme }) => ({
  display: "flex",
  position: "relative",
  backgroundColor: "#f4753c",
  paddingTop: "1vh",
  "&:before": {
    top: 0,
    width: "100%",
    height: "100%",
    position: "absolute",
    WebkitBackdropFilter: "blur(3px)", // Fix on Mobile
    fontWeight: "400",
  },
}));

// DELETE PROJECT MODAL //
export const UserProjectModal = (props) => {
  return (
    <Modal open={props.modalOpen} key="user">
      <ModalWrapper>
        <CloseButton close_action={props.cancel_action} />
        <SectionTitle title_text={props.title_text} />
        <SectionSubtitle
          subtitle_text={`Are you sure you want to ${props.confirm_text} Project # ${props.projectSelected}-${props.projectName}?`}
        />
        <ModalButtons
          cancel_text={"Cancel"}
          cancel_action={props.cancel_action}
          confirm_text={props.confirm_text}
          confirm_action={props.confirm_action}
        />
      </ModalWrapper>
    </Modal>
  );
};

// DELETE PROJECT BUTTONS //
export const ModalButtons = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      <CancelButton
        cancel_action={props.cancel_action}
        cancel_text={props.cancel_text}
      />
      <ConfirmButton
        confirm_action={props.confirm_action}
        confirm_text={props.confirm_text}
      />
    </div>
  );
};

export const ModifyProjectButtons = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      <CancelButton
        cancel_action={props.handleModifyOpen}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_action={props.confirm_action}
        confirm_text={props.confirm_text}
      />
    </div>
  );
};

