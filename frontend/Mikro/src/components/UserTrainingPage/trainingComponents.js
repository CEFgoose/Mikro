import React ,{useEffect,useState,useContext}from "react";
import { Modal, Table, TableBody, TablePagination } from "@mui/material";
import { DataContext } from "common/DataContext";
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

  const {
    shuffleArray,
  } = useContext(DataContext);

  const[answers,setAnswers]=useState([])

  const[tempAnswer,setTempAnswer]=useState(null)

  useEffect(() => {
    let tempArray=[]
    if(props.questions.length>0){
      console.log(props.questions[0].questions[props.questionIndex].question)
      for (let i = 0; i < props.questions[0].questions[props.questionIndex].incorrect.length; i++) {
        tempArray.push(props.questions[0].questions[props.questionIndex].incorrect[i])
      }
      tempArray.push(props.questions[0].questions[props.questionIndex].correct)
      setAnswers(shuffleArray(tempArray))
    }

    // eslint-disable-next-line
  }, [props.questionIndex,props.questions]);


  const handleSetAnswer=(value)=>{
    let tempArray=props.results
    setTempAnswer(value)
    if(value=== props.questions[0].questions[props.questionIndex].correct){
      tempArray.push(true)
    }
    else{
      tempArray.push(false)
    }
    props.setResults(tempArray)

  }

  return (
    <Modal open={props.quizOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleQuizOpen} />
        <SectionTitle title_text={`Test our for training: ${props.title}`} />


            <div
              style={{
                width: "100%",
                backgroundColor: "black",
                height: ".05vh",
                marginBottom: "2vh",
              }}
            />
            {props.questions&&props.questions.length>0?(
            <>
            <SectionSubtitle subtitle_text={`Question ${props.questionIndex +1}: ${props.questions[0].questions[props.questionIndex].question}?`} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "6vw",
                marginBottom: "3vh",
              }}
            >
              {answers.map((answer, index) => (
                <div
                  key={index}
                  style={{ display: "flex", flexDirection: "row" }}
                >
                  <input
                    type="radio"
                    value={answer}
                    name="private"
                    onChange={() => handleSetAnswer(answer)}
                    checked={tempAnswer=== answer}
                    style={{ marginLeft: "6.5vw" }}
                  />
                  <SectionSubtitle subtitle_text={answer} />
                </div>
              ))}
            </div>
          </>
         ) 
          :(<></>)
          }


            <div style={{ marginBottom: "1vh" }}>
              <ModalButtons
                confirm_text={props.confirmButtonText}
                confirm_action={()=>props.handleChangeQuestionIndex()}
                cancel_text={"Cancel"}
                cancel_action={props.handleQuizOpen}
              />
            </div>



      </ModalWrapper>
    </Modal>
  );
};

export const UserTrainingTable = (props) => {
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
      <TableCard
        style={{ boxShadow: "1px 1px 6px 2px gray", overflowY: "scroll" }}
      >
        <CardMediaStyle />
        <Table style={{}}>
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
        </Table>
      </TableCard>
    </div>
  );
};
