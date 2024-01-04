import { CSVLink } from "react-csv";
import React from "react";
import { Modal } from "@mui/material";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
  ModalHeader,
  InputWithLabel,
  ModalButtons,
} from "../commonComponents/commonComponents";

export const AddTransactionModal = (props) => {
  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleAddOpen}
          title={"Add New Pay Request"}
        />
        <SectionSubtitle
          subtitle_text={
            "Enter the Username, payment email request amount and task IDs for this request."
          }
        />
        <InputWithLabel
          label="User ID:"
          type="text"
          value={props.userID}
          onChange={(e) => props.handleSetUserID(e)}
        />
        <InputWithLabel
          label="Request Amount:"
          type="number"
          min="0.01"
          step="0.01"
          value={props.requestAmount}
          onChange={(e) => props.handleSetRequestAmount(e)}
        />
        <InputWithLabel
          label="Task IDs:"
          type="text"
          value={props.taskIDs}
          onChange={(e) => props.handleSetTaskIds(e)}
          placeholder="Task IDS separated by commas"
        />

        <ModalButtons
          confirm_text={"Add"}
          confirm_action={props.handleCreateTransactions}
          cancel_text="Cancel"
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
        <ModalHeader
          close_action={props.handleDeleteOpen}
          title={props.title_text}
        />
        <ModalButtons
          confirm_text={"Delete"}
          cancel_action={props.handleDeleteOpen}
          confirm_action={props.handleDeleteRequest}
          cancel_text="Cancel"
        />
      </ModalWrapper>
    </Modal>
  );
};

export const DetailsModal = (props) => {
  return (
    <Modal open={props.detailsOpen} key="delete">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleDetailsOpen}
          title={props.title_text}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 3fr",
            columnGap: "1vw",
          }}
        >
          <InputWithLabel label="User:" type="text" value={props.user_name} />
          <InputWithLabel
            label="OSM Username:"
            type="text"
            value={props.osm_username}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            columnGap: "1vw",
          }}
        >
          <InputWithLabel
            label="Mapping Amount:"
            type="text"
            value={`$${props.amount_paid}`}
          />
          <InputWithLabel
            label="Validation Amount:"
            type="text"
            value={`$${props.amount_paid}`}
          />
          <InputWithLabel
            label="Total Payment:"
            type="text"
            value={`$${props.amount_paid}`}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "1vw",
          }}
        >
          <InputWithLabel
            label="Date Paid:"
            type="text"
            value={props.date_paid}
          />
          <InputWithLabel
            label="Payoneer ID:"
            type="text"
            value={props.payoneer_id}
          />
        </div>
        <InputWithLabel
          label="Payment Email:"
          type="text"
          value={props.payment_email}
        />
        <InputWithLabel label="Task IDs:" type="text" value={props.task_ids} />
        <InputWithLabel label="Notes:" type="text" value={props.notes} />
      </ModalWrapper>
    </Modal>
  );
};

export const ProcessRequestModal = (props) => {
  return (
    <Modal open={props.processOpen} key="process">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleProcessOpen}
          title={props.title_text}
        />
        <InputWithLabel
          label="User Requesting Payment:"
          type="text"
          value={props.userName}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "1vw",
          }}
        >
          <InputWithLabel
            label="Amount Requested:"
            type="text"
            value={`$${props.requestAmount}`}
          />
          <InputWithLabel
            label="Date Requested:"
            type="text"
            value={props.requestDate}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "1vw",
          }}
        >
          <InputWithLabel
            label="Payment Email:"
            type="text"
            value={props.payEmail}
          />
          <InputWithLabel
            label="Task IDs:"
            type="text"
            value={props.taskIDs}
            onChange={(e) => props.handleSetTaskIds(e)}
          />
        </div>
        <InputWithLabel
          label="Payoneer transaction ID:"
          type="text"
          value={props.payoneerID}
          onChange={(e) => props.handleSetPayoneerID(e)}
        />
        <InputWithLabel
          label="Transaction Notes:"
          type="text"
          value={props.notes}
          onChange={(e) => props.handleSetNotes(e)}
        />
        <ModalButtons
          confirm_text={"Process"}
          cancel_action={props.handleProcessOpen}
          confirm_action={props.handleProcessPayRequest}
          cancel_text="Cancel"
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
