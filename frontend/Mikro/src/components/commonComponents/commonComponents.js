import { CSVLink } from "react-csv";
import { styled } from "@mui/material/styles";
import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  Component,
} from "react";
import close_icon from "../../images/close_icon.png";
import { Button, ButtonLabel, Container } from "./styles";
import Chart from "react-apexcharts";
import { DataContext } from "../../common/DataContext";
import positive_trend_icon from "../../images/Up-trend-icon.png";
import negative_trend_icon from "../../images/Down-Trend-Icon.png";
import { DashCard, ProjectCardContainer } from "./styles.js";

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
  DialogActions,
} from "@mui/material";
import { propTypes } from "react-bootstrap/esm/Image";

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
  boxShadow: "0 0 4px gray",
}));

export const ModalWrapper = styled("div")(() => ({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  top: "50%",
  left: "55%",
  backgroundColor: "white",
  borderRadius: "6px",
  width: "50%",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  transform: "translate(-50%, -50%)",
  padding: "1vw",
}));

export const ButtonDiv = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  textAlign: "center",
  justifyContent: "center",
}));

export const ProjectRow = styled(TableRow)(() => ({}));

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

export const TasksMappedCard = (props) => {
  let updatedLineData = props.lineData;

  // Check if lineData is falsy or has a length less than or equal to 1
  if (!updatedLineData || updatedLineData.length <= 1) {
    // If true, set lineData to an array of zeros
    updatedLineData = [0, 0, 0, 0, 0, 0];
  }
  return (
    <DashCard>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: ".5vh",
          }}
        >
          <SectionTitle title_text={props.title} />
          <h1
            style={{
              alignSelf: "center",
              marginTop: "2vh",
            }}
          >
            {props.tasksMapped}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "2vh",
          }}
        >
          <LineChart lineData={updatedLineData}></LineChart>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          marginLeft: "2vh",
          marginBottom: ".5vh",
          alignItems: "center",
          gap: "1vw",
        }}
      >
        <img
          style={{ height: "2vw", width: "2vw" }}
          src={props.change >= 0 ? positive_trend_icon : negative_trend_icon}
          alt="Positive Trend Icon"
        />
        <p>
          {props.change >= 0
            ? `${props.change} more than last month`
            : `${props.change} compared to last month`}
        </p>
      </div>
    </DashCard>
  );
};

export const ValidationCard = (props) => {
  if (props.progressBar == null || props.progressBar.length === 0) {
    return (
      <DashCard key={props.title}>
        <p>{props.title}</p>
        <p>No Progress Bars to display</p>
      </DashCard>
    );
  }

  return (
    <DashCard key={props.title}>
      <SectionTitle title_text={props.title} />
      {props.progressBar.map((bar, index) => (
        <div
          key={`${props.title}-${index}`}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            marginTop: "1vh",
          }}
        >
          <p>{bar.title}</p>
          <ProgressBar
            current={bar.current}
            total={bar.total}
            color={bar.color}
          />
        </div>
      ))}
    </DashCard>
  );
};

export const PaymentCard = (props) => {
  return (
    <DashCard>
      <SectionTitle title_text={props.title} />
      <h1
        style={{
          alignSelf: "center",
          paddingLeft: "1vw",
          paddingRight: "1vw",
          marginBottom: "1vh",
          marginTop: "1vh",
        }}
      >
        {props.currentBalance}
      </h1>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: "1vh",
        }}
      >
        <p>{props.subtitle}</p>
        <p>{props.overallAccountPayment}</p>
      </div>
      <button
        style={{
          borderRadius: "6px",
          backgroundColor: "#fd7e14",
          width: "100%",
          border: "none",
          height: "30px",
          cursor: "pointer",
        }}
        onClick={() => {
          window.location.href =
            props.role === "admin" ? "/AdminPaymentsPage" : "/UserPaymentsPage";
        }}
      >
        See Payment Details
      </button>
    </DashCard>
  );
};

const ProgressBar = (props) => {
  // Set default values if props are not provided
  const current = props.current || 0;
  const total = props.total || 100;
  const color = props.color || "#4caf50";
  // Calculate the percentage of completion
  const percentage = (current / total) * 100;
  // Lighten the color by adjusting opacity
  const lighterBackgroundColor = `${color}30`; // 80 represents 50% opacity
  return (
    <div
      style={{
        height: "8px",
        backgroundColor: lighterBackgroundColor,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: "100%",
          backgroundColor: color,
          transition: "width 0.3s ease-in-out", // Add a smooth transition effect
        }}
      ></div>
    </div>
  );
};

