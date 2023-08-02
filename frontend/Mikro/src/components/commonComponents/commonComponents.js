import { CSVLink } from "react-csv";
import { styled } from "@mui/material/styles";
import React, { useState, useCallback, useContext, useEffect } from "react";
import close_icon from "../../images/close_icon.png";
import { Button, ButtonLabel, Container } from "./styles";
import { DataContext } from "../../common/DataContext";

import {
  Card,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Modal,
  Table,
  TableBody,
  TablePagination,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";

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

export const ProjectRow = styled(TableRow)(() => ({
  width: "77.75vw",
  marginLeft: "2vw",
}));

export const AdminCardMediaStyle = styled("div")(({ theme }) => ({
  display: "flex",
  position: "relative",
  backgroundColor: "#f4753c",
  paddingTop: "1vh",
  "&:before": {
    top: 0,
    width: "100%",
    height: "100%",
    position: "absolute",
    WebkitBackdropFilter: "blur(3px)", // Fix on Mobile
    fontWeight: "400",
  },
}));

//TABLE HEADERS

export const ADMIN_PROJECTS_TABLE_HEADERS = [
  { id: "name", label: "Name", alignLeft: true },
  { id: "mapping_rate_per_task", label: "Mapping Rate", alignLeft: true },
  { id: "validation_rate_per_task", label: "Validation Rate", alignLeft: true },
  { id: "total_tasks", label: "Total Tasks", alignLeft: true },
  // { id: "Difficulty", label: "Project Difficulty", alignLeft: true },
  { id: "max_payment", label: "Total Budget", alignLeft: true },
  { id: "payment_due", label: "Current Payout", alignLeft: true },
  {
    id: "total_validated" / "total_mapped",
    label: "Validated/ Mapped",
    alignLeft: true,
  },
  { id: "total_invalidated", label: "Invalidated", alignLeft: true },
];

export const USER_PROJECTS_TABLE_HEADERS = [
  { id: "name", label: "Project Name", alignLeft: true },
  { id: "Difficulty", label: "Project Difficulty", alignLeft: true },
  { id: "Mapper Rate", label: "Mapper Rate", alignLeft: true },
  { id: "Tasks", label: "Total Tasks", alignLeft: true },
  { id: "mapped", label: "You Mapped", alignLeft: true },
  { id: "approved", label: "Your Approved", alignLeft: true },
  { id: "unapproved", label: "Your Unapproved", alignLeft: true },
  { id: "Earnings", label: "Your Earnings", alignLeft: true },
];
export const VALIDATOR_PROJECTS_TABLE_HEADERS = [
  { id: "name", label: "Name", alignLeft: true },
  { id: "Mapper Rate", label: "Mapper Rate", alignLeft: true },
  { id: "Validator Rate", label: "Validator Rate", alignLeft: true },
  { id: "Tasks", label: "Total Tasks", alignLeft: true },
  { id: "mapped", label: "You Mapped", alignLeft: true },
  { id: "validated", label: "You Validated", alignLeft: true },
  { id: "invalidated", label: "You Invalidated", alignLeft: true },
  { id: "approved", label: "Your Approved", alignLeft: true },
  { id: "Earnings", label: "Your Earnings", alignLeft: true },
];

export const USERS_TABLE_HEADERS = [
  { id: "name", label: "Username", alignRight: false },
  { id: "role", label: "Role", alignRight: false },
  { id: "assinged_projects", label: "Assinged Projects", alignRight: false },
  { id: "total_tasks_mapped", label: "Tasks Mapped", alignRight: false },
  { id: "total_tasks_validated", label: "Tasks Validated", alignRight: false },
  {
    id: "total_tasks_invalidated",
    label: "Tasks Invalidated",
    alignRight: false,
  },
  { id: "awaiting_payment", label: "Awaiting Payment", alignRight: false },
  { id: "total_payout", label: "Total Payout", alignRight: false },
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
  { id: "user", label: "User", alignRight: false },
  { id: "id", label: "Request ID", alignRight: false },
  { id: "amount_requested", label: "Amount Requested", alignRight: false },
  { id: "date_requested", label: "Date Requested", alignRight: false },
];

export const EXTERNAL_VALIDATIONS_HEADERS = [
  { id: "id", label: "Task ID", alignLeft: true },
  { id: "project_name", label: "Project Name", alignLeft: true },
  { id: "project_id", label: "Project ID", alignLeft: true },
  { id: "mapped_by", label: "Mapped By", alignLeft: true },
  { id: "validated_by", label: "Validated By", alignLeft: true },
  // { id: "Difficulty", label: "Project Difficulty", alignLeft: true },
  // { id: "Budget", label: "Total Budget", alignLeft: true },
  // { id: "Current Payout", label: "Current Payout", alignLeft: true },
  // { id: "Validated/Mapped", label: "Validated/ Mapped", alignLeft: true },
  // { id: "Invalidated", label: "Invalidated", alignLeft: true },
];

// COMPONENTS

export const DashboardCard = (props) => {
  return (
    <>
      <Card
        style={{
          boxShadow: "1px 1px 6px 2px gray",
          position: "relative",
          top: "2vh",
          marginLeft: props.marginLeft,
          marginRight: props.marginRight,
          marginBottom: "1vh",
          width: props.width,
          height: "40vh",
          display: "flex",
          flexDirection: "column",
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
          <SectionTitle title_text={props.title} bold={true} />
        </div>
        <Divider />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginBottom: "2vh",
          }}
        >
          <SectionTitle title_text={props.subtitle_text_1} bold={true} />
          <SectionTitle title_text={props.value_1} />
        </div>
        <Divider />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginBottom: "2vh",
          }}
        >
          <SectionTitle title_text={props.subtitle_text_2} bold={true} />
          <SectionTitle title_text={props.value_2} />
        </div>
        <Divider />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginBottom: "2hv",
          }}
        >
          <SectionTitle title_text={props.subtitle_text_3} bold={true} />
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

