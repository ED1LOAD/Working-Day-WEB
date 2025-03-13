import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  Button as MUIButton,
  Container as MUIContainer,
  TextField,
  Grid,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import formatDate from "../functions/formatDate";
import { addMonths } from "date-fns";
import optional from "../functions/optional";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import SearchPanel from "../components/SearchPanel";
import { useNavigate } from "react-router-dom";
import "../styles/useradd.css";

function UserAdd() {
  const [receivers, setReceivers] = useState([]);
  const [employees, setEmployees] = useState({});
  const [pretime, setPretime] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({ name: false, surname: false, midname: false });
  const navigate = useNavigate();
  const [job_position, setJobPosition] = useState("");

  useAsync(getJsonWithErrorHandlerFunc, setPretime, [
    (args) => API.listAllAttendance(args),
    [
      {
        from: formatDate(new Date()),
        to: formatDate(addMonths(new Date(), 1)),
      },
    ],
  ]);

  useEffect(() => {
    if (pretime === null) {
      return;
    }
    let emp = {};
    pretime.attendances.forEach((element) => {
      emp[element.employee.id] = element.employee;
    });
    setEmployees(emp);
  }, [pretime]);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [midname, setMidname] = useState("");
  const [login, setLogin] = useState(null);
  const [password, setPassword] = useState(null);
  const [role, setRole] = useState("");

  function handleChange(e) {
    setReceivers(
      typeof e.target.value === "string"
        ? e.target.value.split(",")
        : e.target.value
    );
  }

  async function addEmployee() {
    if (!name || !surname || /\s/.test(name) || /\s/.test(surname) || /\s/.test(midname)) {
      setErrors({
        name: /\s/.test(name),
        surname: /\s/.test(surname),
        midname: /\s/.test(midname),
      });
      setNotification({ open: true, message: "Введите корректные имя, фамилию и отчество без пробелов", severity: 'warning' });
      return;
    }

    const employeeRole = role || "user";

    let addres = await API.addEmployee({
      name,
      surname,
      patronymic: midname,
      role: employeeRole,
      job_position: job_position,
    });
    let addresjson = await addres.json();
    setLogin(addresjson.login);
    setPassword(addresjson.password);

    if (!addres || !addres.ok) {
      setNotification({ open: true, message: "Не удалось создать пользователя", severity: 'error' });
      return;
    }

    if (receivers.length > 0) {
      let addheadres = await API.addHeadEmployee({
        employee_id: addresjson.login,
        head_id: receivers[0],
      });
      if (!addheadres || !addheadres.ok) {
        setNotification({ open: true, message: "Не удалось назначить руководителя", severity: 'error' });
        return;
      }
    }

    setNotification({ open: true, message: "Пользователь успешно добавлен", severity: 'success' });
  }

  function refresh() {
    window.location.reload();
  }

  return (
    <Box display="flex" overflow="hidden" height="100vh">
      <LeftPanel highlight="search" />
      <Box flexGrow={1}>
        <SearchPanel setOuterRequest={(e) => {}} searchFunc={(e) => {}} />
        <MUIContainer maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Добавление сотрудника
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Фамилия"
                  variant="outlined"
                  error={errors.surname}
                  helperText={errors.surname ? "Фамилия не должна содержать пробелов" : ""}
                  onChange={(e) => {
                    setSurname(e.target.value);
                    setErrors({ ...errors, surname: /\s/.test(e.target.value) });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Имя"
                  variant="outlined"
                  error={errors.name}
                  helperText={errors.name ? "Имя не должно содержать пробелов" : ""}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors({ ...errors, name: /\s/.test(e.target.value) });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Отчество"
                  variant="outlined"
                  error={errors.midname}
                  helperText={errors.midname ? "Отчество не должно содержать пробелов" : ""}
                  onChange={(e) => {
                    setMidname(e.target.value);
                    setErrors({ ...errors, midname: /\s/.test(e.target.value) });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="receivers-label">Руководитель</InputLabel>
                  <Select
                    labelId="receivers-label"
                    value={receivers}
                    onChange={handleChange}
                    input={<OutlinedInput label="Руководитель" />}
                  >
                    {Object.values(employees).map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {`${emp.surname} ${emp.name} ${optional(emp.patronymic)}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Должность"
            variant="outlined"
            onChange={(e) => setJobPosition(e.target.value)}
          />
        </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Роль</InputLabel>
                  <Select
                    labelId="role-label"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    input={<OutlinedInput label="Роль" />}
                  >
                    <MenuItem value="user">Сотрудник</MenuItem>
                    <MenuItem value="manager">Табельщик</MenuItem>
                    <MenuItem value="admin">Бухгалтер</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" gap={2}>
                  <MUIButton
                    variant="contained"
                    sx={{ backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
                    onClick={addEmployee}
                  >
                    Добавить сотрудника
                  </MUIButton>
                  <MUIButton
                    variant="contained"
                    sx={{ backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
                    onClick={refresh}
                  >
                    Очистить поля
                  </MUIButton>
                  <MUIButton
                    variant="contained"
                    sx={{ backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
                    onClick={() => navigate("/search")}
                  >
                    Назад
                  </MUIButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box mt={2}>
                  <Typography variant="body1" fontWeight="bold">
                    Логин
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, backgroundColor: '#f1f1f1', padding: '10px', borderRadius: '4px' }}>
                    {optional(login)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box mt={2}>
                  <Typography variant="body1" fontWeight="bold">
                    Пароль
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, backgroundColor: '#f1f1f1', padding: '10px', borderRadius: '4px' }}>
                    {optional(password)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
        </MUIContainer>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default UserAdd;
