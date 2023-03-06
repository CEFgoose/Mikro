import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { Grid } from "@mui/material";
import useToggle from "../../hooks/useToggle.js";
import Sidebar from "../sidebar/sidebar";
import {ButtonDivComponent} from "components/commonComponents/commonComponents";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  ProjectCardGrid,
  UserProjectModal
} from "./projectComponents";


export const UserProjectsPage = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,
    fetchUserProjects,
    activeProjects,
    inactiveProjects,
    userJoinProject,
    userLeaveProject,
  } = useContext(DataContext);

  const [modalOpen,toggleModalOpen] = useToggle(false)
  const [projectSelected, setProjectSelected] = useState(null);
  const [projectName,setProjectName]=useState(null)

  const [activeTab,setActiveTab] = useState(1)

  useEffect(() => {
    fetchUserProjects();
    // eslint-disable-next-line
  }, []);

  const handleSetActiveTab=(e)=>{
    setActiveTab(e.target.value)
  }

  const handleSetModalOpen=()=>{
    if (projectSelected !== null){
        toggleModalOpen()
    }
  }



  const handleViewSidebar = () => {
    handleSetSidebarState();
  };


  const handleSetProjectSelected = (projectID,projectName) => {
    setProjectSelected(parseInt(projectID));
    setProjectName(projectName)

  };

  const handleUserLeaveProject =()=>{
    userLeaveProject(projectSelected)
    toggleModalOpen()
  }


  const handleUserJoinProject =()=>{
    userJoinProject(projectSelected)
    toggleModalOpen()
  }


  return (
    <>
    <UserProjectModal
      modalOpen={modalOpen}
      handleSetModalOpen={handleSetModalOpen}
      projectSelected={projectSelected}
      projectName={projectName}
      confirm_text={activeTab===1?'Leave':'Join'}
      cancel_action={handleSetModalOpen}
      confirm_action={activeTab===1? handleUserLeaveProject:handleUserJoinProject}

    />
      <div style={{ width: "100%", float: "left", backgroundColor: "Beige" }}>
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
              Projects:
            </h1>

            <div
              style={{ marginTop: "1vw", position: "relative", left: "60vw" }}
            >
              <ButtonDivComponent
                button1={true}
                button2={false}
                button3={false}
                button1_text={activeTab===1?'Leave':'Join'}
                button2_text={"Edit"}
                button3_text={"Delete"}
                button1_action={handleSetModalOpen}
                // button2_action={handleModifyOpen}
                // button3_action={handleDeleteOpen}
              />
            </div>
          </div>

          <Tabs>

          <TabList style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}>
            <Tab value={1} onClick={(e)=>handleSetActiveTab(e)} >Joined</Tab>
            <Tab value={2} onClick={(e)=>handleSetActiveTab(e)}>Available</Tab>
          </TabList>

          <TabPanel  >
            <ProjectCardGrid
              key={1}
              projects={activeProjects}
              handleSetProjectSelected={handleSetProjectSelected}
              projectSelected={projectSelected}
            />
          </TabPanel>


          <TabPanel  >
            <ProjectCardGrid
              key={1}
              projects={inactiveProjects}
              handleSetProjectSelected={handleSetProjectSelected}
              projectSelected={projectSelected}
            />
          </TabPanel>


          </Tabs>



        </div>

      </div>
    </>
  );
};




