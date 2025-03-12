import {
  Box,
  Container as MUIContainer,
  Typography,
  Grid,
  Button as MUIButton,
  Card,
  CardContent,
  TextField,
  styled
} from "@mui/material";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { useState } from "react";
import API from "../network/API";
import formatDate from "../functions/formatDate";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import getCachedLogin from "../functions/getCachedLogin";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";

dayjs.locale("ru");

const HoverableCard = styled(Card)({
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 3px 5px rgba(22, 79, 148, 1)"
  },
  overflow: "visible",
  whiteSpace: "normal",
});

const CustomButton = styled(MUIButton)(({ theme }) => ({
  fontSize: '1.25rem',
  padding: '0.75rem',
  margin: '0.5rem',
}));

const absenceTypeLabels = {
  vacation: "отпуска",
  sick_leave: "больничного",
  unpaid_vacation: "отпуска без содержания",
  business_trip: "командировки",
  overtime: "сверхурочных"
};

function AbsenceRequest() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [absenceType, setAbsenceType] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  async function sendRequest() {
    if (!startDate || (!endDate && absenceType !== "overtime") || !absenceType) {
      alert("Заполните все поля");
      return;
    }

    const requestData = {
      start_date: formatDate(startDate.toDate()),
      end_date: absenceType === "overtime" ? formatDate(startDate.toDate()) : formatDate(endDate.toDate()),
      type: absenceType,
    };

    if (absenceType === "overtime") {
      if (!startTime || !endTime) {
        alert("Выберите время начала и конца для сверхурочных");
        return;
      }
      const startDateTime = dayjs(startDate)
        .set('hour', startTime.hour())
        .set('minute', startTime.minute())
        .set('second', startTime.second())
        .set('millisecond', startTime.millisecond());
      const endDateTime = dayjs(startDate)
        .set('hour', endTime.hour())
        .set('minute', endTime.minute())
        .set('second', endTime.second())
        .set('millisecond', endTime.millisecond());

      requestData.start_date = formatDate(startDateTime.toDate());
      requestData.end_date = formatDate(endDateTime.toDate());
    }

    try {
      let res = await API.requestAbsence(requestData);
      if (res && res.ok) {
        alert("Запрос отправлен");
      } else {
        alert("Не удалось запросить отсутствие");
      }
    } catch (error) {
      alert("Произошла ошибка при отправке запроса");
    }
  }

  const my_id = getCachedLogin();
  const [myInfo, setMyInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]);

  return !myInfo ? null : (
    <Box display="flex" minHeight="100vh">
      <LeftPanel highlight="absenserequest" />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <TopPanel
          title="Запросы"
          profpic={myInfo.photo_link}
          showfunctions={false}
          username={myInfo.name}
        />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexGrow={1}
          padding={2}
          sx={{ overflow: "auto" }}
        >
          <MUIContainer maxWidth="md" sx={{ minHeight: "500px" }}>
            <Typography variant="h4" gutterBottom>
              {absenceType ? `Выбор даты для ${absenceTypeLabels[absenceType]}` : 'Выберите запрос'}
            </Typography>
            {!absenceType ? (
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("vacation")}>
                    <CardContent>
                      <Typography variant="h5">Отпуск</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Запрос на отпуск
                      </Typography>
                    </CardContent>
                  </HoverableCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("sick_leave")}>
                    <CardContent>
                      <Typography variant="h5">Больничный</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Запрос на больничный
                      </Typography>
                    </CardContent>
                  </HoverableCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("unpaid_vacation")}>
                    <CardContent>
                      <Typography variant="h5">Отпуск без содержания</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Запрос на отпуск без содержания
                      </Typography>
                    </CardContent>
                  </HoverableCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("business_trip")}>
                    <CardContent>
                      <Typography variant="h5">Командировка</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Запрос на командировку
                      </Typography>
                    </CardContent>
                  </HoverableCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("overtime")}>
                    <CardContent>
                      <Typography variant="h5">Сверхурочные</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Запрос на сверхурочные
                      </Typography>
                    </CardContent>
                  </HoverableCard>
                </Grid>
              </Grid>
            ) : (
              <Box mt={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DatePicker
                        format="DD.MM.YYYY"
                        slotProps={{ textField: { placeholder: "Дата" } }}
                        onChange={(v) => setStartDate(dayjs(v))}
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    {absenceType === "overtime" && (
                      <Grid item xs={12}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TimePicker
                              label="Время начала"
                              value={startTime}
                              onChange={(v) => setStartTime(dayjs(v))}
                              renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TimePicker
                              label="Время конца"
                              value={endTime}
                              onChange={(v) => setEndTime(dayjs(v))}
                              renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    )}
                    {absenceType !== "overtime" && (
                      <Grid item xs={12}>
                        <DatePicker
                          format="DD.MM.YYYY"
                          slotProps={{ textField: { placeholder: "Конец" } }}
                          onChange={(v) => setEndDate(dayjs(v))}
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </LocalizationProvider>
                <Box mt={2} display="flex" justifyContent="center">
                  <CustomButton
                    variant="contained"
                    color="primary"
                    onClick={sendRequest}
                    sx={{
                      backgroundColor: "#164f94",
                      "&:hover": { backgroundColor: "#133a6c" },
                    }}
                  >
                    Отправить запрос
                  </CustomButton>
                  <CustomButton
                    variant="outlined"
                    color="error"
                    onClick={() => setAbsenceType(null)}
                  >
                    Отмена
                  </CustomButton>
                </Box>
              </Box>
            )}
          </MUIContainer>
        </Box>
      </Box>
    </Box>
  );
}

export default AbsenceRequest;
