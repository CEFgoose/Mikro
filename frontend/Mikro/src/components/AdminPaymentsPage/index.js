import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Redirect } from "react-router-dom";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import useToggle from "../../hooks/useToggle.js";
import {
  ButtonDivComponent,
  AdminPayRequestsTable,
  AdminPaymentsTable,
} from "components/commonComponents/commonComponents";
import {
  AddTransactionModal,
  DeleteModal,
  ProcessRequestModal,
  DetailsModal,
} from "./paymentComponents";

export const AdminPaymentsPage = () => {
  // DATA CONTEXT STATES AND FUNCTIONS //

  const {
    sidebarOpen,
    handleSetSidebarState,
    orgPayments,
    orgRequests,
    fetchOrgTransactions,
    createTransaction,
    deleteTransaction,
    processPayRequest,
    CSVdata,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [redirect, setRedirect] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [processOpen, toggleProcessOpen] = useToggle(false);
  const [detailsOpen, toggleDetailsOpen] = useToggle(false);
  const [userName, setUserName] = useState(null);
  const [userID, setUserID] = useState(null);
  const [payEmail, setPayEmail] = useState(null);
  const [payoneerID, setPayoneerID] = useState(null);
  const [taskIDs, setTaskIDs] = useState([]);
  const [notes, setNotes] = useState(null);
  const [requestAmount, setRequestAmount] = useState(null);
  const [requestSelected, setRequestSelected] = useState(null);
  const [paymentSelected, setPaymentSelected] = useState(null);
  const [requestDate, setRequestDate] = useState(null);
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
    fetchOrgTransactions();
    // eslint-disable-next-line
  }, []);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleAddOpen = () => {
    toggleAddOpen(!addOpen);
    setPayEmail(null);
    setRequestAmount(null);
    setUserName(null);
    setTaskIDs(null);
  };

  const handleDeleteOpen = () => {
    if (requestSelected !== null) {
      toggleDeleteOpen();
    }
  };

  const handleProcessOpen = () => {
    if (requestSelected !== null) {
      toggleProcessOpen();
    }
  };

  const handleDetailsOpen = () => {
    if (paymentSelected !== null) {
      toggleDetailsOpen();
    }
  };

  const handleSetPaymentSelected = (
    id,
    user,
    user_id,
    amount_paid,
    date_paid,
    payment_email,
    task_ids,
    payoneer_id
  ) => {
    setPaymentSelected(id);
    setUserID(user_id);
    setRequestSelected(id);
    setUserName(user);
    setRequestAmount(amount_paid);
    setRequestDate(date_paid);
    setPayEmail(payment_email);
    setTaskIDs(task_ids);
    setPayoneerID(payoneer_id);
  };

  const handleSetRequestSelected = (
    id,
    name,
    user_id,
    amount,
    date,
    pay_email,
    task_ids
  ) => {
    setUserID(user_id);
    setRequestSelected(id);
    setUserName(name);
    setRequestAmount(amount);
    setRequestDate(date);
    setPayEmail(pay_email);
    setTaskIDs(task_ids);
  };

  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };

  const handleSetNotes = (e) => {
    setNotes(e.target.value);
  };

  const handleSetUserID = (e) => {
    setUserID(e.target.value);
  };

  const handleSetPayoneerID = (e) => {
    setPayoneerID(e.target.value);
  };

  const handleSetTaskIds = (e) => {
    setTaskIDs(e.target.value);
  };

  const handleSetRequestAmount = (e) => {
    setRequestAmount(e.target.value);
  };

  const handleCreateTransactions = () => {
    createTransaction(userID, requestAmount, payEmail, taskIDs);
    handleAddOpen();
  };

  const handleDeleteRequest = () => {
    let type = "payment";
    if (activeTab === 1) {
      type = "request";
    }
    deleteTransaction(requestSelected, type);
    handleDeleteOpen();
  };

  const handleProcessPayRequest = () => {
    processPayRequest(
      requestSelected,
      userID,
      requestAmount,
      taskIDs,
      payoneerID,
      notes
    );
    handleProcessOpen();
  };

  return (
    <>
      <AddTransactionModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        requestAmount={requestAmount}
        handleSetRequestAmount={handleSetRequestAmount}
        taskIDs={taskIDs}
        handleSetTaskIds={handleSetTaskIds}
        handleCreateTransactions={handleCreateTransactions}
        userID={userID}
        handleSetUserID={handleSetUserID}
      />
      <DeleteModal
        deleteOpen={deleteOpen}
        handleDeleteOpen={handleDeleteOpen}
        title_text={
          activeTab === 1
            ? `Are you sure you want to delete Pay Request ${requestSelected}?`
            : `Are you sure you want to delete Payment ${requestSelected}?`
        }
        handleDeleteRequest={handleDeleteRequest}
      />
      <ProcessRequestModal
        processOpen={processOpen}
        handleProcessOpen={handleProcessOpen}
        title_text={`Process Pay Request ${requestSelected}`}
        userName={userName}
        requestAmount={requestAmount}
        requestDate={requestDate}
        payEmail={payEmail}
        taskIDs={taskIDs}
        handleSetTaskIds={handleSetTaskIds}
        handleProcessPayRequest={handleProcessPayRequest}
        payoneerID={payoneerID}
        handleSetPayoneerID={handleSetPayoneerID}
        notes={notes}
        handleSetNotes={handleSetNotes}
      />
      <DetailsModal
        detailsOpen={detailsOpen}
        handleDetailsOpen={handleDetailsOpen}
        title_text={`Details for Payment ${payoneerID}`}
        payoneer_id={payoneerID}
        user_name={userName}
        date_paid={requestDate}
        payment_email={payEmail}
        amount_paid={requestAmount}
        task_ids={taskIDs}
        notes={notes}
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
              Payments:
            </h1>

            <div
              style={{ marginTop: "1vw", position: "relative", left: "38.5vw" }}
            >
              <ButtonDivComponent
                data={CSVdata}
                button1={activeTab === 1 ? true : false}
                csv={activeTab === 1 ? false : true}
                button2={true}
                button3={true}
                button1_text={activeTab === 1 ? "Add" : "CSV Report"}
                button2_text={activeTab === 1 ? "Process" : "View Details"}
                button3_text={"Delete"}
                button1_action={activeTab === 1 ? handleAddOpen : null}
                button2_action={
                  activeTab === 1 ? handleProcessOpen : handleDetailsOpen
                }
                button3_action={handleDeleteOpen}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
              <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                Pay Requests
              </Tab>
              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Completed Payouts
              </Tab>
            </TabList>
            <TabPanel>
              <AdminPayRequestsTable
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                orgRequests={orgRequests}
                requestSelected={requestSelected}
                handleSetRequestSelected={handleSetRequestSelected}
              />
            </TabPanel>
            <TabPanel>
              <AdminPaymentsTable
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                orgPayments={orgPayments}
                paymentSelected={paymentSelected}
                handleSetPaymentSelected={handleSetPaymentSelected}
              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
      {!redirect ? <></> : <Redirect push to="/login" />}
    </>
  );
};
