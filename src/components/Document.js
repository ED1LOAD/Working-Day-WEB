import { Button, Col, Container, Row, Collapse } from "react-bootstrap";
import optional from "../functions/optional";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import { useState, useEffect } from "react";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SignFlow from "./SignFlow";
import getCachedLogin from "../functions/getCachedLogin";


function Document({ id, name, description, sign_required, signed: initialSigned, onForwardClick, chain_metadata, created_ts }) {
  const [signed, setSigned] = useState(initialSigned);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chainSigned, setChainSigned] = useState(false);
  const [canSign, setCanSign] = useState(false);
  const userId = getCachedLogin();
  const userInChain = chain_metadata?.find((item) => item.employee_id === userId && item.status === 0); 

  const isRejected = chain_metadata.some(item => item.status === 2);

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

  async function signDocument() {
    let res = await API.signDocuments(id);
    if (res?.ok) {
      setSigned(true);
      setMessage("Документ успешно подписан");
      setSeverity("success");
      setOpen(true);
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setMessage("Не удалось подписать документ");
      setSeverity("error");
      setOpen(true);
    }
  }

  useEffect(() => {
    async function fetchSignInfo() {
      if (!detailsOpen || !sign_required || signed) return;

      try {
        const res = await API.getSignsDocuments(id);
        const found = res.signs?.some(
          (sign) => sign.employee?.id === userId && sign.signed === false
        );
        setCanSign(found);
      } catch (e) {
        console.warn("⚠️ Ошибка при загрузке подписей", e);
      }
    }

    fetchSignInfo();
  }, [detailsOpen, sign_required, signed, id, userId]);

  async function updateChainStatus(status) {
    try {
      const res = await API.updateDocumentChain({
        document_id: id,
        approval_status: status,
      });

      if (res?.chain_metadata) {
        setChainSigned(true);
        setMessage("Решение по цепочке отправлено");
        setSeverity("success");
        setOpen(true);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error("Некорректный ответ от сервера");
      }
    } catch (err) {
      if (err?.status === 400) {
        setMessage("Вы не можете подписать документ сейчас — дождитесь своей очереди");
      } else {
        setMessage("Произошла ошибка при отправке решения по цепочке");
      }
      setSeverity("error");
      setOpen(true);
    }
  }

  function formatDateString(iso) {
    const date = new Date(iso);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Container className="document border rounded p-3 mb-3">
      <Row>
        <Col md={10} className="document-info-col">
          <p className="document-name">{name}</p>
          <p className="document-timestamp">
            Создан: {created_ts ? formatDateString(created_ts) : "—"}
          </p>
          {optional(signed, <p className="document-signed">Документ подписан</p>)}
        </Col>
        <Col md={2} className="d-flex align-items-start justify-content-end">
          <Button
            variant="secondary"
            className="document-button"
            onClick={() => setDetailsOpen(!detailsOpen)}
          >
            {detailsOpen ? "Скрыть детали" : "Просмотреть детали"}
          </Button>
        </Col>
      </Row>

      <Collapse in={detailsOpen} mountOnEnter>
        <div className="document-details-wrapper">
          <div className="document-details mt-3 p-3 border rounded bg-light">
            <h6>Описание документа:</h6>
            <pre className="document-description">{description}</pre>

            {chain_metadata?.length > 0 && (
              <>
                <h6 className="mt-4">Цепочка подписания:</h6>
                <SignFlow chainMetadata={chain_metadata} />
              </>
            )}

            <div className="document-actions">
              <Button className="action-button" variant="outline-primary" onClick={download}>
                Просмотреть
              </Button>

   
              {chain_metadata?.length === 0 && sign_required && !signed && !isRejected && (
                <Button className="action-button" variant="outline-success" onClick={signDocument}>
                  Подписать
                </Button>
              )}


              {userInChain && !chainSigned && !isRejected && (
                <>
                  {userInChain.requires_signature ? (
                    <>
                      <Button className="action-button" variant="outline-success" onClick={() => updateChainStatus(0)}>
                        Подписать
                      </Button>
                      <Button className="action-button" variant="outline-danger" onClick={() => updateChainStatus(2)}>
                        Отклонить
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="action-button" variant="outline-success" onClick={() => updateChainStatus(1)}>
                        Одобрить
                      </Button>
                      <Button className="action-button" variant="outline-danger" onClick={() => updateChainStatus(2)}>
                        Отклонить
                      </Button>
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </Collapse>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Document;

