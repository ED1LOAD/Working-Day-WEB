import { Button, Col, Container, Row } from "react-bootstrap";
import optional from "../functions/optional";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import { useState } from "react";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function Document({ id, name, description, sign_required, signed: initialSigned, onForwardClick }) {
  const [signed, setSigned] = useState(initialSigned);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success");

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  async function download() {
    let url = await getJsonWithErrorHandlerFunc(
      (args) => API.downloadDocuments(args),
      [id]
    );
    window.open(url.url, "_blank");
  }

  async function sign() {
    let res = await API.signDocuments(id);
    if (res && res.ok) {
      setSigned(true);
      setMessage("Документ успешно подписан");
      setSeverity("success");
      setOpen(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setMessage("Не удалось подписать документ");
      setSeverity("error");
      setOpen(true);
    }
  }

  return (
    <Container className="document">
      <Row>
        <Col md={8} className="document-info-col">
          <p className="document-name">{name}</p>
          <pre className="document-description">{description}</pre>
          {optional(signed, <p className="document-signed">Документ подписан</p>)}
        </Col>
        <Col md={4} className="document-buttons-col">
          <Button className="document-button" onClick={download}>
            Просмотреть
          </Button>
          {optional(
            sign_required && !signed,
            <Button className="document-button" onClick={sign}>
              Подписать
            </Button>
          )}
          {optional(
            signed,
            <Button className="document-button" variant="success" onClick={() => onForwardClick({ id, name, description, signed })}>
              Отправить дальше
            </Button>
          )}
        </Col>
      </Row>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Document;