//GENERIC CONFIRM & CANCEL BUTTONS - USED ON MOST MIKRO MODALS - CHANGE TEXT AND ACTION PROP FOR EACH BUTTON
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
      align="center"
      style={{
        paddingLeft: "1vw",
        paddingRight: "1vw",
        marginBottom: "1vh",
        marginTop: "1vh",
      }}
      sx={{ mt: 6 }}
    >
      {props.bold && props.bold === true ? (
        <>
          <strong>{props.title_text}</strong>
        </>
      ) : (
        <>{props.title_text}</>
      )}
    </Typography>
  );
};

// GENERAL SECTION SUBTITLE
export const SectionSubtitle = (props) => {
  return (
    <Typography
      align={props.align ? props.align : "center"}
      style={{
        paddingLeft: "1vw",
        paddingRight:
          props.padding_right && props.padding_right
            ? props.padding_right
            : "1vh",
        marginBottom:
          props.margin_bottom && props.margin_bottom
            ? props.margin_bottom
            : "1vh",
        marginTop: "1vh",
      }}
      sx={{ mt: 6 }}
    >
      {props.bold === true ? (
        <strong>{props.subtitle_text}</strong>
      ) : (
        <>{props.subtitle_text}</>
      )}
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
      style={{
        boxShadow: "1px 1px 6px 2px gray",
        textAlign: "center",
        lineHeight: "2.0em",
      }}
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
          button_text={props.button1_text}
        />
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
      {props.button4 ? (
        <StyledButton
          button_action={props.button4_action}
          button_text={props.button4_text}
        />
      ) : (
        <></>
      )}
    </Container>
  );
};

