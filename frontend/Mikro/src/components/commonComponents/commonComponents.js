import {
  Card,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Modal,
  Divider,
  Table,
  TableBody,
  TablePagination,
} from "@mui/material";
import { CSVLink } from "react-csv"
import { styled } from "@mui/material/styles";
import React from "react";
import close_icon from "../../images/close_icon.png";
import {
  Button,
  ButtonLabel,
  CloseButtonImg,
  Container,
  RegisterButton,
} from "./styles";
import { Input, TextArea } from "./styles";
import { name } from "store/storages/cookieStorage";
// STYLED COMPONENTS

export const TopDiv = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
}));

export const CardMediaStyle = styled("div")(({ theme }) => ({
  display: "flex",
  position: "relative",
  justifyContent: "center",
  paddingTop: "3vh",
  "&:before": {
    top: 0,
    zIndex: 9,
    content: "''",
    width: "100%",
    height: "100%",
    position: "absolute",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)", // Fix on Mobile
    backgroundColor: "#f4753c",
    fontWeight: "400",
  },
}));



export const TableCard = styled(Card)(() => ({
  width: "100%",
  marginLeft: "0vw",
}));

export const MainDiv = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

export const ModalWrapper = styled("div")(() => ({
  position: "fixed",
  top: "50%",
  left: "55%",
  backgroundColor: "white",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  borderRadius: "6px",
  width: "50%",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  transform: "translate(-50%, -50%)",
}));

export const ButtonDiv = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  textAlign: "center",
  justifyContent: "center",
}));

// COMPONENTS

export const DashboardCard = (props) => {
  return (
    <>
      <Card
        style={{
          boxShadow: "1px 1px 6px 2px gray",
          position: "relative",
          top: "2vh",
          marginLeft: "3.5vw",
          marginRight: "5.3vw",
          marginBottom: "1vh",
          width: "20vw",
          height: "40vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "lightgray",
        }}
      >
        <CardMediaStyle />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <SectionTitle title_text={props.title} />
        </div>
        <Divider />
        <div
          style={{ display: "flex", flexDirection: "row", marginBottom: "4vh" }}
        >
          <SectionTitle title_text={props.subtitle_text_1} />
          <SectionTitle title_text={props.value_1} />
        </div>
        <Divider />
        <div
          style={{ display: "flex", flexDirection: "row", marginBottom: "4vh" }}
        >
          <SectionTitle title_text={props.subtitle_text_2} />
          <SectionTitle title_text={props.value_2} />
        </div>
        <Divider />
        <div
          style={{ display: "flex", flexDirection: "row", marginBottom: "1vh" }}
        >
          <SectionTitle title_text={props.subtitle_text_3} />
          <SectionTitle title_text={props.value_3} />
        </div>
        <Divider />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        ></div>
      </Card>
    </>
  );
};

// PROJECT DESCRIPTION CELL//
export const ProjectCell = (props) => {
  return (
    <TableCell align="left" component="th" scope="row">
      <Typography variant="subtitle2" noWrap style={{ textAlign: "center" }}>
        {props.entry}
      </Typography>
    </TableCell>
  );
};

export const ProjectRow = styled(TableRow)(() => ({
  width: "100%",
  marginLeft: "2vw",
}));

export const PROJECTS_TABLE_HEADERS = [
  // { id: "id", label: "Project ID", alignLeft: true },
  { id: "name", label: "Name", alignLeft: true },
  { id: "Rate", label: "Rate", alignLeft: true },
  { id: "Tasks", label: "Tasks", alignLeft: true },
  { id: "Difficulty", label: "Difficulty", alignLeft: true },
  { id: "Budget", label: "Budget", alignLeft: true },
  { id: "Current Payout", label: "Current Payout", alignLeft: true },
  { id: "Validated/Mapped", label: "Validated/Mapped", alignLeft: true },
  { id: "Invalidated", label: "Invalidated", alignLeft: true },
];

export const USERS_TABLE_HEADERS = [
  { id: "name", label: "Username", alignRight: false },
  { id: "role", label: "Role", alignRight: false },
  { id: "assinged projects", label: "Assinged Projects", alignRight: false },
  { id: "tasks Mapped", label: "Tasks Mapped", alignRight: false },
  { id: "tasks validated", label: "Tasks Validated", alignRight: false },
  { id: "tasks invalidated", label: "Tasks Invalidated", alignRight: false },
  { id: "awaiting payment", label: "Awaiting Payment", alignRight: false },
  { id: "total payout", label: "Total Payout", alignRight: false },
];

export const ASSIGN_USERS_TABLE_HEADERS = [
  { id: "name", label: "Username", alignRight: false },
  { id: "role", label: "Role", alignRight: false },
  { id: "Currently assigned", label: "Currently Assigned", alignRight: false },
  { id: "Total Projects", label: "Total Projects", alignRight: false },
];

