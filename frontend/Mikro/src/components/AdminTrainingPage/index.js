import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Redirect } from "react-router-dom";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import useToggle from "../../hooks/useToggle.js";
import {ButtonDivComponent} from "components/commonComponents/commonComponents";
import { AdminTrainingTable,AddTrainingModal } from "./trainingComponents";
import "./styles.css";

export const AdminTrainingPage = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,

  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [redirect, setRedirect] = useState(false);
  const [page, setPage] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [requestOpen, toggleRequestOpen] = useToggle(false);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [URL,setURL] = useState(null)
  const [pointValue,setPointValue] = useState(null)
  const [difficulty, setDifficulty] = useState(null)

  const [question1,setQuestion1]=useState(null)
  const [answer1,setAnswer1]=useState(null)
  const [incorrect1_1,setIncorrect1_1]=useState(null)
  const [incorrect1_2,setIncorrect1_2]=useState(null)
  const [incorrect1_3,setIncorrect1_3]=useState(null)

  const [question2,setQuestion2]=useState(null)
  const [answer2,setAnswer2]=useState(null)
  const [incorrect2_1,setIncorrect2_1]=useState(null)
  const [incorrect2_2,setIncorrect2_2]=useState(null)
  const [incorrect2_3,setIncorrect2_3]=useState(null)
  
  const [question3,setQuestion3]=useState(null)
  const [answer3,setAnswer3]=useState(null)
  const [incorrect3_1,setIncorrect3_1]=useState(null)
  const [incorrect3_2,setIncorrect3_2]=useState(null)
  const [incorrect3_3,setIncorrect3_3]=useState(null)



  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      setRedirect(true);
    }
    if (user !== null && user.role !== "admin") {
      setRedirect(true);
    }

    // eslint-disable-next-line
  }, []);

  useEffect(() => {

    // eslint-disable-next-line
  }, [activeTab]);

  const handleSetQuestion=(number,e)=>{
    if(number===1){
      setQuestion1(e.target.value)
    }
    if(number===2){
      setQuestion2(e.target.value)
    }
    if(number===3){
      setQuestion3(e.target.value)
    }
  }

  const handleSetAnswer=(number,e)=>{
    if(number===1){
      setAnswer1(e.target.value)
    }
    if(number===2){
      setAnswer2(e.target.value)
    }
    if(number===3){
      setAnswer3(e.target.value)
    }
  }

  const handleSetIncorrect=(number,count,e)=>{
    if(number===1){
      if (count === 1){
        setIncorrect1_1(e.target.value)
      }
      if (count === 2){
        setIncorrect1_2(e.target.value)
      }
      if (count === 3){
        setIncorrect1_3(e.target.value)
      }
    }
    if(number===2){
      if (count === 1){
        setIncorrect2_1(e.target.value)
      }
      if (count === 2){
        setIncorrect2_2(e.target.value)
      }
      if (count === 3){
        setIncorrect2_3(e.target.value)
      }
    }
    if(number===3){
      if (count === 1){
        setIncorrect3_1(e.target.value)
      }
      if (count === 2){
        setIncorrect3_2(e.target.value)
      }
      if (count === 3){
        setIncorrect3_3(e.target.value)
      }
    }
  }

  const handleSetModalPage=()=>{
    if(modalPage ===1 ){
      if(URL && difficulty && pointValue){
        setModalPage(2)
      }
    }
    if(modalPage ===2 ){
      if(question1 && answer1 && incorrect1_1 && incorrect1_2 && incorrect1_3){
        setModalPage(3)
      }
    }
    if(modalPage ===3 ){
      if(question2 && answer2 && incorrect2_1 && incorrect2_2 && incorrect2_3){
        setModalPage(4)
      }
    }
    else{
      handleAddOpen()
    }
  }

  const handleSetURL =(e)=>{
    setURL(e.target.value)
  }

  const handleSetPointValue =(e)=>{
    setPointValue(e.target.value)
  }

  const handleSetDifficulty =(e)=>{
    setDifficulty(e.target.value)
  }



  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleRequestOpen = () => {
    toggleRequestOpen(!requestOpen);
  };

  const handleAddOpen = () => {
      toggleAddOpen();
  };


  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };




  return (
    <>
      <AddTrainingModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        URL={URL}
        handleSetURL={handleSetURL}
        pointValue={pointValue}
        handleSetPointValue={handleSetPointValue}
        difficulty={difficulty}
        handleSetDifficulty={handleSetDifficulty}
        modalPage={modalPage}
        handleSetModalPage={handleSetModalPage}
        question1 = {question1}
        answer1 = {answer1}
        incorrect1_1 = {incorrect1_1}
        incorrect1_2 = {incorrect1_2}
        incorrect1_3 = {incorrect1_3}
        question2 = {question2}
        answer2 = {answer2}
        incorrect2_1 = {incorrect2_1}
        incorrect2_2 = {incorrect2_2}
        incorrect2_3 = {incorrect2_3}
        question3 = {question3}
        answer3 = {answer3}
        incorrect3_1 = {incorrect3_1}
        incorrect3_2 = {incorrect3_2}
        incorrect3_3 = {incorrect3_3}
        handleSetQuestion={handleSetQuestion}
        handleSetAnswer={handleSetAnswer}
        handleSetIncorrect={handleSetIncorrect}
      />

      <div style={{ width: "100%", float: "left" }}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
        <div
          style={{
            display: "flex",
            position: "relative",
            left: "15vw",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <div
            style={{ display: "flex", marginLeft: "6vh", flexDirection: "row" }}
          >
            <h1 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
              Training:
            </h1>
            <div style={{marginLeft:'40vw',marginTop:'1vh'}}>
              <ButtonDivComponent

                button1={true}
                button1_text={"Add"}
                button1_action={handleAddOpen}
                button2={true}
                button2_text={"Edit"}

                button3={true}
                button3_text={"Delete"}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
              <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                Mapping
              </Tab>
              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Validation
              </Tab>
              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Project Specific
              </Tab>
            </TabList>
            <TabPanel>
              <AdminTrainingTable
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}

              />
            </TabPanel>
            <TabPanel>
              <AdminTrainingTable
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                // orgPayments={orgPayments}

              />
            </TabPanel>
            <TabPanel>
              <AdminTrainingTable
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}

              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
      {!redirect ? <></> : <Redirect push to="/login" />}
    </>
  );
};