//TABLE HEADER COMPONENT
export const ListHead = ({ headLabel, tableData, updateData }) => {
  const [sort, setSort] = useState({ column: "", order: "asc" });
  const [sortedData, setSortedData] = useState(tableData);
  const [isSorting, setIsSorting] = useState(false);

  // const { updateData } = useContext(DataContext);

  const handleSort = (column) => {
    setSort((prevSort) => {
      let order;
      if (prevSort.column === column) {
        order = prevSort.order === "asc" ? "desc" : "asc";
      } else {
        order = "asc";
      }
      return { column, order };
    });
  };

  useEffect(() => {
    if (isSorting) {
      const sortData = () => {
        if (sort.column === "") {
          setSortedData(tableData);
          return;
        }

        const newData = [...tableData].sort((a, b) => {
          const valueA = a[sort.column];
          const valueB = b[sort.column];

          if (typeof valueA === "number" && typeof valueB === "number") {
            return sort.order === "asc" ? valueA - valueB : valueB - valueA;
          } else {
            const stringA = String(valueA).toUpperCase();
            const stringB = String(valueB).toUpperCase();
            if (stringA < stringB) return sort.order === "asc" ? -1 : 1;
            if (stringA > stringB) return sort.order === "asc" ? 1 : -1;
            return 0;
          }
        });

        setSortedData(newData);
        updateData(newData);
      };

      sortData();
      setIsSorting(false);
    }
  }, [isSorting, sort, tableData, updateData]);

  useEffect(() => {
    setIsSorting(true);
  }, [sort]);

  return (
    <TableHead>
      <TableRow>
        {headLabel.map((headCell) => (
          <TableCell key={headCell.id}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TableSortLabel
                active={sort.column === headCell.id}
                direction={sort.column === headCell.id ? sort.order : "asc"}
                onClick={() => handleSort(headCell.id)}
              >
                {<strong>{headCell.label}</strong>}
              </TableSortLabel>
            </div>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
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
        cancel_text={props.cancel_text}
      />
      <ConfirmButton
        confirm_action={props.confirm_action}
        confirm_text={props.confirm_text}
      />
    </div>
  );
};

export const TutorialDialog = (props) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {props.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {props.content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
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
      </DialogActions>
    </Dialog>
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



export const CompleteQuizModal = (props) => {
  const modal_body = (
    <ModalWrapper>
      <Card>
        <Typography
          variant="h5"
          align="center"
          style={{ marginLeft: "1vw", marginRight: "1vw" }}
        >
          {`Training Quiz ${props.quizStatus}`}
        </Typography>
        <Typography
          variant="h5"
          align="center"
          style={{ marginLeft: "1vw", marginRight: "1vw" }}
        >
          {props.quizStatusText}
        </Typography>
        <Divider style={{ marginTop: "1vh" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop:'1vh'
          }}
        >
          {props.button1===true?
          <>
          <Button
          style={{ marginLeft: "1vw", marginRight: "1vw" ,marginBottom:'1vh'}}
          onClick={() => props.button_1_action()}
          >
            {props.button_1_text}
          </Button>
          </>
          :
          <>
          </>
          }

          {props.button2===true?
          <>
          <Button
          style={{ marginLeft: "1vw", marginRight: "1vw" ,marginBottom:'1vh'}}
          onClick={() => props.button_2_action()}
          >
            {props.button_2_text}
          </Button>
          </>
          :
          <>
          </>
          }
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
  const updateData = (sortedData) => {
    props.setOrgRequests(sortedData);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        marginLeft: "3.5vw",
        height: "76vh",
        width: "77.5vw",
      }}
    >
      <TableCard
        style={{ boxShadow: "1px 1px 6px 2px gray", overflowY: "scroll" }}
      >
        <CardMediaStyle />
        <Table>
          <ListHead
            headLabel={REQUEST_TABLE_HEADERS}
            tableData={props.orgRequests}
            updateData={props.setOrgRequests}
          />
          <TableBody>
            {props.orgRequests &&
              props.orgRequests.slice().map((row) => {
                const {
                  id,
                  payment_email,
                  user,
                  user_id,
                  amount_requested,
                  task_ids,
                  date_requested,
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
                    onClick={() =>
                      props.handleSetRequestSelected(
                        id,
                        user,
                        user_id,
                        amount_requested,
                        date_requested,
                        payment_email,
                        task_ids
                      )
                    }
                    selected={props.requestSelected === id}
                  >
                    <ProjectCell entry={<strong>{user}</strong>} />
                    <ProjectCell entry={id} />
                    <ProjectCell entry={amount_requested} />
                    <ProjectCell entry={date_requested} />
                  </ProjectRow>
                );
              })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
};

export const AdminPaymentsTable = (props) => {
  const updateData = (sortedData) => {
    props.setOrgPayments(sortedData);
  };

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
      <TableCard
        style={{ boxShadow: "1px 1px 6px 2px gray", overflowY: "scroll" }}
      >
        <CardMediaStyle />
        <Table>
          <ListHead
            headLabel={REQUEST_TABLE_HEADERS}
            tableData={props.orgPayments}
            updateData={props.setOrgPayments}
          />
          <TableBody>
            {props.orgPayments &&
              props.orgPayments.slice().map((row) => {
                const {
                  id,
                  payment_email,
                  user,
                  osm_username,
                  user_id,
                  amount_paid,
                  task_ids,
                  date_paid,
                  payoneer_id,
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
                    onClick={() =>
                      props.handleSetPaymentSelected(
                        id,
                        user,
                        osm_username,
                        user_id,
                        amount_paid,
                        date_paid,
                        payment_email,
                        task_ids,
                        payoneer_id
                      )
                    }
                    selected={props.paymentSelected === id}
                  >
                    <ProjectCell entry={<strong>{user}</strong>} />
                    <ProjectCell entry={id} />
                    <ProjectCell entry={`$${amount_paid}`} />
                    <ProjectCell entry={date_paid} />
                  </ProjectRow>
                );
              })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
};

export const Divider = () => {
  return (
    <div
      style={{
        width: "90%",
        backgroundColor: "black",
        height: ".05vh",
        margin: "auto",
        marginTop: ".5vh",
      }}
    />
  );
};

export const ProjectCardGrid = (props) => {
  return (
    <div style={{ overflowY: "scroll", width: "85vw", height: "83vh" }}>
      <Grid
        sx={{
          height: "auto",
          position: "relative",
          top: "3vh",
          left: "3vw",
        }}
        container
        spacing={3}
      >
        {props.projects &&
          props.projects.slice().map((card) => {
            const {
              id,
              name,
              difficulty,
              visibility,
              total_payout,
              mapping_rate_per_task,
              validation_rate_per_task,
              max_editors,
              total_editors,
              total_tasks,
              total_mapped,
              total_validated,
              total_invalidated,
              url,
              source,
              max_payment,
            } = card;
            return (
              <ProjectCard
                id={id}
                name={name}
                url={url}
                role={props.role}
                goToSource={props.goToSource}
                difficulty={difficulty}
                visibility={visibility}
                max_editors={max_editors}
                total_editors={total_editors}
                total_tasks={total_tasks}
                mapping_rate_per_task={mapping_rate_per_task}
                validation_rate_per_task={validation_rate_per_task}
                tasks_mapped={total_mapped}
                tasks_validated={total_validated}
                tasks_invalidated={total_invalidated}
                total_payout={total_payout}
                projectSelected={props.projectSelected}
                source={source}
                max_payment={max_payment}
                handleSetProjectSelected={props.handleSetProjectSelected}
              />
            );
          })}
      </Grid>
    </div>
  );
};

export const ProjectCard = (props) => {
  return (
    <Card
      key={props.id}
      style={{
        boxShadow: "1px 1px 6px 2px gray",
        width: "25vw",
        height: "56vh",
        marginLeft: "2vw",
        marginTop: "2vh",
      }}
      onDoubleClick={() => props.goToSource(props.url)}
    >
      <AdminCardMediaStyle>
        <input
          type={"checkbox"}
          id={props.id}
          value={props.id}
          checked={props.id === props.projectSelected}
          onChange={(e) => {
            if (props.id === props.projectSelected) {
              props.handleSetProjectSelected(null, props.name); //Uncheck the checkbox
            } else {
              props.handleSetProjectSelected(props.id, props.name); //Check the checkbox
            }
          }}
          style={{
            marginLeft: "1vw",
            marginBottom: "1vh",
          }}
        />
      </AdminCardMediaStyle>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          height: "10vh",
        }}
      >
        <SectionTitle title_text={props.name} bold={true} />
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={`Difficulty:`}
            bold={true}
            margin_bottom={"0vh"}
          />
          <SectionSubtitle
            subtitle_text={`${props.difficulty}`}
            margin_bottom={"0vh"}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={`Visibility:`}
            bold={true}
            margin_bottom={"0vh"}
          />
          <SectionSubtitle
            subtitle_text={`${props.visibility === true ? `Public` : `Private`
              }`}
            margin_bottom={"0vh"}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={`Source:`}
            bold={true}
            margin_bottom={"0vh"}
          />
          <SectionSubtitle
            subtitle_text={`${props.source === "tasks" ? `TM4` : `TM3`}`}
            margin_bottom={"0vh"}
          />
        </div>
      </div>

      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Editors:"} bold={true} />
          <SectionSubtitle
            subtitle_text={`${props.total_editors}/${props.max_editors}`}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Validators:"} bold={true} />
          <SectionSubtitle subtitle_text={`${0}/${0}`} />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={"Total Tasks:"}
            margin_bottom={"0vh"}
            bold={true}
          />
          <SectionSubtitle
            subtitle_text={props.total_tasks}
            margin_bottom={"0vh"}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={"Mapping Rate:"}
            margin_bottom={"0vh"}
            bold={true}
          />
          <SectionSubtitle
            subtitle_text={`$${props.mapping_rate_per_task.toFixed(2)}`}
            margin_bottom={"0vh"}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={"Validation Rate:"}
            margin_bottom={"0vh"}
            bold={true}
          />
          <SectionSubtitle
            subtitle_text={`$${props.validation_rate_per_task.toFixed(2)}`}
            margin_bottom={"0vh"}
          />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={"Mapped:"}
            margin_bottom={"0vh"}
            bold={true}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <SectionSubtitle
              margin_bottom={"0vh"}
              subtitle_text={`${props.tasks_mapped}-tasks`}
            />
            <SectionSubtitle
              margin_bottom={"0vh"}
              subtitle_text={`${(
                (100 / props.total_tasks) *
                props.tasks_mapped
              ).toFixed(2)}%`}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={"Validated:"}
            margin_bottom={"0vh"}
            bold={true}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <SectionSubtitle
              margin_bottom={"0vh"}
              subtitle_text={`${props.tasks_validated}-tasks`}
            />
            <SectionSubtitle
              margin_bottom={"0vh"}
              subtitle_text={`${(
                (100 / props.total_tasks) *
                props.tasks_validated
              ).toFixed(2)}%`}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle
            subtitle_text={"Invalidated:"}
            margin_bottom={"0vh"}
            bold={true}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <SectionSubtitle
              margin_bottom={"0vh"}
              subtitle_text={`${props.tasks_invalidated}-tasks`}
            />
            <SectionSubtitle
              margin_bottom={"0vh"}
              subtitle_text={`${(
                (100 / props.total_tasks) *
                props.tasks_invalidated
              ).toFixed(4)} %`}
            />
          </div>
        </div>
      </div>
      <Divider />

      {props.role && props.role === "admin" ? (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <SectionSubtitle
                subtitle_text={"Current Payout:"}
                bold={true}
                margin_bottom={"0vh"}
              />
              <SectionSubtitle
                subtitle_text={`$${props.total_payout && (props.total_payout / 100).toFixed(2)
                  }`}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <SectionSubtitle
                subtitle_text={"Total Budget:"}
                bold={true}
                margin_bottom={"0vh"}
              />
              <SectionSubtitle
                subtitle_text={`$${props.max_payment && props.max_payment.toFixed(2)
                  }`}
              />
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </Card>
  );
};