export const LineChart = (props) => {
  // Convert tasksMapped to an integer, or use 0 if it's null
  const lineData =
    props.lineData !== undefined ? props.lineData : [1, 1, 1, 1, 1, 1, 1, 1];

  return (
    <Chart
      options={{
        tooltip: {
          enabled: false, // Disable tooltips
        },
        dataLabels: {
          enabled: false, // Disable data labels
        },
        grid: {
          show: false,
        },
        yaxis: {
          show: false,
        },
        xaxis: {
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        stroke: {
          show: true,
          curve: "smooth",
          lineCap: "butt",
          colors: "#4caf50",
          width: 2,
          dashArray: 0,
        },
        chart: {
          toolbar: false,
          height: 200,
        },
      }}
      series={[
        {
          name: "series-1",
          data: lineData,
        },
      ]}
      type="line"
      width="225"
    />
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
      style={{ boxShadow: "1px 1px 4px gray" }}
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
        // paddingLeft: "1vw",
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
        marginTop: ".5vh",
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
        width: "2vh",
        height: "2vh",
      }}
      alt={"close_button"}
      onClick={props.close_action}
    ></img>
  );
};

export const ModalHeader = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: 1 }}>
        <SectionTitle title_text={<strong>{props.title}</strong>} />
      </div>
      <CloseButton close_action={props.close_action} />
    </div>
  );
};

export const InputWithLabel = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        gap: "1vw",
      }}
    >
      <p
        style={{
          whiteSpace: "nowrap",
        }}
      >
        {props.label}
      </p>
      <input
        type={props.type}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        value={props.value}
        min={props.min}
        max={props.max}
        disabled={props.disabled}
        onChange={(e) => {
          props.onChange(e);
        }}
      />
    </div>
  );
};

export const DifficultySelector = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <SectionTitle title_text={"Difficulty:"} />
      <select
        value={props.value}
        onChange={(e) => props.handleSetDifficulty(e.target.value)}
      >
        <option value="Easy">Easy</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Hard">Hard</option>
      </select>
    </div>
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
      <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
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
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1vh",
          }}
        >
          {props.button1 === true ? (
            <>
              <Button
                style={{
                  marginLeft: "1vw",
                  marginRight: "1vw",
                  marginBottom: "1vh",
                }}
                onClick={() => props.button_1_action()}
              >
                {props.button_1_text}
              </Button>
            </>
          ) : (
            <></>
          )}

          {props.button2 === true ? (
            <>
              <Button
                style={{
                  marginLeft: "1vw",
                  marginRight: "1vw",
                  marginBottom: "1vh",
                }}
                onClick={() => props.button_2_action()}
              >
                {props.button_2_text}
              </Button>
            </>
          ) : (
            <></>
          )}
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
        height: "87vh",
      }}
    >
      <TableCard>
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
        height: "87vh",
      }}
    >
      <TableCard>
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

export const ProjectCardGrid = (props) => {
  return (
    <div style={{ overflowY: "scroll", width: "85vw", height: "99vh" }}>
      <Grid
        sx={{
          height: "auto",
          position: "relative",
          top: "3vh",
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
    <ProjectCardContainer
      key={props.id}
      onDoubleClick={() => {
        window.open(props.url, "_blank");
      }}
    >
      <AdminCardMediaStyle>
        <input
          type={"checkbox"}
          id={props.id}
          value={props.id}
          checked={props.id === props.projectSelected}
          onChange={(e) => {
            if (props.id === props.projectSelected) {
              props.handleSetProjectSelected(null, props.name);
            } else {
              props.handleSetProjectSelected(props.id, props.name);
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
          flexDirection: "column",
          justifyContent: "center",
          padding: "1vw",
          gap: "1vw",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <p>
            Editors: {props.total_editors}/{props.max_editors}{" "}
          </p>
          <p>
            Validators: {props.total_editors}/{props.max_editors}{" "}
          </p>
          <p>{`${props.difficulty}`}</p>
        </div>
        <h3>{props.name}</h3>

        <p>Mapping Rate: {`$${props.mapping_rate_per_task.toFixed(2)}`}</p>

        <p>
          Validation Rate: {`$${props.validation_rate_per_task.toFixed(2)}`}
        </p>

        {props.role && props.role === "admin" ? (
          <>
            <p>
              Current Payout: $
              {props.total_payout && (props.total_payout / 100).toFixed(2)}
            </p>
            <p>
              Total Budget: ${props.max_payment && props.max_payment.toFixed(2)}
            </p>
          </>
        ) : (
          <></>
        )}

        <ProgressBar
          current={props.tasks_mapped + props.tasks_validated}
          total={props.total_tasks * 2}
        />

        {/* <button
          style={{
            borderRadius: "6px",
            backgroundColor: "#fd7e14",
            width: "100%",
            border: "none",
            height: "30px",
            cursor: "pointer",
          }}
          onClick={() => {
            window.open(props.url, "_blank");
          }}
        >
          Start Mapping
        </button> */}
      </div>
    </ProjectCardContainer>
  );
};
