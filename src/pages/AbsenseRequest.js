import {
  Box,
  Container as MUIContainer,
  Typography,
  Grid,
  Button as MUIButton,
  Card,
  CardContent,
  TextField,
  styled,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  OutlinedInput,
  Snackbar,
  Alert,
  Dialog,
} from "@mui/material";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { useRef, useState, useEffect } from "react";
import API from "../network/API";
import formatDate from "../functions/formatDate";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import getCachedLogin from "../functions/getCachedLogin";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import SignFlowSend from "../components/SignFlowSendDocument"; 
import optional from "../functions/optional";

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
  overtime: "сверхурочных",
  other: "другого заявления"
};

function AbsenceRequest() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [absenceType, setAbsenceType] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [otherTitle, setOtherTitle] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const otherDocRef = useRef(null);
  const [otherDocName, setOtherDocName] = useState(null);
  const [otherDocData, setOtherDocData] = useState(null);

  const my_id = getCachedLogin();
  const [myInfo, setMyInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [() => API.infoEmployee(my_id), [my_id]]);

  function handleOtherFileChange(e) {
    let file = e.target.files[0];
    setOtherDocName(file.name);
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      setOtherDocData(e.target.result);
    };
  }
  const [chain, setChain] = useState([]);
  const [signatureRequirements, setSignatureRequirements] = useState({});
  const [openChainModal, setOpenChainModal] = useState(false);
  const [employees, setEmployees] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await getJsonWithErrorHandlerFunc(
          (args) => API.getEmployees(args),
          []
        );
        if (response && response.employees) {
          const empMap = response.employees.reduce((acc, emp) => {
            acc[emp.id] = emp;
            return acc;
          }, {});
          setEmployees(empMap);
        }
      } catch (error) {
        console.error("Ошибка при получении сотрудников:", error);
        setNotification({
          open: true,
          message: "Ошибка загрузки списка сотрудников",
          severity: "error"
        });
      }
    }
    fetchEmployees();
  }, []);

  const handleChainMetadataChange = (updatedSigners) => {
    const newRequirements = updatedSigners.reduce((acc, signer) => {
      acc[signer.id] = signer.requires_signature;
      return acc;
    }, {});
    setSignatureRequirements(newRequirements);
  };

  const buildChainMetadata = () => {
    return chain.map(id => ({
      employee_id: id,
      requires_signature: signatureRequirements[id] !== false,
      status: 0
    }));
  };
  async function handleOtherSubmit() {
    if (!otherDocData || !otherTitle) {
      setNotification({ open: true, message: "Заполните название и выберите документ", severity: "error" });
      return;
    }

    try {

      const upload = await getJsonWithErrorHandlerFunc(() => API.uploadDocuments(), []);
      await API.xfetch({
        path: upload.url,
        isabsolute: true,
        method: "PUT",
        body: new File([otherDocData], otherDocName),
        bodyisjson: false
      });


      if (chain.length > 0) {
        const currentUserId = getCachedLogin();
    
        const sendResponse = await API.sendDocuments({
          doc_id: upload.id,
          doc_name: otherTitle,
          doc_sign_required: true,
          doc_description: otherDescription,
          employee_ids: [currentUserId],
        });

        if (!sendResponse.ok) throw new Error("Ошибка отправки документа");


        const chainMetadata = buildChainMetadata();
        const addChainRes = await API.addDocumentChain({
          document_id: upload.id,
          chain_metadata: chainMetadata,
        });

        if (!addChainRes.ok) throw new Error("Ошибка создания цепочки");
      } else {

        await API.sendDocuments({
          doc_id: upload.id,
          doc_name: otherTitle,
          doc_description: otherDescription,
          employee_ids: [my_id],
          doc_sign_required: true
        });
      }

      setNotification({ open: true, message: "Документ отправлен", severity: "success" });

      setAbsenceType(null);
      setOtherDocData(null);
      setOtherDocName(null);
      setOtherTitle("");
      setOtherDescription("");
      setChain([]);

    } catch (error) {
      setNotification({ open: true, message: "Ошибка отправки: " + error.message, severity: "error" });
    }
  }

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
      requestData.start_date = formatDate(dayjs(startDate).set('hour', startTime.hour()).set('minute', startTime.minute()).toDate());
      requestData.end_date = formatDate(dayjs(startDate).set('hour', endTime.hour()).set('minute', endTime.minute()).toDate());
    }
    const res = await API.requestAbsence(requestData);
    if (res && res.ok) {
      alert("Запрос отправлен");
      setAbsenceType(null);
      setStartDate(null);
      setEndDate(null);
      setStartTime(null);
      setEndTime(null);
    } else {
      alert("Ошибка отправки запроса");
    }
  }

  return !myInfo ? null : (
    <Box display="flex" minHeight="100vh">
      <LeftPanel highlight="absenserequest" />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <TopPanel title="Запросы" profpic={myInfo.photo_link} showfunctions={false} username={myInfo.name} />
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1} padding={2} sx={{ overflow: "auto" }}>
          <MUIContainer maxWidth="md" sx={{ minHeight: "500px" }}>
            <Typography variant="h4" gutterBottom>
              {absenceType ? `Выбор даты для ${absenceTypeLabels[absenceType]}` : 'Выберите запрос'}
            </Typography>
            {!absenceType ? (
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("vacation")}> <CardContent><Typography variant="h5">Отпуск</Typography></CardContent></HoverableCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("unpaid_vacation")}> <CardContent><Typography variant="h5">Отпуск без содержания</Typography></CardContent></HoverableCard>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <HoverableCard onClick={() => setAbsenceType("other")}> <CardContent><Typography variant="h5">Другое заявление</Typography></CardContent></HoverableCard>
                </Grid>
              </Grid>
            ) : absenceType === "other" ? (
              <Box mt={4}>
                <TextField
                  fullWidth
                  label="Название"
                  value={otherTitle}
                  onChange={(e) => setOtherTitle(e.target.value)}
                  sx={{ mt: 2 }}
                />
                <TextField
                  fullWidth
                  label="Описание"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  multiline
                  rows={4}
                  sx={{ mt: 2 }}
                />

 
                <Box mt={3}>
                  <MUIButton
                    variant="outlined"
                    onClick={() => setOpenChainModal(true)}
                    sx={{ mb: 2 }}
                  >
                    {chain.length > 0 ? "Изменить цепочку согласования" : "Добавить цепочку согласования"}
                  </MUIButton>

                  {chain.length > 0 && (
                    <SignFlowSend
                      signers={chain.map(id => {
                        const emp = employees[id];
                        return {
                          id,
                          name: emp ? `${emp.name} ${emp.surname}` : `Сотрудник ${id}`,
                          requires_signature: signatureRequirements[id] !== false,
                          signed: false
                        };
                      })}
                    />
                  )}
                </Box>


                <input
                  type="file"
                  ref={otherDocRef}
                  style={{ display: "none" }}
                  onChange={handleOtherFileChange}
                />

                <Box display="flex" alignItems="center" mt={2} gap={2}>
                  <CustomButton
                    variant="outlined"
                    onClick={() => otherDocRef.current.click()}
                    sx={{ flexGrow: 1 }}
                  >
                    {otherDocName || 'Выбрать документ'}
                  </CustomButton>
                  <Typography variant="body2" color="textSecondary">
                    {otherDocName && "Файл выбран"}
                  </Typography>
                </Box>

 
                <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
                  <CustomButton
                    variant="contained"
                    onClick={handleOtherSubmit}
                    sx={{ backgroundColor: '#164f94', "&:hover": { backgroundColor: "#133a6c" } }}
                  >
                    Отправить
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
            ) : (
              <Box mt={4}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                  <Grid container spacing={2}>
                    <Grid item xs={12}><DatePicker format="DD.MM.YYYY" onChange={(v) => setStartDate(dayjs(v))} sx={{ width: '100%' }} /></Grid>
                    {absenceType === "overtime" && (
                      <Grid item xs={12} container spacing={2}>
                        <Grid item xs={6}><TimePicker label="Время начала" value={startTime} onChange={(v) => setStartTime(dayjs(v))} /></Grid>
                        <Grid item xs={6}><TimePicker label="Время конца" value={endTime} onChange={(v) => setEndTime(dayjs(v))} /></Grid>
                      </Grid>
                    )}
                    {absenceType !== "overtime" && (
                      <Grid item xs={12}><DatePicker format="DD.MM.YYYY" onChange={(v) => setEndDate(dayjs(v))} sx={{ width: '100%' }} /></Grid>
                    )}
                  </Grid>
                </LocalizationProvider>
                <Box mt={2} display="flex" justifyContent="center">
                  <CustomButton variant="contained" color="primary" onClick={sendRequest} sx={{ backgroundColor: "#164f94", "&:hover": { backgroundColor: "#133a6c" } }}>Отправить запрос</CustomButton>
                  <CustomButton variant="outlined" color="error" onClick={() => setAbsenceType(null)}>Отмена</CustomButton>
                </Box>
              </Box>
            )}
            <Dialog open={openChainModal} onClose={() => setOpenChainModal(false)} maxWidth="md" fullWidth>
              <Box p={3}>
                <Typography variant="h6" mb={2}>Настройка цепочки согласования</Typography>

                <Box sx={{ overflowX: 'auto', px: 1 }}>
                  <SignFlowSend
                    signers={chain.map(id => ({
                      id,
                      name: employees[id] ? `${employees[id].name} ${employees[id].surname}` : `Сотрудник ${id}`,
                      requires_signature: signatureRequirements[id] !== false,
                      signed: false
                    }))}
                    editable={true}
                    onRemove={(id) => setChain(chain.filter(uid => uid !== id))}
                    onReorder={(newList) => setChain(newList.map(s => s.id))}
                    onSignatureChange={handleChainMetadataChange}
                  />
                </Box>

                <FormControl fullWidth sx={{ mt: 3 }}>
                  <InputLabel>Добавить сотрудника</InputLabel>
                  <Select
  value=""
  onChange={(e) => {
    const selectedId = e.target.value;
    if (!chain.includes(selectedId)) {
      setChain([...chain, selectedId]);
    }
  }}
  input={<OutlinedInput label="Добавить сотрудника" />}
  MenuProps={{
    PaperProps: {
      style: {
        maxHeight: 250,
        overflow: 'auto', 
      },
    },
  }}
>
  {Object.values(employees)
    .filter((emp) => !chain.includes(emp.id))
    .map((emp) => (
      <MenuItem key={emp.id} value={emp.id}>
        {emp.surname} {emp.name} {optional(emp.patronymic)}
      </MenuItem>
    ))}
</Select>
                </FormControl>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                  <MUIButton onClick={() => setOpenChainModal(false)}>Отмена</MUIButton>
                  <MUIButton
                    variant="contained"
                    sx={{ backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
                    onClick={() => setOpenChainModal(false)}
                  >
                    Сохранить
                  </MUIButton>
                </Box>
              </Box>
            </Dialog>
          </MUIContainer>
        </Box>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default AbsenceRequest;
