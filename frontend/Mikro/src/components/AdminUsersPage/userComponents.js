import React from "react";
import Select from "react-select";
import { styled } from "@mui/material/styles";
import { Input, SelectWrapper } from "./styles";
import { Modal, Divider } from "@mui/material";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ButtonDiv,
  ModalWrapper,
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
        <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={"Invite a new user"} />
        <SectionSubtitle
          subtitle_text={
            "An invitation to join Mikro under your organization will be sent to the email address entered below"
          }
        />
        <Divider />
        <EnterEmailArea handleSetInviteEmail={props.handleSetInviteEmail} />
        <Divider />
        <AddUserButtons
          form={props.form}
          do_invite_user={props.do_invite_user}
          handleAddOpen={props.handleAddOpen}
        />
      </ModalWrapper>
    </Modal>
  );
};

// ADD USER BUTTONS //
export const AddUserButtons = (props) => {
  return (
    <ButtonDiv>
      <CancelButton
        cancel_action={props.handleAddOpen}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_text={"Send"}
        confirm_action={props.do_invite_user}
      />
    </ButtonDiv>
  );
};

// ENTER EMAIL TEXT FIELD //
export const EnterEmailArea = (props) => {
  return (
    <>
      <SectionTitle text={"Email Address:"} style={{ marginBottom: "2vh" }} />
      <Input
        style={{ marginLeft: "2.5vw", marginBottom: "2vh" }}
        type="text"
        name="name"
        placeholder="InviteUser@mikro.com"
        onChange={(e) => {
          props.handleSetInviteEmail(e.target.value);
        }}
      />
    </>
  );
};

// DELETE USER MODAL //
export const DeleteUserModal = (props) => {
  return (
    <Modal open={props.deleteOpen} key="add">
      <ModalWrapper>
        <CloseButton action={props.handleDeleteOpen} />
        <SectionTitle title_text={"Remove a user"} />
        <SectionSubtitle
          subtitle_text={`User - ${props.selected_user}  will be removed from your organization`}
        />
        <Divider />
        <DeleteUserButtons
          form={props.form}
          do_remove_user={props.do_remove_user}
          handleDeleteOpen={props.handleDeleteOpen}
        />
      </ModalWrapper>
    </Modal>
  );
};

// DELETE USER BUTTONS //
export const DeleteUserButtons = (props) => {
  return (
    <ButtonDiv>
      <CancelButton
        cancel_action={props.handleDeleteOpen}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_text={"Remove"}
        confirm_action={() => props.do_remove_user(props.form)}
      />
    </ButtonDiv>
  );
};

// MODIFY USER MODAL //
export const ModifyUserModal = (props) => {
  return (
    <Modal open={props.modifyOpen} key="modify">
      <ModalWrapper>
        <CloseButton close_action={props.handleModifyOpen} />
        <SectionTitle
          title_text={
            "Edit the role of the selected user within your organization"
          }
        />
        <RoleDiv>
          <input
            type="radio"
            value="Admin"
            name="role"
            onChange={() => props.handleRoleSelected("admin")}
            checked={props.roleSelected === "admin"}
          />{" "}
          Admin
          <span style={{ width: "5vw" }} />
          <input
            type="radio"
            value="User"
            name="role"
            onChange={() => props.handleRoleSelected("user")}
            checked={props.roleSelected === "user"}
          />{" "}
          User
        </RoleDiv>
        <ModifyUserButtons
          handleModifyOpen={props.handleModifyOpen}
          do_modify_user={props.do_modify_user}
        />
      </ModalWrapper>
    </Modal>
  );
};

// MODIFY USER BUTTONS //
export const ModifyUserButtons = (props) => {
  return (
    <ButtonDiv>
      <CancelButton
        cancel_text={"Cancel"}
        cancel_action={props.handleModifyOpen}
      />
      <ConfirmButton
        confirm_text={"Confirm"}
        confirm_action={props.do_modify_user}
      />
    </ButtonDiv>
  );
};

// ASSIGN USER MODAL //
export const AssignUserModal = (props) => {
  return (
    <Modal open={props.assignOpen} key="assign">
      <ModalWrapper>
        <CloseButton close_action={props.handleAssignOpen} />
        <SectionTitle title_text={"Assign the selected user to a Team"} />
        <Divider />
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
