import { useEffect, useState, useMemo } from "react";
import API from "../network/API";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import getCachedLogin from "../functions/getCachedLogin";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import formatDate from "../functions/formatDate";
import optional from "../functions/optional";
import { addMonths } from "date-fns";
import {
  Box,
  Container as MUIContainer,
  Grid,
  Snackbar,
  Alert,
  TextField,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import Document from "../components/Document";
import "../styles/viewdocuments.css";

function ViewDocuments() {
  const [data, setData] = useState(null);
  const [info, setInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDocMeta, setSelectedDocMeta] = useState({ name: "", description: "", type: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [pretime, setPretime] = useState(null);

  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [getCachedLogin()],
  ]);

  useAsync(
    async () => {
      const result = await getJsonWithErrorHandlerFunc(() => API.listDocuments({}));
      return result;
    },
    setData,
    []
  );

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const result = await getJsonWithErrorHandlerFunc(() =>
          API.listAllAttendance({
            from: formatDate(new Date()),
            to: formatDate(addMonths(new Date(), 1)),
          })
        );
        setPretime(result);
      } catch (err) {
        console.warn("⚠️ Ошибка получения посещаемости:", err);
        setPretime(null);
      }
    }

    fetchAttendance();
  }, []);

  useEffect(() => {
    if (!pretime?.attendances) return;
    const empMap = {};
    pretime.attendances.forEach((entry) => {
      empMap[entry.employee.id] = entry.employee;
    });
    setEmployees(Object.values(empMap));
  }, [pretime]);

  const filteredDocuments = useMemo(() => {
    if (!data?.documents) return [];
    const query = searchQuery.toLowerCase();
    return data.documents.filter((doc) =>
      doc.name?.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, data]);

  const handleSendFurther = async () => {
    if (!selectedDocId || !selectedReceiver) return;

    const payload = {
      doc_id: selectedDocId,
      doc_name: selectedDocMeta.name,
      doc_description: selectedDocMeta.description,
      doc_sign_required: false,
      employee_ids: [selectedReceiver],
    };

    try {
      const send = await API.sendDocuments(payload);
      if (send && send.ok) {
        setNotification({
          open: true,
          message: 'Документ отправлен дальше',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Ошибка при отправке документа',
          severity: 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Ошибка соединения с сервером',
        severity: 'error'
      });
    }

    setIsDialogOpen(false);
  };

  const handleForwardClick = (doc) => {
    const latestSigned = data?.documents?.find(
      (d) =>
        d.name === doc.name &&
        d.description === doc.description &&
        d.signed === true &&
        d.id !== doc.id
    );

    const idToSend = latestSigned?.id || doc.id;

    setSelectedDocId(idToSend);
    setSelectedDocMeta({
      name: doc.name,
      description: doc.description,
      type: doc.type,
    });

    setIsDialogOpen(true);
  };

  return !data || !info ? null : (
    <Box display="flex" overflow="hidden" height="100vh">
      <LeftPanel highlight="viewdoc" />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <TopPanel
          title="Мои документы"
          profpic={info.photo_link}
          showfunctions={false}
          username={info.name}
        />
        <MUIContainer maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1, overflowY: 'auto' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Поиск по документам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
          />
          {filteredDocuments.length > 0 ? (
            <Grid container spacing={3}>
              {filteredDocuments.map((doc) => (
                <Grid item xs={12} key={doc.id}>
                  <Document {...doc} onForwardClick={handleForwardClick} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
              Документы не найдены
            </Typography>
          )}
        </MUIContainer>

        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Выберите получателя</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Сотрудник</InputLabel>
              <Select
                value={selectedReceiver}
                onChange={(e) => setSelectedReceiver(e.target.value)}
                label="Сотрудник"
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.surname} {emp.name} {optional(emp.patronymic)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSendFurther} variant="contained" sx={{ backgroundColor: '#164f94' }}>
              Отправить
            </Button>
          </DialogActions>
        </Dialog>

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

export default ViewDocuments;
