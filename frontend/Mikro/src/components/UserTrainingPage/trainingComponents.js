import React from "react";
import { Modal, Table, TableBody, TablePagination } from "@mui/material";
import {
  ProjectRow,
  CardMediaStyle,
  TableCard,
  ProjectCell,
  ListHead,
  CloseButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
  ModalButtons,
  CancelButton,
} from "../commonComponents/commonComponents";

export const USER_TRAINING_HEADERS = [
  { id: "name", label: "Title", alignRight: false },
  { id: "difficulty", label: "Difficulty", alignRight: false },
  { id: "point_value", label: "Point Value", alignRight: false },
  { id: "link", label: "Link", alignRight: false },
];

export const TrainingQuizModal = (props) => {
  return (
    <Modal open={props.quizOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleQuizOpen} />
        <SectionTitle title_text={`Test our for training: ${props.title}`} />
        {props.modalPage === 1 ? (
          <>
            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "2vh",
              }}
            />
            <SectionSubtitle subtitle_text={`Question 1: ${props.question1}`} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "6vw",
                marginBottom: "3vh",
              }}
            >
              {props.answers1.map((answer, index) => (
                <div
                  key={index}
                  style={{ display: "flex", flexDirection: "row" }}
                >
                  <input
                    type="radio"
                    value={answer}
                    name="private"
                    onChange={() => props.handleAnswerSelected(answer)}
                    checked={props.selectedAnswer === answer}
                    style={{ marginLeft: "6.5vw" }}
                  />
                  <SectionSubtitle subtitle_text={answer} />
                </div>
              ))}
            </div>
            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "1vh",
              }}
            />
          </>
        ) : props.modalPage === 2 ? (
          <>
            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "2vh",
              }}
            />
            <SectionSubtitle subtitle_text={`Question 2: ${props.question2}`} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "6vw",
                marginBottom: "3vh",
              }}
            >
              {props.answers2.map((answer, index) => (
                <div
                  key={index}
                  style={{ display: "flex", flexDirection: "row" }}
                >
                  <input
                    type="radio"
                    value={answer}
                    name="private"
                    onChange={() => props.handleAnswerSelected(answer)}
                    checked={props.selectedAnswer === answer}
                    style={{ marginLeft: "6.5vw" }}
                  />
                  <SectionSubtitle subtitle_text={answer} />
                </div>
              ))}
            </div>
            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "1vh",
              }}
            />
          </>
        ) : props.modalPage === 3 ? (
          <>
            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "2vh",
              }}
            />
            <SectionSubtitle subtitle_text={`Question 3: ${props.question3}`} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "6vw",
                marginBottom: "3vh",
              }}
            >
              {props.answers3.map((answer, index) => (
                <div
                  key={index}
                  style={{ display: "flex", flexDirection: "row" }}
                >
                  <input
                    type="radio"
                    value={answer}
                    name="private"
                    onChange={() => props.handleAnswerSelected(answer)}
                    checked={props.selectedAnswer === answer}
                    style={{ marginLeft: "6.5vw" }}
                  />
                  <SectionSubtitle subtitle_text={answer} />
                </div>
              ))}
            </div>
            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "1vh",
              }}
            />
          </>
        ) : props.modalPage === 4 ? (
          <>
            <SectionSubtitle subtitle_text={"Quiz Complete"} />
          </>
        ) : (
          <>
            <SectionSubtitle subtitle_text={props.quizResultsText} />
          </>
        )}
        {props.modalPage !== 5 ? (
          <>
            <div style={{ marginBottom: "1vh" }}>
              <ModalButtons
                confirm_text={props.confirmButtonText}
                confirm_action={() => props.handleSetModalPage()}
                cancel_text={"Cancel"}
                cancel_action={props.handleQuizOpen}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "2vh",
                marginBottom: "1vh",
              }}
            >
              <CancelButton
                cancel_action={() => props.handleQuizOpen()}
                cancel_text={"Close"}
              />
            </div>
          </>
        )}
      </ModalWrapper>
    </Modal>
  );
};

export const UserTrainingTable = (props) => {
    //console.log(props);
  const updateData = (sortedData) => {
    props.setOrgTrainings(sortedData);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        marginLeft: "3.5vw",
        height: "78vh",
        width: "77.5vw",
      }}
    >
      <TableCard style={{ boxShadow: "1px 1px 6px 2px gray" }}>
        <CardMediaStyle />
        <Table style={{}}>
        <div style={{height:'40vh', width:'77.5vw',overflowY:'scroll'}}>
          <ListHead 
            headLabel={USER_TRAINING_HEADERS}
            tableData={props.orgTrainings}
            updateData={updateData}
           />
          <TableBody>
            {props.orgTrainings &&
              props.orgTrainings
                .slice(
                  props.page * props.rowsPerPage,
                  props.page * props.rowsPerPage + props.rowsPerPage
                )
                .map((row) => {
                  const {
                    id,
                    title,
                    training_url,
                    training_type,
                    point_value,
                    difficulty,
                    question1,
                    answer1,
                    incorrect1_1,
                    incorrect1_2,
                    incorrect1_3,
                    question2,
                    answer2,
                    incorrect2_1,
                    incorrect2_2,
                    incorrect2_3,
                    question3,
                    answer3,
                    incorrect3_1,
                    incorrect3_2,
                    incorrect3_3,
                  } = row;
                  return (
                    <ProjectRow
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(145, 165, 172, 0.5)",
                          cursor: "pointer",
                        },
                      }}
                      align="center"
                      key={row}
                      tabIndex={-1}
                      onClick={() => props.handleSetTrainingSelected(row)}
                      selected={props.trainingSelected === id}
                    >
                      <ProjectCell entry={<strong>{title}</strong>} />
                      <ProjectCell entry={difficulty} />
                      <ProjectCell entry={point_value} />
                      <ProjectCell entry={training_url} />
                    </ProjectRow>
                  );
                })}
          </TableBody>
          </div>
        </Table>
      </TableCard>
    </div>
  );
};
