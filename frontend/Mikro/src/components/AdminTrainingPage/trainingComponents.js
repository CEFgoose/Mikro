import React from "react";
import {
  Modal,
  Divider,
  Table,
  TableBody,
  TablePagination,
} from "@mui/material";
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
} from "../commonComponents/commonComponents";

export const ADMIN_TRAINING_HEADERS = [
  { id: "name", label: "Title", alignRight: false },
  { id: "Difficulty", label: "Difficulty", alignRight: false },
  { id: "Point Value", label: "Point Value", alignRight: false },
  { id: "Link", label: "Link", alignRight: false },
];

export const AddTrainingModal = (props) => {
  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={"Add New Training Lesson"} />
        {props.modalPage === 1 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Enter the Title, the URL link to the video or training document, the difficulty level and the point value for this lesson"
              }
            />
            <Divider />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"Title:"} />
                <input
                  type="text"
                  value={props.title}
                  onChange={(e) => props.handleSetTitle(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
                />
              </div>
            </div>
            <Divider />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"URL:"} />
                <input
                  type="text"
                  value={props.URL}
                  onChange={(e) => props.handleSetURL(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
                />
              </div>
            </div>
            <Divider />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"Point Value:"} />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={props.pointValue}
                  onChange={(e) => props.handleSetPointValue(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "10vw" }}
                />

                <SectionTitle title_text={"Difficulty:"} />
                <select
                  // value={props.difficulty}
                  style={{ marginRight: "1vw" }}
                  onChange={props.handleSetDifficulty}
                >
                  <option
                    value="Easy"
                    onChange={(e) => props.handleSetDifficulty(e)}
                  >
                    Easy
                  </option>
                  <option
                    value="Intermediate"
                    onChange={(e) => props.handleSetDifficulty(e)}
                  >
                    Intermediate
                  </option>
                  <option
                    value="Hard"
                    onChange={(e) => props.handleSetDifficulty(e)}
                  >
                    Hard
                  </option>
                </select>
              </div>
            </div>
          </>
        ) : props.modalPage === 2 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Enter question 1, the correct answer, and three incorrect answers."
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
                alignItems: "center",
              }}
            >
              <SectionTitle title_text={"Question 1:"} />
              <input
                type="text"
                value={props.question1}
                onChange={(e) => props.handleSetQuestion(1, e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={props.answer1}
                onChange={(e) => props.handleSetAnswer(1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 1:"} />
              <input
                type="text"
                value={props.incorrect1_1}
                onChange={(e) => props.handleSetIncorrect(1, 1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 2:"} />
              <input
                type="text"
                value={props.incorrect1_2}
                onChange={(e) => props.handleSetIncorrect(1, 2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 3:"} />
              <input
                type="text"
                value={props.incorrect1_3}
                onChange={(e) => props.handleSetIncorrect(1, 3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
            </div>
          </>
        ) : props.modalPage === 3 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Enter question 2, the correct answer, and three incorrect answers."
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
                alignItems: "center",
              }}
            >
              <SectionTitle title_text={"Question 2:"} />
              <input
                type="text"
                value={props.question2 ? props.question2 : ""}
                onChange={(e) => props.handleSetQuestion(2, e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={props.answer2 ? props.answer2 : ""}
                onChange={(e) => props.handleSetAnswer(2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 1:"} />
              <input
                type="text"
                value={props.incorrect2_1 ? props.incorrect2_1 : ""}
                onChange={(e) => props.handleSetIncorrect(2, 1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 2:"} />
              <input
                type="text"
                value={props.incorrect2_2 ? props.incorrect2_2 : ""}
                onChange={(e) => props.handleSetIncorrect(2, 2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 3:"} />
              <input
                type="text"
                value={props.incorrect2_3 ? props.incorrect2_3 : ""}
                onChange={(e) => props.handleSetIncorrect(2, 3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
            </div>
          </>
        ) : props.modalPage === 4 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Enter question 3, the correct answer, and three incorrect answers."
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
                alignItems: "center",
              }}
            >
              <SectionTitle title_text={"Question 3:"} />
              <input
                type="text"
                value={props.question3 ? props.question3 : ""}
                onChange={(e) => props.handleSetQuestion(3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={props.answer3 ? props.answer3 : ""}
                onChange={(e) => props.handleSetAnswer(3, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 1:"} />
              <input
                type="text"
                value={props.incorrect3_1 ? props.incorrect3_1 : ""}
                onChange={(e) => props.handleSetIncorrect(3, 1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 2:"} />
              <input
                type="text"
                value={props.incorrect3_2 ? props.incorrect3_2 : ""}
                onChange={(e) => props.handleSetIncorrect(3, 2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 3:"} />
              <input
                type="text"
                value={props.incorrect3_3 ? props.incorrect3_3 : ""}
                onChange={(e) => props.handleSetIncorrect(3, 3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
            </div>
          </>
        ) : (
          <></>
        )}

        <div style={{ marginBottom: "1vh" }}>
          <ModalButtons
            confirm_text={props.modalPage !== 4 ? "Next" : "Submit"}
            confirm_action={() => props.handleSetModalPage()}
            cancel_text={"Cancel"}
            cancel_action={props.handleAddOpen}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};

export const ModifyTrainingModal = (props) => {
  return (
    <Modal open={props.modifyOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleModifyOpen} />
        <SectionTitle title_text={"Edit Training Lesson"} />
        {props.modalPage === 1 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Edit the Title, the URL link to the video or training document, the difficulty level and the point value for this lesson"
              }
            />
            <Divider />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"Title:"} />
                <input
                  type="text"
                  value={props.title}
                  onChange={(e) => props.handleSetTitle(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
                />
              </div>
            </div>
            <Divider />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"URL:"} />
                <input
                  type="text"
                  value={props.URL}
                  onChange={(e) => props.handleSetURL(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
                />
              </div>
            </div>
            <Divider />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"Point Value:"} />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={props.pointValue}
                  onChange={(e) => props.handleSetPointValue(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "10vw" }}
                />

                <SectionTitle title_text={"Difficulty:"} />
                <select
                  // value={props.difficulty}
                  style={{ marginRight: "1vw" }}
                  onChange={props.handleSetDifficulty}
                >
                  <option
                    value="Easy"
                    onChange={(e) => props.handleSetDifficulty(e)}
                  >
                    Easy
                  </option>
                  <option
                    value="Intermediate"
                    onChange={(e) => props.handleSetDifficulty(e)}
                  >
                    Intermediate
                  </option>
                  <option
                    value="Hard"
                    onChange={(e) => props.handleSetDifficulty(e)}
                  >
                    Hard
                  </option>
                </select>
              </div>
            </div>
          </>
        ) : props.modalPage === 2 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Edit question 1, the correct answer, and three incorrect answers."
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
                alignItems: "center",
              }}
            >
              <SectionTitle title_text={"Question 1:"} />
              <input
                type="text"
                value={props.question1}
                onChange={(e) => props.handleSetQuestion(1, e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={props.answer1}
                onChange={(e) => props.handleSetAnswer(1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 1:"} />
              <input
                type="text"
                value={props.incorrect1_1}
                onChange={(e) => props.handleSetIncorrect(1, 1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 2:"} />
              <input
                type="text"
                value={props.incorrect1_2}
                onChange={(e) => props.handleSetIncorrect(1, 2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 3:"} />
              <input
                type="text"
                value={props.incorrect1_3}
                onChange={(e) => props.handleSetIncorrect(1, 3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
            </div>
          </>
        ) : props.modalPage === 3 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Edit question 2, the correct answer, and three incorrect answers."
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
                alignItems: "center",
              }}
            >
              <SectionTitle title_text={"Question 2:"} />
              <input
                type="text"
                value={props.question2 ? props.question2 : ""}
                onChange={(e) => props.handleSetQuestion(2, e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={props.answer2 ? props.answer2 : ""}
                onChange={(e) => props.handleSetAnswer(2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 1:"} />
              <input
                type="text"
                value={props.incorrect2_1 ? props.incorrect2_1 : ""}
                onChange={(e) => props.handleSetIncorrect(2, 1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 2:"} />
              <input
                type="text"
                value={props.incorrect2_2 ? props.incorrect2_2 : ""}
                onChange={(e) => props.handleSetIncorrect(2, 2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 3:"} />
              <input
                type="text"
                value={props.incorrect2_3 ? props.incorrect2_3 : ""}
                onChange={(e) => props.handleSetIncorrect(2, 3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
            </div>
          </>
        ) : props.modalPage === 4 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Edit question 3, the correct answer, and three incorrect answers."
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "1vh",
                alignItems: "center",
              }}
            >
              <SectionTitle title_text={"Question 3:"} />
              <input
                type="text"
                value={props.question3 ? props.question3 : ""}
                onChange={(e) => props.handleSetQuestion(3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={props.answer3 ? props.answer3 : ""}
                onChange={(e) => props.handleSetAnswer(3, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 1:"} />
              <input
                type="text"
                value={props.incorrect3_1 ? props.incorrect3_1 : ""}
                onChange={(e) => props.handleSetIncorrect(3, 1, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 2:"} />
              <input
                type="text"
                value={props.incorrect3_2 ? props.incorrect3_2 : ""}
                onChange={(e) => props.handleSetIncorrect(3, 2, e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Incorrect 3:"} />
              <input
                type="text"
                value={props.incorrect3_3 ? props.incorrect3_3 : ""}
                onChange={(e) => props.handleSetIncorrect(3, 3, e)}
                style={{ height: "5vh", width: "95%" }}
              />
            </div>
          </>
        ) : (
          <></>
        )}

        <div style={{ marginBottom: "1vh" }}>
          <ModalButtons
            confirm_text={props.modalPage !== 4 ? "Next" : "Submit"}
            confirm_action={() => props.handleSetModalPage()}
            cancel_text={"Cancel"}
            cancel_action={props.handleAddOpen}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};

export const AdminTrainingTable = (props) => {
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
        <Table>
          <ListHead headLabel={ADMIN_TRAINING_HEADERS} />
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
                      onDoubleClick={()=>{window.open(training_url)}}
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
        </Table>
        <TablePagination
          style={{ width: "auto" }}
          rowsPerPageOptions={[5, 10, 15]}
          component="div"
          count={props.pay_requests ? props.pay_requests.length : 5}
          rowsPerPage={props.rowsPerPage}
          page={props.page}
          onPageChange={(e, page) => props.setPage(page)}
          onRowsPerPageChange={(e) => props.handleChangeRowsPerPage(e)}
        />
      </TableCard>
    </div>
  );
};

export const DeleteTrainingModal = (props) => {
  return (
    <Modal open={props.deleteOpen} key="delete">
      <ModalWrapper>
        <CloseButton close_action={props.handleDeleteOpen} />
        <SectionTitle
          title_text={`Are you sure you want to delete training: ${props.training_title}?`}
        />
        <div style={{ marginBottom: "2vh" }}>
          <ModalButtons
            confirm_text={"Delete"}
            confirm_action={() => props.handleDeleteTraining()}
            cancel_text={"Cancel"}
            cancel_action={props.handleDeleteOpen}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};