export const PAYOUT_TABLE_HEADERS = [
  { id: "name", label: "User", alignRight: false },
  { id: "Payment Email", label: "Role", alignRight: false },
  { id: "Amount Paid", label: "Amount Paid", alignRight: false },
  { id: "Request ID", label: "Request ID", alignRight: false },
  { id: "Date Requested", label: "Date Requested", alignRight: false },
  { id: "Date Paid", label: "Date Paid", alignRight: false },
];


export const REQUEST_TABLE_HEADERS = [
  { id: "name", label: "User", alignRight: false },
  { id: "Request ID", label: "Request ID", alignRight: false },
  { id: "Amount Requested", label: "Amount Requested", alignRight: false },
  { id: "Date Requested", label: "Date Requested", alignRight: false },

];
//GENERIC CONFIRM & CANCEL BUTTONS - USED ON MOST VIEWER MODALS - CHANGE TEXT AND ACTION PROP FOR EACH BUTTON
export const CancelConfirmButtons = (props) => {
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
        cancel_text={props.cancel_text}
        cancel_action={props.cancel_action}
      />
      <ConfirmButton
        confirm_text={props.confirm_text}
        confirm_action={props.confirm_action}
      />
    </div>
  );
};

// GENERAL CANCEL BUTTON //
export const CancelButton = (props) => {
  return (
    <Button
      onClick={props.cancel_action}
      style={{ boxShadow: "1px 1px 6px 2px gray" }}
    >
      {props.cancel_text}
    </Button>
  );
};

// GENERAL CONFIRM BUTTON //
export const ConfirmButton = (props) => {
  return (
    <Button
      onClick={(e) => props.confirm_action(e)}
      style={{ boxShadow: "1px 1px 6px 2px gray" }}
    >
      {props.confirm_text}
    </Button>
  );
};

// GENERAL SECTION TITLE
export const SectionTitle = (props) => {
  return (
    <Typography
      variant="h5"
      align="center"
      style={{
        paddingLeft: "1vw",
        paddingRight: "1vw",
        marginBottom: "1vh",
        marginTop: "2vh",
      }}
      sx={{ mt: 6 }}
    >
      {props.title_text}
    </Typography>
  );
};

// GENERAL SECTION SUBTITLE
export const SectionSubtitle = (props) => {
  return (
    <Typography
      variant="body1"
      align="center"
      style={{
        paddingLeft: "1vw",
        paddingRight: "1vw",
        marginBottom: "1vh",
        marginTop: "1vh",
      }}
      sx={{ mt: 6 }}
    >
      {props.subtitle_text}
    </Typography>
  );
};

// GENERAL CLOSE MODAL BUTTON
export const CloseButton = (props) => {
  return (
    <img
      src={close_icon}
      style={{
        position: "relative",
        left: "95%",
        width: "2%",
      }}
      alt={"close_button"}
      onClick={props.close_action}
    ></img>
  );
};

// TITLE DIV
export const TitleDiv = (props) => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginLeft: "0",
        marginBottom: "0vh",
        marginRight: "0",
      }}
    >
      <h3>{props.text}</h3>
    </div>
  );
};

//GENERAL STYLED BUTTON

export const StyledButton = (props) => {
  return (
    <Button
      onClick={props.button_action}
      style={{ boxShadow: "1px 1px 6px 2px gray" }}
    >
      <ButtonLabel>{props.button_text}</ButtonLabel>
    </Button>
  );
};

//BUTTON DIV COMPONENT
export const ButtonDivComponent = (props) => {
  return (
    <Container>

      {props.csv ? (
          <CSVLink
            data={props.data}
            filename={"payment-report.csv"}
            style={{ textDecoration: "none" }}
          >
     
            <StyledButton 
            button_action={props.button1_action} 
            button_text={props.button1_text}
            />
          </CSVLink>
      ) : (
        <></>
      )}


      {props.button1 ? (
            <StyledButton 
            button_action={props.button1_action} 
            button_text={props.button1_text} />
      ) : (
        <></>
      )}

      {props.button2 ? (
        <StyledButton

          button_action={props.button2_action}
          button_text={props.button2_text}
        />
      ) : (
        <></>
      )}
      {props.button3 ? (
      <StyledButton
        button_action={props.button3_action}
        button_text={props.button3_text}
      />
      ) : (
        <></>
      )}
    </Container>
  );
};

