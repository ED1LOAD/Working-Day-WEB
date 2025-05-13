import { useEffect, useState } from "react";
import API from "../network/API";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import getCachedLogin from "../functions/getCachedLogin";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import { Container, FormControlLabel, Checkbox, Grid, Box, Typography } from "@mui/material";
import Notification from "../components/Notification";
import notifFilter from "../functions/notifFilter";
import arrayInsDel from "../functions/arrayInsDel";
import notifSort from "../functions/notifSort";
import "../styles/notifications.css";

function Notifications({sender}) {
  const [data, setData] = useState(null);
  const [info, setInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [getCachedLogin()],
  ]);
  useAsync(getJsonWithErrorHandlerFunc, setData, [
    (args) => API.notifications(args),
    [{}],
  ]);
  
  const [showTypes, setShowTypes] = useState([
    "vacation_request",
    "vacation_approved",
    "vacation_denied",
    "attendance_added",
    "generic",
  ]);

  function changeShowState(type) {
    setShowTypes([...arrayInsDel(showTypes, type)]);
  }

  const [processed, setProcessed] = useState(null);
  useEffect(() => {
    if (!data) {
      return;
    }
    setProcessed(notifSort(notifFilter(data.notifications, showTypes)));
  }, [data, showTypes]);


  return !processed || !info ? null : (
    <Box display="flex">
      <LeftPanel highlight="notifications" />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <TopPanel
          title="Уведомления"
          profpic={info.photo_link}
          showfunctions={false}
          username={info.name}
        />
        <Box display="flex" flexGrow={1} p={4}>
          <Container>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                  {processed.map((notif) => (
                    <Notification key={notif.id} {...notif} />
                  ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Box className="filter-area" p={2} border={1} borderColor="grey.300" borderRadius={4}>
                  <Typography variant="h6" gutterBottom>Фильтр</Typography>
                  <FormControlLabel
                    control={<Checkbox
                      checked={showTypes.includes("vacation_request")}
                      onChange={() => changeShowState("vacation_request")}
                      sx={{
                        color: '#164f94',
                        '&.Mui-checked': {
                          color: '#164f94',
                        },
                      }}
                    />}
                    label="Запрос отпуска"
                  />
                  <FormControlLabel
                    control={<Checkbox
                      checked={showTypes.includes("vacation_approved")}
                      onChange={() => changeShowState("vacation_approved")}
                      sx={{
                        color: '#164f94',
                        '&.Mui-checked': {
                          color: '#164f94',
                        },
                      }}
                    />}
                    label="Отпуск одобрен"
                  />
                  <FormControlLabel
                    control={<Checkbox
                      checked={showTypes.includes("vacation_denied")}
                      onChange={() => changeShowState("vacation_denied")}
                      sx={{
                        color: '#164f94',
                        '&.Mui-checked': {
                          color: '#164f94',
                        },
                      }}
                    />}
                    label="Отпуск отклонен"
                  />
                  <FormControlLabel
                    control={<Checkbox
                      checked={showTypes.includes("attendance_added")}
                      onChange={() => changeShowState("attendance_added")}
                      sx={{
                        color: '#164f94',
                        '&.Mui-checked': {
                          color: '#164f94',
                        },
                      }}
                    />}
                    label="Добавлена информация о рабочем времени"
                  />
                  <FormControlLabel
                    control={<Checkbox
                      checked={showTypes.includes("generic")}
                      onChange={() => changeShowState("generic")}
                      sx={{
                        color: '#164f94',
                        '&.Mui-checked': {
                          color: '#164f94',
                        },
                      }}
                    />}
                    label="Общая информация"
                  />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default Notifications;
