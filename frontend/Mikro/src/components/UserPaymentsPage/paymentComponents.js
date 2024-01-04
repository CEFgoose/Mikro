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
  ModalButtons,
  InputWithLabel,
} from "../commonComponents/commonComponents";

export const DetailsModal = (props) => {
  return (
    <Modal open={props.detailsOpen} key="delete">
      <ModalWrapper>
        <CloseButton close_action={props.handleDetailsOpen} />
        <SectionTitle title_text={props.title_text} />
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
        <ModalHeader
          close_action={props.handleRequestOpen}
          title={props.title_text}
        />
        <InputWithLabel
          label="Request Amount:"
          type="number"
          value={props.requestAmount}
          disabled={true}
        />
        <InputWithLabel
          label="Notes:"
          type="text"
          value={props.notes}
          onChange={(e) => props.handleSetNotes(e)}
        />
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
