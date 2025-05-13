import {
  Box,
  Chip,
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
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Dialog,
} from "@mui/material";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import { useEffect, useRef, useState } from "react";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import getCachedLogin from "../functions/getCachedLogin";
import "../styles/senddocument.css";
import optional from "../functions/optional";
import formatDate from "../functions/formatDate";
import { addMonths } from "date-fns";
import SignFlowSend from "../components/SignFlowSendDocument";

function SendDocument() {
  const [info, setInfo] = useState(false);
  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [getCachedLogin()],
  ]);

  const [receivers, setReceivers] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  function handleChange(e) {
    setReceivers(
      typeof e.target.value === "string"
        ? e.target.value.split(",")
        : e.target.value
    );
  }

  const [sendMode, setSendMode] = useState("none");
  const [openChainModal, setOpenChainModal] = useState(false);
const [chain, setChain] = useState([]); 

  const [signatureRequirements, setSignatureRequirements] = useState({});
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

  const document_input = useRef(null);
  const [documentData, setDocumentData] = useState(null);
  const [documentName, setDocumentName] = useState(null);

  function readDoc(e) {
    let files = e.target.files;
    if (!files || files.length === 0) return;
  
    const file = files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ["pdf", "docx"];
  
    if (!allowedExtensions.includes(fileExtension)) {
      setNotification({ open: true, message: "Можно загружать только PDF или DOCX файлы", severity: "error" });
      return;
    }
  
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  
    if (!allowedTypes.includes(file.type)) {
      setNotification({ open: true, message: "Можно загружать только PDF или DOCX файлы", severity: "error" });
      return;
    }
  
    setDocumentName(file.name);
  
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      setDocumentData(e.target.result);
    };
  }
  
  

  const [needSignature, setNeedSignature] = useState(false);

  const [employees, setEmployees] = useState({});
  const [pretime, setPretime] = useState(null);
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

  async function sendDocumentsWithRetry(documentPayload, maxRetries = 10) {
    let attempt = 0;
    let delay = 1000;
    
    console.log("[sendDocumentsWithRetry] Начинаем отправку документа:", documentPayload);
  
    while (attempt <= maxRetries) {
      try {
        console.log(`[sendDocumentsWithRetry] Попытка #${attempt + 1}`);
  
        const response = await API.sendDocuments(documentPayload);
        console.log(` [sendDocumentsWithRetry] Ответ сервера на попытке #${attempt + 1}:`, response.status);
  
        if (response.ok) {
          console.log(`[sendDocumentsWithRetry] Документ успешно отправлен на попытке ${attempt + 1}`);
          return response;
        } else if (response.status === 500) {
          console.warn(`[sendDocumentsWithRetry] Попытка #${attempt + 1} неудачна: сервер вернул 500, будет новая попытка...`);

        } else {
          console.error("[sendDocumentsWithRetry] Ошибка отправки документа, статус:", response.status);
          return response;
        }
      } catch (error) {
        console.warn(`⚡ [sendDocumentsWithRetry] Попытка #${attempt + 1} неудачна из-за сети или CORS: ${error.message}`);

      }
  
      attempt++;
      if (attempt > maxRetries) {

        throw new Error("Не удалось отправить документ после нескольких попыток");
      }
  
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  async function send(e) {
    e.preventDefault();
  
    if (receivers.length === 0 || !documentData) {
      setNotification({ open: true, message: "Заполните все поля", severity: "warning" });
      return;
    }
  
    const extension = documentName.endsWith(".docx") ? ".docx" : ".pdf";

    let upload;
    try {
      upload = await getJsonWithErrorHandlerFunc(
        (args) => API.uploadDocuments({ extension }),
        []
      );
    } catch (err) {
      setNotification({ open: true, message: "Ошибка при инициализации загрузки", severity: "error" });
      return;
    }
  

    let resupload;
    try {
      resupload = await API.xfetch({
        path: upload.url,
        isabsolute: true,
        method: "PUT",
        body: new File([documentData], documentName),
        bodyisjson: false,
      });
  
      if (!resupload.ok) {
        setNotification({ open: true, message: "Ошибка при загрузке файла", severity: "error" });
        return;
      }
    } catch (err) {
      setNotification({ open: true, message: "Ошибка сети при загрузке", severity: "error" });
      return;
    }

    let sendResponse;
    if (sendMode === "chain") {
      try {
        const currentUserId = getCachedLogin();
  

        sendResponse = await sendDocumentsWithRetry({
          doc_id: upload.id,
          doc_name: name,
          doc_sign_required: true,
          doc_description: description,
          employee_ids: [currentUserId],
        });
  
        if (!sendResponse.ok) {
          throw new Error("Ошибка при отправке документа себе");
        }
  

        const chainMetadata = buildChainMetadata();
        const addChainRes = await API.addDocumentChain({
          document_id: upload.id,
          chain_metadata: chainMetadata,
        });
  
        if (!addChainRes.ok) {
          setNotification({
            open: true,
            message: "Ошибка при добавлении цепочки согласования",
            severity: "error",
          });
          return;
        }
      } catch (err) {
        console.error("Ошибка при отправке с цепочкой:", err);
        setNotification({ open: true, message: "Ошибка при отправке с цепочкой", severity: "error" });
        return;
      }
    } else {

      try {
        sendResponse = await sendDocumentsWithRetry({
          doc_id: upload.id,
          doc_name: name,
          doc_sign_required: needSignature,
          doc_description: description,
          employee_ids: receivers,
        });
      } catch (error) {
        setNotification({
          open: true,
          message: "Не удалось отправить документ",
          severity: "error",
        });
        return;
      }
    }
  

    if (resupload && sendResponse && resupload.ok && sendResponse.ok) {
      setNotification({ open: true, message: "Документ успешно отправлен", severity: "success" });
    } else {
      setNotification({ open: true, message: "Не удалось отправить документ", severity: "error" });
    }
  }
  



  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  return (
    <Box display="flex" overflow="hidden" height="100vh">
      <LeftPanel highlight="senddoc" />
      <Box flexGrow={1}>
        <TopPanel
          title="Отправка документов"
          profpic={info.photo_link}
          showfunctions={false}
          username={info.name}
        />
        <Box
  sx={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    gap: 0,
    mt: 2,
    mb: 4,
  }}
>
  {[
    { label: "С подписью", mode: "signed" },
    { label: "Без подписи", mode: "unsigned" },
    { label: "С цепочкой согласования", mode: "chain" },
  ].map(({ label, mode }, idx) => (
    <MUIButton
      key={mode}
      onClick={() => {
        setSendMode(mode);
        setNeedSignature(mode !== "unsigned");
        setNotification({ open: true, message: `Режим: ${label}`, severity: "info" });
      }}
      sx={{
        border: "1px solid #164f94",
        borderLeft: idx === 0 ? "1px solid #164f94" : "none", 
        borderRadius: idx === 0 ? "8px 0 0 8px" : idx === 2 ? "0 8px 8px 0" : "0",
        backgroundColor: sendMode === mode ? "#164f94" : "#fff",
        color: sendMode === mode ? "#fff" : "#164f94",
        fontWeight: "600",
        textTransform: "none",
        padding: "10px 16px",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          backgroundColor: sendMode === mode ? "#133d73" : "#f0f4ff",
        },
      }}
    >
      {label}
    </MUIButton>
  ))}
</Box>
        <MUIContainer maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Название"
                  variant="outlined"
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Описание"
                  variant="outlined"
                  multiline
                  rows={5}
                  sx={{ mt: 2 }}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MUIButton
                  variant="contained"
                  onClick={() => document_input.current.click()}
                  sx={{ mb: 2, backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
                >
                  Прикрепить документ
                </MUIButton>
                <Typography variant="body1">
                  {documentName ? documentName : "Файл не выбран"}
                </Typography>
                <input
                  type="file"
                  id="doc"
                  name="doc"
                  ref={document_input}
                  className="hidden"
                  onChange={readDoc}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={needSignature}
                      onChange={() => setNeedSignature(!needSignature)}
                      sx={{
                        color: '#164f94',
                        '&.Mui-checked': {
                          color: '#164f94',
                        },
                      }}
                    />
                  }
                  label="Требуется подпись сотрудников"
                  sx={{ mt: 2 }}
                />
                
  {sendMode === "chain" ? (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" mb={1}>Цепочка согласования:</Typography>
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
      <MUIButton
  variant="outlined"
  sx={{ mt: 2 }}
  onClick={() => {
    setChain(receivers); 
    setOpenChainModal(true); 

  }}
>
  {receivers.length === 0 ? "Создать цепочку" : "Изменить цепочку"}
</MUIButton>

    </Box>
  
) : (

  <FormControl fullWidth sx={{ mt: 2 }}>
    <InputLabel id="receivers-label">Получатели</InputLabel>
    <Select
      labelId="receivers-label"
      multiple
      value={receivers}
      onChange={handleChange}
      input={<OutlinedInput label="Получатели" />}
      MenuProps={{
        PaperProps: {
          style: {
            maxHeight: 300,
            overflowY: 'auto', 
          },
        },
      }}
      renderValue={(selected) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {selected.map((value) => (
            <Chip
              key={value}
              label={(() => {
                let thisemp = employees[value];
                return (
                  thisemp.surname +
                  " " +
                  thisemp.name +
                  " " +
                  optional(thisemp.patronymic)
                );
              })()}
            />
          ))}
        </Box>
      )}
    >
      {Object.values(employees).map((emp) => (
        <MenuItem key={emp.id} value={emp.id}>
          {emp.surname} {emp.name} {optional(emp.patronymic)}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
)}

{sendMode !== "chain" && (
  <MUIButton
    variant="contained"
    fullWidth
    onClick={(e) => {
      e.preventDefault();
      setReceivers(Object.values(employees).map((emp) => emp.id));
    }}
    sx={{ mt: 2, backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
  >
    Отправить всем
  </MUIButton>
)}

<MUIButton
  variant="contained"
  fullWidth
  onClick={(e) => send(e)}
  sx={{ mt: 2, backgroundColor: '#164f94', '&:hover': { backgroundColor: '#133d73' } }}
>
  Отправить
</MUIButton>

              </Grid>
            </Grid>
        </MUIContainer>
        <Dialog open={openChainModal} onClose={() => setOpenChainModal(false)} maxWidth="md" fullWidth>
  <Box p={3}>
    <Typography variant="h6" mb={2}>Настройка цепочки согласования</Typography>


    <Box sx={{ overflowX: 'auto', px: 1 }}>
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
        maxHeight: 300,
        overflowY: 'auto', 
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
        onClick={() => {
          setReceivers(chain);
          setOpenChainModal(false);
        }}
      >
        Сохранить
      </MUIButton>
    </Box>
  </Box>
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

export default SendDocument;