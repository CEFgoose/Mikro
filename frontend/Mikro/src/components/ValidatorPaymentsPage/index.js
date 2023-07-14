import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import useToggle from "../../hooks/useToggle.js";
import { RequestModal, DetailsModal } from "./paymentComponents";
import {
  ButtonDivComponent,
  AdminPayRequestsTable,
  AdminPaymentsTable,
} from "components/commonComponents/commonComponents";
import "./styles.css";

export const ValidatorPaymentsPage = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,
    orgPayments,
    setOrgPayments,
    orgRequests,
    setOrgRequests,
    CSVdata,
    submitPayRequest,
    fetchUserPayable,
    fetchUserTransactions,
    history,
    mappingEarnings,
    validationEarnings,
    checklistsEarnings,
    totalEarnings,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [requestOpen, toggleRequestOpen] = useToggle(false);
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
      history("/login");
    }
    if (user !== null) {
      if (user.role !== "user" && user.role !== "validator") {
        history("/login");
      }
    }
    fetchUserPayable(handleSetRequestAmount);
    fetchUserTransactions();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setPayEmail(null);
    setRequestAmount(null);
    setUserName(null);
    setTaskIDs(null);
    // eslint-disable-next-line
  }, [activeTab]);

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleRequestOpen = () => {
    toggleRequestOpen(!requestOpen);
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

  const handleSetRequestAmount = (e) => {
    setRequestAmount(e);
  };

  const handleSubmitPayRequest = () => {
    submitPayRequest(notes);
    handleRequestOpen();
  };

  return (
    <>
      <RequestModal
        requestOpen={requestOpen}
        handleRequestOpen={handleRequestOpen}
        title_text={"Payment Request"}
        notes={notes}
        handleSetNotes={handleSetNotes}
        requestAmount={requestAmount}
        confirm_action={handleSubmitPayRequest}
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          float: "left",
        }}
      >
        <Sidebar isOpen={sidebarOpen} />
        <div style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              marginLeft: ".5vw",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            <div
              style={{
                display: "flex",
                marginLeft: "6vh",
                flexDirection: "row",
                height: "7vh",
              }}
            >
              <h1
                style={{
                  marginTop: "1vw",
                  paddingBottom: "0vh",
                  marginBottom: "0vh",
                }}
              >
                <strong>Payments:</strong>
              </h1>

              <div
                style={
                  activeTab === 1
                    ? { marginTop: "2vw", position: "relative", left: "58vw" }
                    : { marginTop: "2vw", position: "relative", left: "48vw" }
                }
              >
                <ButtonDivComponent
                  data={CSVdata}
                  csv={activeTab === 1 ? false : true}
                  button2={true}
                  button1_text={"CSV Report"}
                  button2_text={
                    activeTab === 1 ? "Request Pay" : "View Details"
                  }
                  button_2_width={"25%"}
                  button2_action={
                    activeTab === 1 ? handleRequestOpen : handleDetailsOpen
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: "7vh",
                marginTop: "0vh",
                marginBottom: "0vh",
                marginLeft: "3.5vw",
                marginTop: "2vh",
              }}
            >
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                <strong>Your Earnings-</strong>
              </h2>
              <span style={{ width: "3vw" }} />
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                <strong>Mapping:</strong>
              </h2>
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                {`$${mappingEarnings && mappingEarnings.toFixed(2)}`}
              </h2>
              <span style={{ width: "3vw" }} />
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                <strong>Validation:</strong>
              </h2>
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                {`$${validationEarnings && validationEarnings.toFixed(2)}`}
              </h2>
              <span style={{ width: "3vw" }} />
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                <strong>Checklists:</strong>
              </h2>
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                {`$${checklistsEarnings && checklistsEarnings.toFixed(2)}`}
              </h2>
              <span style={{ width: "3vw" }} />
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                <strong>Total:</strong>
              </h2>
              <h2 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                {`$${totalEarnings && totalEarnings.toFixed(2)}`}
              </h2>
            </div>

            <Tabs>
              <TabList
                style={{
                  marginLeft: "3vw",
                  marginTop: "0vh",
                  paddingTop: "0vh",
                }}
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
                  setOrgRequests={setOrgRequests}
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
                  setOrgPayments={setOrgPayments}
                  paymentSelected={paymentSelected}
                  handleSetPaymentSelected={handleSetPaymentSelected}
                />
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};
