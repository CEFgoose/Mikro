import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import useToggle from "../../hooks/useToggle.js";
import Sidebar from "../sidebar/sidebar";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { ProjectCardGrid } from "components/commonComponents/commonComponents";
import {
  AddChecklistModal,
  DeleteProjectModal,
  ModifyChecklistModal,
  ChecklistCardGrid,
} from "../AdminChecklistsPage/checklistComponents";

import { ButtonDivComponent } from "components/commonComponents/commonComponents";

export const UserChecklistsPage = () => {
  const { refresh, user } = useContext(AuthContext);

  const {
    createChecklist,
    sidebarOpen,
    handleSetSidebarState,
    outputRate,
    fetchAdminChecklists,
    orgActiveChecklists,
    orgInActiveChecklists,
    userAvailableChecklists,
    setUserAvailableChecklists,
   userCompletedChecklists,
    setUserCompletedChecklists,
   userConfirmedChecklists,
    setUserConfirmedChecklists,
    userStartedChecklists,
    setUserStartedChecklists,
    fetchUserChecklists,
    startChecklist,
    deleteProject,
    findObjectById,
    checklistSelectedDetails,
    setProjectSelectedDetails,
    setChecklistSelectedDetails,
    handleOutputRate,
    updateChecklist,
    userSelected,
    setUserSelected,
    generateRandomKey,
    goToSource,
    assignUserProject,
    unassignUserProject,
    completeListItem,
    history,
  } = useContext(DataContext);
  const [page, setPage] = useState(1);
  const [checklistName, setChecklistName] = useState(null);
  const [checklistDescription, setChecklistDescription] = useState(null);
  const [visibility, toggleVisibility] = useToggle(true);
  const [checklistDifficulty, setChecklistDifficulty] = useState("Easy");
  const [checklistStatus, toggleChecklistStatus] = useToggle(null);
  const [completionRate, setCompletionRate] = useState(0.0);
  const [validationRate, setValidationRate] = useState(0.0);
  const [listItems, setListItems] = useState([]);
  const [tempListItem, setTempListItem] = useState({});

  const [tempAction, setTempAction] = useState(null);
  const [tempLink, setTempLink] = useState(null);
  const [dueDate,setDueDate]=useState(null);

  const [checklistSelected, setChecklistSelected] = useState(null);
  const [checklistSelectedName, setChecklistSelectedName] = useState(null);

  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [rateMethod, toggleRateMethod] = useToggle(true);




  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [projectStatus, toggleProjectStatus] = useToggle(false);
  const [activeTab, setActiveTab] = useState(1);
  const [assignmentButtonText, setAssignmentButtonText] = useState("Assign");

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
    }
    if (user !== null && user.role !== "user") {
      history("/login");
    }
    fetchUserChecklists();

    // eslint-disable-next-line
  }, []);

  useEffect(() => {

    console.log(userStartedChecklists)
    // eslint-disable-next-line
  }, [userStartedChecklists]);


  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };

  const handleAddOpen = () => {
    setPage(1);
    setChecklistName("");
    setChecklistDescription("");
    setCompletionRate(0.0);
    setValidationRate(0.0);
    setChecklistDifficulty("Easy");
    setTempListItem({});
    setTempAction("");
    setTempLink("");
    setListItems([])
    toggleAddOpen(!addOpen);
  };

  const handleDeleteOpen = () => {
    if (checklistSelected !== null) {
      toggleDeleteOpen();
    }
  };

  const handleModifyOpen = () => {
    let selectedChecklist;
    if (checklistSelected !== null) {

      if (activeTab === 1) {
        selectedChecklist = findObjectById(orgActiveChecklists, checklistSelected);
      } else {
        selectedChecklist = findObjectById(orgInActiveChecklists, checklistSelected);
      }
      handleSetChecklistStatus(selectedChecklist.active_status);
      setCompletionRate(selectedChecklist.completion_rate);
      setValidationRate(selectedChecklist.validation_rate);

      setChecklistDifficulty(selectedChecklist.difficulty);

      setChecklistSelectedDetails(selectedChecklist);




      toggleModifyOpen();
    }
  };

  const handleSetUserSelected = (user_id, assignment_status) => {
    setUserSelected(user_id);
    setAssignmentStatus(assignment_status);
    if (assignment_status === "Yes") {
      setAssignmentButtonText("Unassign");
    } else {
      setAssignmentButtonText("Assign");
    }
  };

  const handleSetChecklistStatus = (e) => {
    if (e !== null) {
      toggleChecklistStatus(e);
    } else {
      toggleChecklistStatus();
    }
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleSetChecklistName = (e) => {
    setChecklistName(e.target.value);
  };

  const handleSetChecklistDescription = (e) => {
    setChecklistDescription(e.target.value);
  };

  const handleSetCompletionRate = (e) => {
    setCompletionRate(e.target.value);
  };

  const handleSetDueDate=(e)=>{
    setDueDate(e.target.value)
  }

  const handleSetValidationRate = (e) => {
    setValidationRate(e.target.value);
  };

  const handleSetChecklistDifficulty = (e) => {
    setChecklistDifficulty(e.target.value);
  };

  const handleToggleVisibility = (e) => {
    toggleVisibility();
  };

  const handleSetListItems = (e) => {
    setListItems(e);
  };

  const handleSetTempListItem = () => {
    setTempListItem({
      number: listItems.length + 1,
      action: tempAction,
      link: tempLink,
    });
    let item = {
      number: listItems.length + 1,
      action: tempAction,
      link: tempLink,
    };
    let list = listItems;
    list.push(item);
    handleSetListItems(list);
    setTempAction("");
    setTempLink("");
  };

  const handleSetTempAction = (e) => {
    setTempAction(e.target.value);
  };

  const handleSetTempLink = (e) => {
    setTempLink(e.target.value);
  };

  const handleStartChecklist = () => {
    startChecklist(checklistSelected)
  };

  const handleSetChecklistSelected = (id, name) => {
    console.log(id, name)
    setChecklistSelected(parseInt(id));
    setChecklistSelectedName(name);
  };

  const handleDeleteProject = () => {
    deleteProject(checklistSelected);
    handleDeleteOpen();
  };

  const handleModifyChecklist = () => {
    updateChecklist(
      checklistSelected,
      checklistName,
      checklistDescription,
      checklistDifficulty,
      visibility,
      completionRate,
      validationRate,
      listItems,
      dueDate,
      checklistStatus
    );
    handleModifyOpen();
  };

  // const handleAssignUser = () => {
  //   if (assignmentStatus === "No") {
  //     assignUserProject(checklistSelected, userSelected);
  //   } else {
  //     unassignUserProject(checklistSelected, userSelected);
  //   }
  // };
  ///////////////
  const handleSetPage = (e) => {
    if (e === "next") {
      setPage(page + 1);
    } else if (e === "back") {
      setPage(page - 1);
    } else {
      setPage(e);
    }
  };

  const handleCreateChecklist = () => {
    createChecklist(
      checklistName,
      checklistDescription,
      checklistDifficulty,
      visibility,
      completionRate,
      validationRate,
      listItems,
      dueDate
    );
    handleAddOpen();
  };

  const handleCompleteListItem=(e,itemNumber,id)=>{
      if(e.target.checked){
        completeListItem(id,itemNumber)
      }

  }


  return (
    <>
      <AddChecklistModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        page={page}
        handleSetPage={handleSetPage}
        checklistName={checklistName}

        checklistSelected={checklistSelected}
        handleSetChecklistSelected={handleSetChecklistSelected}

        handleSetChecklistName={handleSetChecklistName}
        checklistDescription={checklistDescription}
        handleSetChecklistDescription={handleSetChecklistDescription}
        completion_rate={completionRate}
        handleSetCompletionRate={handleSetCompletionRate}
        validation_rate={validationRate}
        handleSetValidationRate={handleSetValidationRate}
        visibility={visibility}
        handleToggleVisibility={handleToggleVisibility}
        checklistDifficulty={checklistDifficulty}
        handleSetChecklistDifficulty={handleSetChecklistDifficulty}
        listItems={listItems}
        handleSetListItems={handleSetListItems}
        handleSetTempListItem={handleSetTempListItem}
        tempAction={tempAction}
        handleSetTempAction={handleSetTempAction}
        tempLink={tempLink}
        handleSetTempLink={handleSetTempLink}
        handleCreateChecklist={handleCreateChecklist}
        dueDate={dueDate}
        handleSetDueDate={handleSetDueDate}
      />



      {/* <DeleteProjectModal
        deleteOpen={deleteOpen}
        handleDeleteOpen={handleDeleteOpen}
        // projectSelected={projectSelected}
        handleDeleteProject={handleDeleteProject}
      /> */}

      <ModifyChecklistModal
        modifyOpen={modifyOpen}
        handleModifyOpen={handleModifyOpen}
        checklistSelected={checklistSelected}
        handleSetChecklistSelected={handleSetChecklistSelected}
        checklistSelectedDetails={checklistSelectedDetails}
        checklistDifficulty={checklistDifficulty}
        handleSetChecklistDifficulty={handleSetChecklistDifficulty}
        checklistStatus={checklistStatus}
        handleSetChecklistStatus ={handleSetChecklistStatus}
        dueDate={dueDate}
        handleSetDueDate={handleSetDueDate}
        checklistName={checklistName}
        handleSetChecklistName={handleSetChecklistName}
        handleSetChecklistDescription={handleSetChecklistDescription}

        visibility={visibility}


        completion_rate={completionRate}
        handleSetCompletionRate={handleSetCompletionRate}

        validation_rate={validationRate}
        handleSetValidationRate={handleSetValidationRate}

        handleToggleVisibility={handleToggleVisibility}
        handleModifyChecklist ={handleModifyChecklist}


        // handleSetUserSelected={handleSetUserSelected}
        // generateRandomKey={generateRandomKey}
        // assignmentButtonText={assignmentButtonText}
        // assignmentStatus={assignmentStatus}
        // handleAssignUser={handleAssignUser}

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
              <strong>Checklists:</strong>
            </h1>
            <div
              style={{ marginTop: "1vw", position: "relative", left: activeTab!==4?"40.5vw":"60.5vw" }}
            >
              <ButtonDivComponent
                role={"admin"}
                button1={activeTab!==4? false:false}
                button2={activeTab!==4? false:false}
                button3={activeTab!==4? false:true}
                button1_text={"Add"}
                button2_text={"Edit"}
                button3_text={"Start"}
                button1_action={handleAddOpen}
                button2_action={handleModifyOpen}
                button3_action={activeTab!==4? handleDeleteOpen:handleStartChecklist}
                handleStartChecklist
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
              <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                In Progress
              </Tab>

              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Completed
              </Tab>


              <Tab value={3} onClick={(e) => handleSetActiveTab(e)}>
                Confirmed
              </Tab>

              <Tab value={4} onClick={(e) => handleSetActiveTab(e)}>
                New
              </Tab>


            </TabList>

            <TabPanel>
              <ChecklistCardGrid
                handleCompleteListItem={handleCompleteListItem}
                key={1}
                type="User"
                role={user.role}
                goToSource={goToSource}
                checklists={userStartedChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                checklistSelected={checklistSelected}
              />
            </TabPanel>

            <TabPanel>
              <ChecklistCardGrid
                role={user.role}
                key={1}
                type="User"
                completed={true}
                goToSource={goToSource}
                checklists={userCompletedChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                checklistSelected={checklistSelected}
              />
            </TabPanel>

            <TabPanel>
              <ChecklistCardGrid
                role={user.role}
                key={1}
                // goToSource={goToSource}
                // checklists={orgInActiveChecklists}
                // handleSetProjectSelected={handleSetProjectSelected}
                // projectSelected={projectSelected}
              />
            </TabPanel>

            <TabPanel>
              <ChecklistCardGrid
                type='New'
                role={user.role}
                key={1}
                // goToSource={goToSource}
                
                checklists={userAvailableChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                checklistSelected={checklistSelected}
              />
            </TabPanel>

          </Tabs>
        </div>
      </div>
    </>
  );
};
