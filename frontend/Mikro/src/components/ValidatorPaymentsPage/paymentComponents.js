import { CSVLink } from "react-csv";
import React from "react";
import { Modal, Divider } from "@mui/material";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
} from "../commonComponents/commonComponents";

export const AddTransactionModal = (props) => {
  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={"Add New Pay Request"} />
        <SectionSubtitle
          subtitle_text={
            "Enter the Username, payment email request amount and task IDs for this request."
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
            <SectionTitle title_text={"User ID:"} />
            <input
              type="text"
              value={props.userID}
              onChange={(e) => props.handleSetUserID(e)}
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
            <SectionTitle title_text={"Request Amount:"} />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={props.requestAmount}
              onChange={(e) => props.handleSetRequestAmount(e)}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Task IDs:"} />
            <input
              type="text"
              value={props.taskIDs}
              onChange={(e) => props.handleSetTaskIds(e)}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
              placeholder="Task IDS separated by commas"
            />
          </div>
        </div>
        <ModalButtons
          confirm_text={"Add"}
          confirm_action={props.handleCreateTransactions}
          cancel_action={props.handleAddOpen}
        />
      </ModalWrapper>
    </Modal>
  );
};

export const DeleteModal = (props) => {
  return (
    <Modal open={props.deleteOpen} key="delete">
      <ModalWrapper>
        <CloseButton close_action={props.handleDeleteOpen} />
        <SectionTitle title_text={props.title_text} />
        <ModalButtons
          confirm_text={"Delete"}
          cancel_action={props.handleDeleteOpen}
          confirm_action={props.handleDeleteRequest}
        />
      </ModalWrapper>
    </Modal>
  );
};

export const DetailsModal = (props) => {
  return (
    <Modal open={props.detailsOpen} key="delete">
      <ModalWrapper>
        <CloseButton close_action={props.handleDetailsOpen} />
        <SectionTitle title_text={props.title_text} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"User:"} />
            <input
              type="text"
              value={props.user_name}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
            <SectionTitle title_text={"Payment Amount:"} />
            <input
              type="text"
              value={`$${props.amount_paid}`}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Date Paid:"} />
            <input
              type="text"
              value={props.date_paid}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
            <SectionTitle title_text={"Payoneer ID:"} />
            <input
              type="text"
              value={props.payoneer_id}
              style={{ height: "5vh", marginRight: "3vw", width: "35%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Payment Email:"} />
            <input
              type="text"
              value={props.payment_email}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Task IDs:"} />
            <input
              type="text"
              value={props.task_ids}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
              marginBottom: "2vh",
            }}
          >
            <SectionTitle title_text={"Notes:"} />
            <input
              type="text"
              value={props.notes}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
        </div>
      </ModalWrapper>
    </Modal>
  );
};

export const ProcessRequestModal = (props) => {
  return (
    <Modal open={props.processOpen} key="process">
      <ModalWrapper>
        <CloseButton close_action={props.handleProcessOpen} />
        <SectionTitle title_text={props.title_text} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"User Requesting Payment:"} />
            <input
              type="text"
              value={props.userName}
              style={{ height: "5vh", marginRight: "3vw", width: "95vw" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Amount Requested:"} />
            <input
              type="text"
              value={`$${props.requestAmount}`}
              style={{ height: "5vh", marginRight: "3vw", width: "15vw" }}
            />
            <SectionTitle title_text={"Date Requested:"} />
            <input
              type="text"
              value={props.requestDate}
              style={{ height: "5vh", marginRight: "3vw", width: "20vw" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Payment Email:"} />
            <input
              type="text"
              value={props.payEmail}
              style={{ height: "5vh", marginRight: "3vw", width: "15vw" }}
            />
            <SectionTitle title_text={"Task IDs:"} />
            <input
              type="text"
              value={props.taskIDs}
              style={{ height: "5vh", marginRight: "3vw", width: "20vw" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Payoneer transaction ID:"} />
            <input
              type="text"
              value={props.payoneerID}
              onChange={(e) => props.handleSetPayoneerID(e)}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Transaction Notes:"} />
            <input
              type="text"
              value={props.notes}
              onChange={(e) => props.handleSetNotes(e)}
              placeholder="Limit 100 Characters"
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
        </div>
        <ModalButtons
          confirm_text={"Process"}
          cancel_action={props.handleProcessOpen}
          confirm_action={props.handleProcessPayRequest}
        />
      </ModalWrapper>
    </Modal>
  );
};

export const CSVExport = (data) => {
  return (
    <>
      <CSVLink
        data={data}
        filename={"payment-report.csv"}
        style={{ textDecoration: "none" }}
      ></CSVLink>
    </>
  );
};

export const RequestModal = (props) => {
  return (
    <Modal open={props.requestOpen} key="request">
      <ModalWrapper>
        <CloseButton close_action={props.handleRequestOpen} />
        <SectionTitle title_text={props.title_text} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Request Amount:"} />
            <input
              type="number"
              value={props.requestAmount && props.requestAmount.toFixed(2)}
              style={{ height: "5vh", marginRight: "0vw", width: "67.5%" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"Notes:"} />
            <input
              type="text"
              value={props.notes}
              onChange={(e) => props.handleSetNotes(e)}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
        </div>
        <ModalButtons
          confirm_text={"Submit"}
          cancel_text={"Cancel"}
          cancel_action={props.handleRequestOpen}
          confirm_action={props.confirm_action}
        />
      </ModalWrapper>
    </Modal>
  );
};

export const ModalButtons = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      <CancelButton
        cancel_action={props.cancel_action}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_action={props.confirm_action}
        confirm_text={props.confirm_text}
      />
    </div>
  );
};
