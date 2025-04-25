import { useEffect, useState } from "react";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import formatDate from "../functions/formatDate";
import getCachedLogin from "../functions/getCachedLogin";
import { addMonths } from "date-fns";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import getDaysInMonth from "../functions/getDaysInMonth";
import optional from "../functions/optional";
import "../styles/attendanceview.css";

function AttendanceView() {
  const [date, setDate] = useState(
    (() => {
      let d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    })()
  );
  const [employees, setEmployees] = useState({});
  const [time, setTime] = useState({});
  const [pretime, setPretime] = useState(null);

  useAsync(
    getJsonWithErrorHandlerFunc,
    (data) => {
      console.log("📦 Ответ от API.listAllAttendance:", data);
      if (!data || !Array.isArray(data.attendances)) {
        console.warn("⚠️ Данные по посещениям не получены или имеют неправильный формат");
      } else {
        console.table(data.attendances.map(item => ({
          ID: item.employee.id,
          ФИО: `${item.employee.surname} ${item.employee.name}`,
          Старт: item.start_date,
          Конец: item.end_date,
          Тип: item.abscence_type || "-",
        })));
      }
      setPretime(data);
    },
    [
      (args) => {
        console.log("📤 Отправляем запрос на listAllAttendance с аргументами:", args);
        return API.listAllAttendance(args);
      },
      [{ from: formatDate(date), to: formatDate(addMonths(date, 1)) }],
    ],
    [date]
  );
  

  useEffect(() => {
    if (pretime === null || Object.keys(time).length !== 0) return;
  
    console.log("🔄 Обрабатываем pretime:", pretime);
  
    let emp = {};
    pretime.attendances.forEach((element) => {
      emp[element.employee.id] = element.employee;
    });
  
    const sortedEmployees = Object.values(emp).sort((a, b) =>
      a.surname.localeCompare(b.surname)
    );
    console.log("👥 Отсортированные сотрудники:", sortedEmployees);
  
    let sortedEmpMap = {};
    sortedEmployees.forEach(emp => {
      sortedEmpMap[emp.id] = emp;
    });
    setEmployees(sortedEmpMap);
  
    let ptime = {};
    sortedEmployees.forEach((element) => {
      let etime = {};
      for (let day = 1; day <= getDaysInMonth(date.getMonth(), date.getFullYear()); day++) {
        let citem = pretime.attendances.find((item) => {
          return (
            item.employee.id === element.id &&
            new Date(Date.parse(item.start_date)).getDate() === day
          );
        });
  
        if (citem) {
          console.log(`📆 ${element.surname} ${element.name} — день ${day}:`, citem);
        }
  
        let start = citem ? new Date(Date.parse(citem.start_date)) : new Date();
        let end = citem ? new Date(Date.parse(citem.end_date)) : start;
  
        let j = {
          start: start,
          end: end,
          absense: citem?.abscence_type || (end < start ? "Н" : ""),
        };
  
        etime[day] = j;
      }
      ptime[element.id] = etime;
    });
    setTime(ptime);
  }, [pretime, time, date]);
  

  const my_id = getCachedLogin();
  const [myInfo, setMyInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]);

  const groupedEmployees = Object.values(employees).reduce((acc, emp) => {
    if (!acc[emp.subcompany]) {
      acc[emp.subcompany] = [];
    }
    acc[emp.subcompany].push(emp);
    return acc;
  }, {});

  const formattedDate = dayjs(date).format('MMMM YYYY');

  const absenceTypeLabels = {
    vacation: "Отпуск",
    sick_leave: "Больничный",
    unpaid_vacation: "Отпуск без содержания",
    business_trip: "Командировка",
    overtime: "Сверхурочные",
  };

  const formatTime = (hours, minutes) => `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;

  const calculateOvertime = (delta) => {
    const standardHours = 8;
    const standardMillis = standardHours * 3600000;
    const overtimeMillis = delta - standardMillis;

    const overtimeHours = Math.floor(overtimeMillis / 3600000);
    const overtimeMinutes = Math.floor((overtimeMillis % 3600000) / 60000);

    return `8:00 + ${formatTime(overtimeHours, overtimeMinutes)} сверхурочные`;
  };

  return !myInfo || !time ? null : (
    <div style={{ display: "flex" }}>
      <LeftPanel highlight="viewattendance" />
      <div style={{ flexGrow: 1, padding: '20px' }}>
        <TopPanel
          title="Информация от табельщиков"
          profpic={myInfo.photo_link}
          showfunctions={false}
          username={myInfo.name}
        />
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Посещения за {formattedDate}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} style={{ textAlign: 'right' }}>
            <DatePicker
              className="datepicker"
              format="MM/YY"
              views={["month", "year"]}
              defaultValue={dayjs(date)}
              onChange={(v) => {
                const date = new Date(v);
                date.setDate(1);
                setPretime(null);
                setTime({});
                setDate(date);
              }}
            />
          </Grid>
        </Grid>
        {Object.keys(groupedEmployees).map((subcompany) => (
          <div key={subcompany} style={{ marginTop: '40px' }}>
            <Typography variant="h5" gutterBottom>
              {subcompany}
            </Typography>
            <TableContainer component={Paper} style={{ marginTop: '20px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="attendance-view-cell">
                      <Typography variant="subtitle1">ФИО</Typography>
                    </TableCell>
                    {[...Array(getDaysInMonth(date.getMonth(), date.getFullYear()) + 1).keys()]
                      .slice(1)
                      .map((day) => (
                        <TableCell key={day} className="attendance-view-cell">
                          <Typography variant="subtitle1">{day}</Typography>
                        </TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedEmployees[subcompany].map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="attendance-view-cell">
                        <Typography variant="body1">
                          {emp.surname + " " + emp.name + " " + optional(emp.patronymic)}
                        </Typography>
                      </TableCell>
                      {!time || Object.keys(time).length === 0 ? (
                        <TableCell colSpan={getDaysInMonth(date.getMonth(), date.getFullYear())}>
                          <Typography variant="body1" align="center">
                            No data available
                          </Typography>
                        </TableCell>
                      ) : (
                        Object.keys(time[emp.id]).map((day) => (
                          <TableCell
                            key={day}
                            className={
                              "attendance-view-cell" +
                              ([0, 6].includes(new Date(new Date(date).setDate(day)).getDay())
                                ? " attendance-view-cell-weekend"
                                : "")
                            }
                          >
                            <Typography variant="body1">
                                {time[emp.id][day]["absense"]
                                  ? time[emp.id][day]["absense"] === 'overtime'
                                    ? calculateOvertime(time[emp.id][day]["end"] - time[emp.id][day]["start"])
                                    : absenceTypeLabels[time[emp.id][day]["absense"]] || "Н"
                                  : (() => {
                                      let delta = time[emp.id][day]["end"] - time[emp.id][day]["start"];
                                      if (delta <= 0) {
                                        return ""; 
                                      }

                                      let minutes = (delta % 3600000) / 60000;
                                      let hours = (delta - (delta % 3600000)) / 3600000;

                                      if (time[emp.id][day]["abscence_type"] === 'overtime') {
                                        const standardHours = 8;
                                        const standardMillis = standardHours * 3600000;
                                        const overtimeMillis = delta - standardMillis;

                                        const overtimeHours = Math.floor(overtimeMillis / 3600000);
                                        const overtimeMinutes = Math.floor((overtimeMillis % 3600000) / 60000);

                                        return `8:00 + ${overtimeHours}:${overtimeMinutes < 10 ? '0' + overtimeMinutes : overtimeMinutes} сверхурочные`;
                                      } else {
                                        return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
                                      }
                                    })()}
                              </Typography>
                          </TableCell>
                        ))
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceView;