//TABLE HEADER COMPNENT
export const ListHead = (props) => {
  // order,
  //TABLE HEADER COMPONENT RENDER
  return (
    <TableHead>
      <TableRow style={{ margin: "0", textAlign: "center" }}>
        {props.headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            style={{
              width: "10vw",
              textAlign: "center",
              fontSize: props.fontSize,
            }}
          >
            <TableSortLabel
              direction={props.operator === true ? "desc" : "asc"}
              onClick={(e) => props.sortOrgProjects(headCell.label, "asc")}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export const ProjectHead = (props) => {
  //PROJECTS TABLE HEADER COMPONENT RENDER
  //EXCLUDES CHECKBOX CELL
  return (
    <TableHead>
      <TableRow style={{ margin: "0", textAlign: "center" }}>
        {props.headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            style={{
              width: "9vw",
              textAlign: "center",
              fontSize: props.fontSize,
            }}
          >
            <TableSortLabel hideSortIcon direction={"asc"}>
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export const ConfirmModalCommon = (props) => {
  const modal_body = (
    <ModalWrapper>
      <Card>
        <Typography
          variant="h5"
          align="center"
          style={{ marginLeft: "1vw", marginRight: "1vw" }}
        >
          {props.interrogative}
        </Typography>
        <Divider style={{ marginTop: "1vh" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            style={{ marginLeft: "1vw", marginRight: "1vw" }}
            onClick={() => props.button_1_action()}
          >
            {props.button_1_text}
          </Button>
          <Button
            style={{ marginLeft: "1vw", marginRight: "1vw" }}
            onClick={() => props.button_2_action()}
          >
            {props.button_2_text}
          </Button>
        </div>
      </Card>
    </ModalWrapper>
  );
  //COMPONENT RENDER
  return (
    <Modal
      open={props.modal_open}
      onClose={props.handleOpenCloseModal}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      {modal_body}
    </Modal>
  );
};


export const AdminPayRequestsTable = (props) => {
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
      <TableCard style={{ boxShadow: "1px 1px 6px 2px gray" }}>
        <CardMediaStyle />
        <Table>
          <ListHead headLabel={REQUEST_TABLE_HEADERS} />
          <TableBody>
            {props.orgRequests &&
              props.orgRequests
                .slice(
                  props.page * props.rowsPerPage,
                  props.page * props.rowsPerPage + props.rowsPerPage
                )
                .map((row) => {
                  const {
                    id,
                    payment_email,
                    user,
                    user_id,
                    amount_requested,
                    task_ids,
                    date_requested,
                    notes,
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
                      onClick={() => props.handleSetRequestSelected(id,user,user_id,amount_requested,date_requested,payment_email,task_ids)}
                      selected={props.requestSelected === id}
                      // onDoubleClick={() => view_all_project_sequences(value)}
                    >
                      <ProjectCell entry={user} />
                      <ProjectCell entry={id} />
                      <ProjectCell entry={amount_requested} />
                      <ProjectCell entry={date_requested} />
                      {/* <ProjectCell entry={notes} /> */}
                    </ProjectRow>
                  );
                })}
          </TableBody>
        </Table>
        <TablePagination
          style={{ width: 'auto'}}
          rowsPerPageOptions={[5, 10, 15]}
          component="div"
          count={props.pay_requests ? props.pay_requests.length : 5}
          rowsPerPage={props.rowsPerPage}
          page={props.page}
          onPageChange={(e, page) => props.setPage(page)}
          onRowsPerPageChange={(e) => props.handleChangeRowsPerPage(e)}
        />
      </TableCard>

    </div>
  );
};



export const AdminPaymentsTable = (props) => {
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
      <TableCard style={{ boxShadow: "1px 1px 6px 2px gray" }}>
        <CardMediaStyle />
        <Table>
          <ListHead headLabel={REQUEST_TABLE_HEADERS} />
          <TableBody>
            {props.orgPayments &&
              props.orgPayments
                .slice(
                  props.page * props.rowsPerPage,
                  props.page * props.rowsPerPage + props.rowsPerPage
                )
                .map((row) => {
                  const {
                    id,
                    payment_email,
                    user,
                    user_id,
                    amount_paid,
                    task_ids,
                    date_paid,
                    payoneer_id,
                    notes,
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
                      onClick={() => props.handleSetPaymentSelected(id,user,user_id,amount_paid,date_paid,payment_email,task_ids,payoneer_id)}
                      selected={props.paymentSelected === id}
                      // onDoubleClick={() => view_all_project_sequences(value)}
                    >
                      <ProjectCell entry={user} />
                      <ProjectCell entry={id} />
                      <ProjectCell entry={`$${amount_paid}`} />
                      <ProjectCell entry={date_paid} />
                      {/* <ProjectCell entry={notes} /> */}
                    </ProjectRow>
                  );
                })}
          </TableBody>
        </Table>
        <TablePagination
          style={{ width: 'auto'}}
          rowsPerPageOptions={[5, 10, 15]}
          component="div"
          count={props.pay_requests ? props.pay_requests.length : 5}
          rowsPerPage={props.rowsPerPage}
          page={props.page}
          onPageChange={(e, page) => props.setPage(page)}
          onRowsPerPageChange={(e) => props.handleChangeRowsPerPage(e)}
        />
      </TableCard>

    </div>
  );
};