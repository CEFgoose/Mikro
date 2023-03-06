import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import Select from "react-select";
import { styled } from "@mui/material/styles";
import { Input, SelectWrapper } from "./styles";
import { Modal, Divider,Table, TableBody, Card,Grid } from "@mui/material";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ButtonDiv,
  ModalWrapper,
  StyledButton,
  USERS_TABLE_HEADERS,
  ASSIGN_USERS_TABLE_HEADERS,
  ProjectRow,
  ProjectCell,
  TableCard,
  ListHead,
  CardMediaStyle,

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
        <SectionTitle
          title_text={props.title_text}
        />
        <SectionSubtitle subtitle_text={`Are you sure you want to ${props.confirm_text} Project # ${props.projectSelected}-${props.projectName}?`} />
        <ModalButtons
          cancel_text={'Cancel'}
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


export const ProjectCardGrid = (props) => {
  return (

<div style={{ overflowY: "scroll", width: "85vw", height: "83vh" }}>
            <Grid
              sx={{
                height: "auto",
                position: "relative",
                top: "3vh",
                left: "3vw",
              }}
              container
              spacing={3}
            >
              {props.projects &&
                props.projects.slice().map((card) => {
                  const {
                    id,
                    name,
                    difficulty,
                    visibility,
                    total_payout,
                    rate_per_task,
                    max_editors,
                    total_editors,
                    total_tasks,
                    tasks_mapped,
                    tasks_validated,
                    tasks_invalidated,
                    url,
                    source,
                    max_payment,
                    payment_due,
                  } = card;
                  return (
                    <UserProjectCard
                      id={id}
                      name={name}
                      difficulty={difficulty}
                      visibility={visibility}
                      max_editors={max_editors}
                      total_editors={total_editors}
                      total_tasks={total_tasks}
                      rate_per_task={rate_per_task}
                      tasks_mapped={tasks_mapped}
                      tasks_validated={tasks_validated}
                      tasks_invalidated={tasks_invalidated}
                      total_payout={total_payout}
                      projectSelected={props.projectSelected}
                      source={source}
                      handleSetProjectSelected={props.handleSetProjectSelected}
                    />
                  );
                })}
            </Grid>
            </div>
  );
};




export const UserProjectCard = (props) => {

  return (
    <Card
      key={props.id}
      style={{
        boxShadow: "1px 1px 6px 2px gray",
        width: "25vw",
        height: "55vh",
        backgroundColor: "lightgray",
        marginLeft: "2vw",
        marginTop: "2vh",
      }}
    >
      <AdminCardMediaStyle>
        <input
          type={"checkbox"}
          id={props.id}
          value={props.id}
          checked={props.id === props.projectSelected}
          onChange={(e) => props.handleSetProjectSelected(props.id,props.name)}
          style={{ marginLeft: "1vw", marginBottom: "1vh" }}
        />
      </AdminCardMediaStyle>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          height: "10vh",
        }}
      >
        <SectionTitle title_text={props.name} />
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <SectionSubtitle subtitle_text={`Difficulty: ${props.difficulty}`} />
        <SectionSubtitle
          subtitle_text={`Visibility: ${
            props.visibility === true ? `Public` : `Private`
          }`}
        />
      </div>
      <SectionSubtitle
          subtitle_text={`Source: ${
            props.source === 'tasks' ? `TM4` : `TM3`
          }`}
        />
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Mapped %:"} />
          <SectionSubtitle
            subtitle_text={`${(props.total_tasks / 100) * props.tasks_mapped}%`}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Validated %:"} />
          <SectionSubtitle
            subtitle_text={`${
              (props.total_tasks / 100) * props.tasks_validated
            }%`}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Editors:"} />
          <SectionSubtitle
            subtitle_text={`${props.total_editors}/${props.max_editors}`}
          />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Tasks Mapped:"} />
          <SectionSubtitle subtitle_text={props.tasks_mapped} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Tasks Validated:"} />
          <SectionSubtitle subtitle_text={props.tasks_validated} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Current Payout:"} />
          <SectionSubtitle subtitle_text={`$${props.total_payout / 100}`} />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Total Tasks:"} />
          <SectionSubtitle subtitle_text={props.total_tasks} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Rate/Task:"} />
          <SectionSubtitle subtitle_text={`$${props.rate_per_task / 100}`} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Total Budget:"} />
          <SectionSubtitle subtitle_text={"$20.00"} />
        </div>
      </div>
    </Card>
  );
};