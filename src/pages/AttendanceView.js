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
    setPretime,
    [
      (args) => API.listAllAttendance(args),
      [{ from: formatDate(date), to: formatDate(addMonths(date, 1)) }],
    ],
    [date]
  );

  useEffect(() => {
    if (pretime === null || Object.keys(time).length !== 0) {
      return;
    }

    let emp = {};
    pretime.attendances.forEach((element) => {
      emp[element.employee.id] = element.employee;
    });
    setEmployees(emp);
    let ptime = {};

    Object.values(employees).forEach((element) => {
      let etime = {};
      for (
        let day = 1;
        day <= getDaysInMonth(date.getMonth(), date.getFullYear());
        day++
      ) {
        let citem = pretime.attendances.find((item) => {
          return (
            item.employee.id === element.id &&
            new Date(Date.parse(item.start_date)).getDate() === day
          );
        });

        let start = citem
          ? new Date(Date.parse(citem["start_date"]))
          : new Date();
        let end = citem ? new Date(Date.parse(citem["end_date"])) : start;

        let j = {
          start: start,
          end: end,
          absense: end < start,
        };

        etime[day] = j;
      }

      ptime[element.id] = etime;
    });
    setTime(ptime);
  }, [pretime, time, employees, date]);

  const my_id = getCachedLogin();
  const [myInfo, setMyInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]);

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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Посещения за месяц
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} style={{ textAlign: 'center'}}>
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
        <TableContainer style={{ marginTop: '20px' }}>
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
              {Object.values(employees).map((emp) => (
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
                            ? "Н"
                            : (() => {
                                let delta = time[emp.id][day]["end"] - time[emp.id][day]["start"];
                                if (delta === 0) {
                                  return "";
                                }
                                let minutes = (delta % 3600000) / 60000;
                                let hours = (delta - (delta % 3600000)) / 3600000;
                                return hours.toString() + ":" + (minutes < 10 ? "0" + minutes.toString() : minutes.toString());
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
    </div>
  );
}

export default AttendanceView;