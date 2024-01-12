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

export const UserPaymentsPage = () => {
  const {
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
        requestAmount={mappingEarnings}
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
          gap: "1vw",
        }}
      >
        <h2>
          <strong>Your Earnings-</strong>
        </h2>

        <h2>
          <strong>Mapping:</strong>
        </h2>
        <h2>{`$${mappingEarnings && mappingEarnings.toFixed(2)}`}</h2>

        <h2>
          <strong>Checklists:</strong>
        </h2>
        <h2>{`$${checklistsEarnings && checklistsEarnings.toFixed(2)}`}</h2>
        <h2>
          <strong>Total:</strong>
        </h2>
        <h2>{`$${mappingEarnings && mappingEarnings.toFixed(2)}`}</h2>
      </div>
      <Tabs>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <TabList>
            <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
              Pay Requests
            </Tab>
            <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
              Completed Payouts
            </Tab>
          </TabList>
          <ButtonDivComponent
            data={CSVdata}
            csv={activeTab === 1 ? false : true}
            button2={true}
            button1_text={"CSV Report"}
            button2_text={activeTab === 1 ? "Request Pay" : "View Details"}
            button_2_width={"25%"}
            button2_action={
              activeTab === 1 ? handleRequestOpen : handleDetailsOpen
            }
          />
        </div>
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
    </>
  );
};
