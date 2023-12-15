import React, { useContext, useState, useEffect } from "react";
import useToggle from "hooks/useToggle";
import { DataContext } from "common/DataContext";
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
  ConfirmButton,
  CancelButton,
} from "../commonComponents/commonComponents";
import plus_icon from "../../images/plus_icon.png";
export const ADMIN_TRAINING_HEADERS = [
  { id: "name", label: "Title", alignRight: false },
  { id: "Difficulty", label: "Difficulty", alignRight: false },
  { id: "Point Value", label: "Point Value", alignRight: false },
  { id: "Link", label: "Link", alignRight: false },
];

export const AddTrainingModal = (props) => {
  const {
    trainingQuestions,
    setTrainingQuestions,
    questionCounter,
    setQuestionCounter,
    createTraining,
  } = useContext(DataContext);

  const [tempQuestion, setTempQuestion] = useState(null);
  const [tempCorrect, setTempCorrect] = useState(null);
  const [tempIncorrect, setTempIncorrect] = useState(null);
  const [tempIncorrectAnswers, setTempIncorrectAnswers] = useState([]);

  const [point_value, setPointValue] = useState(5);
  const [difficulty, setDifficulty] = useState("easy");
  const [title, setTitle] = useState(null);
  const [training_url, setURL] = useState(null);
  const [page, setPage] = useState(1);
  const handleSetTitle = (e) => {
    setTitle(e.target.value);
  };

  const handleSetURL = (e) => {
    setURL(e.target.value);
  };

  const handleSetPointValue = (e) => {
    setPointValue(e.target.value);
  };

  const handleSetDifficulty = (e) => {
    setDifficulty(e.target.value);
  };

  const handleSetTempQuestion = (e) => {
    setTempQuestion(e.target.value);
  };

  const handleSetTempCorrect = (e) => {
    setTempCorrect(e.target.value);
  };

  const handleSetTempIncorrect = (e) => {
    setTempIncorrect(e.target.value);
  };

  const handleAddIncorrectAnswer = () => {
    let incorrectObj = {
      index: tempIncorrectAnswers.length + 1,
      answer: tempIncorrect,
    };
    setTempIncorrectAnswers([...tempIncorrectAnswers, incorrectObj]);
    setTempIncorrect("");
  };

  const handleSetQuestionObject = () => {
    let questionObj = {
      question: tempQuestion,
      correct: tempCorrect,
      incorrect: tempIncorrectAnswers,
    };
    setTrainingQuestions([...trainingQuestions, questionObj]);
  };

  const handleResetForm = () => {
    setTempQuestion("");
    setTempCorrect("");
    setTempIncorrect("");
    setTempIncorrectAnswers([]);
  };

  const handleSetPage = () => {
    if (page === 1) {
      if (training_url && difficulty && point_value) {
        setPage(2);
        return;
      }
    }
    if (page === 2) {
      handleSetQuestionObject();
      handleResetForm();
    }
  };

  const handleCreateTraining = () => {
    if (trainingQuestions.length > 0) {
      createTraining(
        title,
        training_url,
        props.trainingType,
        point_value,
        difficulty
      );
      handleResetForm();
      props.handleAddOpen();
    }
  };

  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={<strong>Add New Training Lesson</strong>} />
        {page === 1 ? (
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
                  value={title}
                  onChange={(e) => handleSetTitle(e)}
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
                  value={training_url}
                  onChange={(e) => handleSetURL(e)}
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
                  value={point_value}
                  onChange={(e) => handleSetPointValue(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "10vw" }}
                />

                <SectionTitle title_text={"Difficulty:"} />
                <select
                  value={difficulty}
                  style={{ marginRight: "1vw" }}
                  onChange={handleSetDifficulty}
                >
                  <option value="Easy" onChange={(e) => handleSetDifficulty(e)}>
                    Easy
                  </option>
                  <option
                    value="Intermediate"
                    onChange={(e) => handleSetDifficulty(e)}
                  >
                    Intermediate
                  </option>
                  <option value="Hard" onChange={(e) => handleSetDifficulty(e)}>
                    Hard
                  </option>
                </select>
              </div>
            </div>
          </>
        ) : page === 2 ? (
          <>
            <SectionSubtitle
              subtitle_text={
                "Enter a question, a correct answer, and and any number of incorrect answers."
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
              <SectionTitle title_text={"Question:"} />
              <input
                type="text"
                value={tempQuestion}
                onChange={(e) => handleSetTempQuestion(e)}
                style={{ height: "5vh", width: "95%" }}
              />

              <SectionTitle title_text={"Correct Answer:"} />
              <input
                type="text"
                value={tempCorrect}
                onChange={(e) => handleSetTempCorrect(e)}
                style={{ height: "5vh", width: "95%" }}
              />
              <SectionTitle title_text={"Incorrect Answers:"} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "95%",
                  height: "auto",
                  alignItems: "center",
                  justifyContent: "left",
                  backgroundColor: "lightgoldenrodyellow",
                }}
              >
                <input
                  type="text"
                  value={tempIncorrect}
                  onChange={(e) => handleSetTempIncorrect(e)}
                  style={{ height: "5vh", width: "90%", marginRight: "3vw" }}
                />
                <img
                  onClick={() => handleAddIncorrectAnswer()}
                  alt={"plus icon"}
                  src={plus_icon}
                  style={{
                    width: "2rem",
                    height: "2rem",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "95%",
                  height: "30vh",
                  backgroundColor: "lightgrey",
                  overflowY: "scroll",
                }}
              >
                {tempIncorrectAnswers &&
                  tempIncorrectAnswers.slice().map((row) => {
                    const { index, answer } = row;
                    return (
                      <>
                        <div>
                          <SectionSubtitle
                            subtitle_text={`Incorrect Answer ${index}: ${answer}`}
                          />
                        </div>
                      </>
                    );
                  })}
              </div>
            </div>
          </>
        ) : page === 3 ? (
          <></>
        ) : page === 4 ? (
          <></>
        ) : (
          <></>
        )}

        <div
          style={{
            marginBottom: "1vh",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <CancelButton
            cancel_action={() => props.handleAddOpen()}
            cancel_text={"Cancel"}
          />
          <ConfirmButton
            confirm_action={() => handleSetPage()}
            confirm_text={"Next"}
          />
          <ConfirmButton
            confirm_action={() => handleCreateTraining()}
            confirm_text={"Submit"}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};

export const ModifyTrainingModal = (props) => {
  const {
    trainingQuestions,
    setTrainingQuestions,
    questionCounter,
    setQuestionCounter,
    modifyTraining,
  } = useContext(DataContext);

  const [page, setPage] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [tempQuestions, setTempQuestions] = useState(null);
  const [tempQuestion, setTempQuestion] = useState(null);
  const [tempCorrect, setTempCorrect] = useState(null);
  const [tempIncorrect, setTempIncorrect] = useState(null);
  const [tempIncorrectAnswers, setTempIncorrectAnswers] = useState([]);
  const [lastPage, toggleLastPage] = useToggle(false);
  const [addQuestion, toggleAddQuestion] = useToggle(false);
  useEffect(() => {
    if (props.questions !== null) {
      setTempQuestions(props.questions);
    }
    // eslint-disable-next-line
  }, [props.questions]);

  useEffect(() => {
    console.log(addQuestion);
    // eslint-disable-next-line
  }, [addQuestion]);

  useEffect(() => {
    if (tempQuestions !== null) {
      console.log(questionIndex, tempQuestions.length);
      if (questionIndex + 2 > tempQuestions.length) {
        toggleLastPage();
      }
      if (questionIndex === tempQuestions.length && !addQuestion) {
        handleModifyTraining();
        return;
      }
      if (questionIndex < tempQuestions.length) {
        setTempQuestion(tempQuestions[questionIndex].question);
        setTempCorrect(tempQuestions[questionIndex].correct);
        setTempIncorrectAnswers(tempQuestions[questionIndex].incorrect);
        setTrainingQuestions(tempQuestions);
      }
    }
    // console.log(tempQuestions,props.questions)

    // eslint-disable-next-line
  }, [questionIndex, props.questions, tempQuestions]);

  const handleSetPage = (operator) => {
    if (page === 1) {
      setPage(2);
      setQuestionIndex(0);
    }
    if (page === 2) {
      handleSetQuestionObject();

      if (questionIndex + 1 <= tempQuestions.length) {
        if (operator === "back") {
          if (addQuestion === true) {
            toggleAddQuestion(false);
          }
          if (lastPage === true) {
            toggleLastPage();
          }
          if (questionIndex - 1 < 0) {
            setPage(1);
          } else {
            setQuestionIndex((prevCount) => prevCount - 1);
          }
        } else {
          setQuestionIndex((prevCount) => prevCount + 1);
        }
      }
    }
  };

  const handleSetTempQuestion = (e) => {
    setTempQuestion(e.target.value);
  };

  const handleSetTempCorrect = (e) => {
    setTempCorrect(e.target.value);
  };

  const handleSetTempIncorrect = (index, e) => {
    let temparray = [...tempIncorrectAnswers];
    temparray[index] = e.target.value;
    setTempIncorrectAnswers(temparray);
  };

  const handleAddIncorrectAnswer = () => {
    let incorrectObj = {
      index: tempIncorrectAnswers.length + 1,
      answer: tempIncorrect,
    };
    setTempIncorrectAnswers([...tempIncorrectAnswers, incorrectObj]);
    setTempIncorrect("");
  };

  // const handleSetQuestionObject=()=>{
  //   let questionObj={
  //     'question':tempQuestion,
  //     'correct':tempCorrect,
  //     'incorrect':tempIncorrectAnswers
  //   }
  //   setTrainingQuestions([...trainingQuestions, questionObj]);
  // }

  const handleResetForm = () => {
    setTempQuestion("");
    setTempCorrect("");
    setTempIncorrect("");
    setTempIncorrectAnswers([]);
  };

  const handleSetQuestionObject = () => {
    let questionObj = {
      question: tempQuestion,
      correct: tempCorrect,
      incorrect: tempIncorrectAnswers,
    };
    setTempQuestions((prevArray) =>
      prevArray.map((item, i) => (i === questionIndex ? questionObj : item))
    );
  };

  const handleModifyTraining = () => {
    modifyTraining(
      props.trainingSelected,
      props.title,
      props.training_url,
      props.trainingType,
      props.pointValue,
      props.difficulty
    );
    handleResetForm();
    setPage(1);
    toggleLastPage(false);
    props.handleModifyOpen();
  };

  const handleAddQuestion = () => {
    handleSetQuestionObject();
    setQuestionIndex((prevCount) => prevCount + 1);
    toggleAddQuestion();
    setTempQuestion("");
    setTempCorrect("");
    setTempIncorrectAnswers([]);
  };

  return (
    <Modal open={props.modifyOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleModifyOpen} />
        <SectionTitle title_text={"Edit Training Lesson"} />
        {page === 1 ? (
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
                  value={props.training_url}
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
                  value={props.difficulty}
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
        ) : page === 2 ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "95%",
                height: "60vh",
                margin: "auto",
              }}
            >
              {addQuestion && addQuestion === true ? (
                <></>
              ) : (
                <>
                  <SectionSubtitle
                    subtitle_text={"Edit Training Questions and Answers."}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "95%",
                      height: "60rem",
                      backgroundColor: "lightgrey",
                      overflowY: "scroll",
                      margin: "auto",
                      marginBottom: "1vh",
                    }}
                  >
                    <SectionTitle
                      title_text={`Question:${questionIndex + 1}`}
                    />
                    <input
                      type="text"
                      value={tempQuestion}
                      onChange={(e) => handleSetTempQuestion(e)}
                      style={{ height: "2rem", width: "95%", margin: "auto" }}
                    />

                    <SectionTitle title_text={"Correct Answer:"} />
                    <input
                      type="text"
                      value={tempCorrect}
                      onChange={(e) => handleSetTempCorrect(e)}
                      style={{ height: "3rem", width: "95%", margin: "auto" }}
                    />
                    <SectionTitle title_text={"Incorrect Answers:"} />

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "50vh",
                        justifyContent: "left",
                        marginBottom: "2vh",
                      }}
                    >
                      {tempIncorrectAnswers &&
                        tempIncorrectAnswers.slice().map((row, index) => {
                          const { answer } = row;
                          return (
                            <>
                              <div>
                                <input
                                  type="text"
                                  value={row}
                                  onChange={(e) =>
                                    handleSetTempIncorrect(index, e)
                                  }
                                  style={{
                                    height: "2rem",
                                    width: "95%",
                                    marginLeft: "1vw",
                                    marginBottom: "1vh",
                                  }}
                                />
                              </div>
                            </>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <></>
        )}

        <div
          style={{
            marginBottom: "1vh",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <CancelButton
            cancel_action={() => props.handleAddOpen()}
            cancel_text={"Cancel"}
          />
          <ConfirmButton
            confirm_action={() => handleSetPage("back")}
            confirm_text={"Back"}
          />
          {lastPage === true ? (
            <>
              {/* <ConfirmButton
                confirm_action={() => handleAddQuestion()}
                confirm_text={"Add"}
              /> */}
              <ConfirmButton
                confirm_action={() => handleSetPage()}
                confirm_text={"Submit"}
              />
            </>
          ) : (
            <>
              <ConfirmButton
                confirm_action={() => handleSetPage()}
                confirm_text={"Next"}
              />
            </>
          )}
        </div>
      </ModalWrapper>
    </Modal>
  );
};

export const AdminTrainingTable = (props) => {
  const updateData = (sortedData) => {
    props.setOrgTrainings(sortedData);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "87vh",
      }}
    >
      <TableCard
        style={{ boxShadow: "1px 1px 6px 2px gray", overflowY: "scroll" }}
      >
        <CardMediaStyle />
        <Table style={{}}>
          <ListHead
            headLabel={ADMIN_TRAINING_HEADERS}
            tableData={props.orgTrainings}
            updateData={updateData}
          />
          <TableBody>
            {props.orgTrainings &&
              props.orgTrainings.slice().map((row) => {
                const {
                  id,
                  title,
                  training_url,
                  training_type,
                  point_value,
                  difficulty,
                  questions,
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
                    onDoubleClick={() => {
                      window.open(training_url);
                    }}
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
