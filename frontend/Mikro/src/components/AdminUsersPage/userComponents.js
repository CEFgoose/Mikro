import React from "react";
import Select from "react-select";
import { styled } from "@mui/material/styles";
import { Input, SelectWrapper } from "./styles";
import { Modal } from "@mui/material";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ButtonDiv,
  ModalWrapper,
  ModalHeader,
  ModalButtons,
  InputWithLabel,
} from "../commonComponents/commonComponents";

export const USER_TABLE_HEAD = [
  { id: "name", label: "User Name", alignLeft: true },
  { id: "role", label: "Role", alignLeft: true },
  { id: "joined", label: "Joined", alignLeft: true },
];

export const RoleDiv = styled("div")(() => ({
  display: "flex",
  flexDirection: "row",
  margin: "auto",
  alignItems: "center",
  justifyContent: "center",
  justifyItems: "center",
  marginBottom: "2vh",
  marginTop: "2vh",
}));

// ADD USER MODAL //
export const AddUserModal = (props) => {
  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleAddOpen}
          title={"Invite a new user"}
        />
        <SectionSubtitle
          subtitle_text={
            "An invitation to join Mikro under your organization will be sent to the email address entered below"
          }
        />
        <InputWithLabel
          label="Email Address:"
          type="text"
          name="name"
          placeholder="InviteUser@mikro.com"
          onChange={(e) => {
            props.handleSetInviteEmail(e.target.value);
          }}
        />
        <ModalButtons
          cancel_action={props.handleAddOpen}
          cancel_text={"Cancel"}
          confirm_text={"Send"}
          confirm_action={props.do_invite_user}
        />
      </ModalWrapper>
    </Modal>
  );
};

// DELETE USER MODAL //
export const DeleteUserModal = (props) => {
  return (
    <Modal open={props.deleteOpen} key="add">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleDeleteOpen}
          title={"Remove a user"}
        />
        <SectionSubtitle
          subtitle_text={`User - ${props.selected_user_name}  will be removed from your organization`}
        />
        <ModalButtons
          cancel_action={props.handleDeleteOpen}
          cancel_text={"Cancel"}
          confirm_text={"Remove"}
          confirm_action={() => props.do_remove_user(props.form)}
        />
      </ModalWrapper>
    </Modal>
  );
};

// MODIFY USER MODAL //
export const ModifyUserModal = (props) => {
  return (
    <Modal open={props.modifyOpen} key="modify">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleModifyOpen}
          title={"Edit the role of the selected user within your organization"}
        />
        <RoleDiv>
          <SectionSubtitle subtitle_text={"Admin"} />
          <input
            type="radio"
            value="Admin"
            name="role"
            onChange={() => props.handleRoleSelected("admin")}
            checked={props.roleSelected === "admin"}
          />
          <span style={{ width: "5vw" }} />
          <SectionSubtitle subtitle_text={"Validator"} />
          <input
            type="radio"
            value="User"
            name="role"
            onChange={() => props.handleRoleSelected("validator")}
            checked={props.roleSelected === "validator"}
          />
          <span style={{ width: "5vw" }} />
          <SectionSubtitle subtitle_text={"User"} />
          <input
            type="radio"
            value="User"
            name="role"
            onChange={() => props.handleRoleSelected("user")}
            checked={props.roleSelected === "user"}
          />
        </RoleDiv>

        <ModalButtons
          cancel_text={"Cancel"}
          cancel_action={props.handleModifyOpen}
          confirm_text={"Confirm"}
          confirm_action={props.do_modify_user}
        />
      </ModalWrapper>
    </Modal>
  );
};

// ASSIGN USER MODAL //
export const AssignUserModal = (props) => {
  return (
    <Modal open={props.assignOpen} key="assign">
      <ModalWrapper>
        <CloseButton close_action={props.handleAssignOpen} />
        <SectionTitle title_text={"Assign the selected user to a Team"} />
        <SectionSubtitle subtitle_text={"Select team"} />
        <SelectTeamArea
          assignedTeams={props.assignedTeams}
          unassignedTeams={props.unassignedTeams}
          setAssignSelected={props.setAssignSelected}
          setUnassignSelected={props.setUnassignSelected}
        />
        <AssignUserButtons
          handleAssignOpen={props.handleAssignOpen}
          do_assign_user={props.do_assign_user}
          do_unassign_user={props.do_unassign_user}
        />
      </ModalWrapper>
    </Modal>
  );
};

// ASSIGN USER BUTTONS //
export const AssignUserButtons = (props) => {
  return (
    <ButtonDiv>
      <CancelButton
        cancel_text={"Cancel"}
        cancel_action={props.handleAssignOpen}
      />
      <ConfirmButton
        confirm_text={"Assign"}
        confirm_action={props.do_assign_user}
      />
      <ConfirmButton
        confirm_text={"Un-assign"}
        confirm_action={props.do_unassign_user}
      />
    </ButtonDiv>
  );
};

// SELECT TEAM SECTION //
export const SelectTeamArea = (props) => {
  return (
    <>
      <SectionTitle
        title_text={"Assigned Teams"}
        style={{ marginBottom: "2vh" }}
      />
      <SelectWrapper style={{ marginBottom: "2vh" }}>
        <Select
          isClearable
          value={props.unassignSelected}
          onChange={(e) => {
            props.setUnassignSelected(e);
          }}
          options={props.assignedTeams}
        />
      </SelectWrapper>
      <SectionTitle
        title_text={"Other Teams"}
        style={{ marginBottom: "2vh" }}
      />
      <SelectWrapper style={{ marginBottom: "2vh" }}>
        <Select
          isClearable
          value={props.assignSelected}
          onChange={(e) => {
            props.setAssignSelected(e);
          }}
          options={props.unassignedTeams}
        />
      </SelectWrapper>
    </>
  );
};
