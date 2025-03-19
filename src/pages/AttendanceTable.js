import { CheckBox, TableChart } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { DatePicker, TimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/ru"; 
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import optional from "../functions/optional";
import { addDays, subDays } from "date-fns";
import API from "../network/API";
import formatDate from "../functions/formatDate";
import getCachedLogin from "../functions/getCachedLogin";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import "../styles/attendance.css";

dayjs.locale("ru");

const theme = createTheme({
  palette: {
    primary: {
      main: "#164f94",
    },
  },
});

function AttendanceTable() {
  const initialDate = new Date().setHours(0, 0, 0, 0);
  const [date, setDate] = useState(initialDate);
  const [employees, setEmployees] = useState([]);
  const [time, setTime] = useState({});
  const [pretime, setPretime] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useAsync(
    getJsonWithErrorHandlerFunc,
    (data) => {
      console.log("API response:", data);
      setPretime(data);
    },
    [
      (args) => API.listAllAttendance(args),
      [{ from: formatDate(date), to: formatDate(addDays(date, 1)) }],
    ],
    [date]
  );

  useEffect(() => {
    if (pretime === null) return;
    if (Object.keys(time).length !== 0) return;

    let emp = [];
    let uniqueIds = new Set();
    pretime.attendances.forEach((element) => {
      if (!uniqueIds.has(element.employee.id)) {
        emp.push(element.employee);
        uniqueIds.add(element.employee.id);
      }
    });

    emp.sort((a, b) => a.surname.localeCompare(b.surname));
    setEmployees(emp);

    let ptime = {};
    emp.forEach((element) => {
      let attendance = pretime.attendances.find(
        (item) => item.employee.id === element.id
      );
      let start = new Date(Date.parse(attendance.start_date));
      let end = new Date(Date.parse(attendance.end_date));
      ptime[element.id] = {
        start,
        end,
        absense: end < start,
        abscence_type: attendance.abscence_type,
        mode: "duration", // Добавляем режим по умолчанию
      };
    });
    setTime(ptime);
  }, [pretime, time]);

  function toggleMode(emp_id) {
    setTime((prev) => {
      const currentMode = prev[emp_id].mode;
      const newMode = currentMode === "duration" ? "shift" : "duration";
      return {
        ...prev,
        [emp_id]: {
          ...prev[emp_id],
          mode: newMode,
        },
      };
    });
  }

  function setStart(v, emp_id) {
    let d = new Date(v);
    const newStart = new Date(new Date(date).setHours(d.getHours(), d.getMinutes()));
    setTime((prevTime) => ({
      ...prevTime,
      [emp_id]: { ...prevTime[emp_id], start: newStart },
    }));
  }

  function setEnd(v, emp_id) {
    let d = new Date(v);
    const newEnd = new Date(new Date(date).setHours(d.getHours(), d.getMinutes()));
    setTime((prevTime) => ({
      ...prevTime,
      [emp_id]: { ...prevTime[emp_id], end: newEnd },
    }));
  }

  function setDuration(v, emp_id) {
    let d = new Date(v);
    time[emp_id].start = new Date(new Date(date).setHours(9, 0, 0));
    time[emp_id].end = new Date(
      new Date(date).setHours(9 + d.getHours(), d.getMinutes())
    );
  }

  function changeAbsense(emp_id) {
    setTime((prevTime) => ({
      ...prevTime,
      [emp_id]: { ...prevTime[emp_id], absense: !prevTime[emp_id].absense },
    }));
  }

  async function markAll(e) {
    employees.forEach((emp) => {
      setDuration(new Date(date).setHours(8, 0, 0), emp.id);
      saveAttendance(undefined, emp.id);
    });
    alert("Посещения проставлены");
    window.location.reload();
  }

  async function saveAttendance(e, emp_id) {
    await API.addAttendance({
      employee_id: emp_id,
      start_date: formatDate(time[emp_id].absense ? date : time[emp_id].start),
      end_date: formatDate(time[emp_id].absense ? subDays(date, 1) : time[emp_id].end),
    });

    const duration = ((time[emp_id].end - time[emp_id].start) / (1000 * 60 * 60)).toFixed(2);
    setSnackbarMessage(
      `Посещение для ${employees.find((emp) => emp.id === emp_id).name} сохранено. Время: ${duration} часов`
    );
    setSnackbarOpen(true);
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const my_id = getCachedLogin();
  const [myInfo, setMyInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]);

  return !myInfo || !time ? null : (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <Box display="flex">
          <LeftPanel highlight="attendance" />
          <Box flexGrow={1}>
            <TopPanel
              title="Учет рабочего времени"
              profpic={myInfo.photo_link}
              showfunctions={false}
              username={myInfo.name}
            />
            <Box padding={2}>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h4">Посещения за</Typography>
                <DatePicker
                  format="DD.MM.YYYY"
                  defaultValue={dayjs(date)}
                  sx={{ marginLeft: "15px" }}
                  onChange={(v) => {
                    const newDate = new Date(v);
                    setPretime(null);
                    setTime({});
                    setDate(newDate);
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#164f94",
                    color: "#ffffff",
                    marginLeft: "15px",
                  }}
                  onClick={(e) => markAll(e)}
                >
                  Проставить всем
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle1">ФИО</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle1">Время</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle1">Статус</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!time || Object.keys(time).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body1" align="center">
                            Нет данных для отображения
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <Typography variant="body1">
                              {`${emp.surname} ${emp.name} ${optional(emp.patronymic)}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box style={{ minWidth: "300px" }}>
                                {time[emp.id].mode === "duration" ? (
                                  <TimePicker
                                    ampm={false}
                                    label="Часы"
                                    value={(() => {
                                      let delta = time[emp.id].end - time[emp.id].start;
                                      let minutes = (delta % 3600000) / 60000;
                                      let hours = Math.floor(delta / 3600000);
                                      let x = new Date(new Date(date).setHours(hours, minutes));
                                      return dayjs(x);
                                    })()}
                                    onChange={(v) => setDuration(v, emp.id)}
                                    disabled={time[emp.id].absense || time[emp.id].abscence_type}
                                    sx={{
                                      width: "140px",
                                      "& .MuiInputBase-input": {
                                        color: "#164f94",
                                      },
                                    }}
                                  />
                                ) : (
                                  <div style={{ display: "flex", gap: "5px" }}>
                                    <TimePicker
                                      label="Начало"
                                      ampm={false}
                                      value={dayjs(time[emp.id].start)}
                                      onChange={(v) => setStart(v, emp.id)}
                                      disabled={time[emp.id].absense || time[emp.id].abscence_type}
                                      sx={{ width: "140px" }}
                                    />
                                    <TimePicker
                                      label="Конец"
                                      ampm={false}
                                      value={dayjs(time[emp.id].end)}
                                      onChange={(v) => setEnd(v, emp.id)}
                                      disabled={time[emp.id].absense || time[emp.id].abscence_type}
                                      sx={{ width: "140px" }}
                                    />
                                  </div>
                                )}
                              </Box>
                              <Button
                                variant="outlined"
                                sx={{
                                  borderColor: "#164f94",
                                  color: "#164f94",
                                }}
                                onClick={() => toggleMode(emp.id)}
                                disabled={time[emp.id].abscence_type}
                              >
                                {time[emp.id].mode === "duration" ? "Смена" : "Назад"}
                              </Button>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={time[emp.id].absense}
                                    onChange={() => changeAbsense(emp.id)}
                                    disabled={time[emp.id].abscence_type}
                                    sx={{
                                      color: "#164f94",
                                      "&.Mui-checked": {
                                        color: "#164f94",
                                      },
                                    }}
                                  />
                                }
                                label="Отсутствие"
                              />
                              <Button
                                variant="outlined"
                                sx={{
                                  borderColor: "#164f94",
                                  color: "#164f94",
                                }}
                                onClick={(e) => saveAttendance(e, emp.id)}
                                disabled={time[emp.id].abscence_type}
                              >
                                Сохранить
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
              >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
                  {snackbarMessage}
                </Alert>
              </Snackbar>
            </Box>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default AttendanceTable;