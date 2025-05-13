import { ButtonBase, Tooltip, Typography, Paper } from "@mui/material";
import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import "../styles/reportdocuments.css";
import IconRender from "../components/IconRender/IconRender";
import useAsync from "../functions/hooks/useAsync";
import API from "../network/API";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import sortSignTooltipData from "../functions/sortSignTooltipData";
import { Link } from "react-router-dom";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import getCachedLogin from "../functions/getCachedLogin";

async function download(doc) {
  let url = await getJsonWithErrorHandlerFunc(
    (args) => API.downloadDocuments(args),
    [doc.id]
  );
  window.open(url.url, "_blank");
}

function ReportDocuments() {
  const [docData, setDocData] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setDocData, [
    (args) => API.listAllDocuments(args),
    [],
  ]);

  const [signTooltipOpen, setSignTooltipOpen] = useState({});
  const [signTooltipData, setSignTooltipData] = useState({});
  const [ueran, setUeran] = useState(false);

  useEffect(() => {
    if (!docData) {
      return;
    }
    let nsto = {};
    let nstd = {};
    docData.documents.forEach((doc) => {
      nsto[doc.id] = false;
      nstd[doc.id] = null;
    });
    setSignTooltipOpen(nsto);
    setUeran(true);
  }, [docData]);

  const [info, setInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [getCachedLogin()],
  ]);

  const handleTooltipToggle = async (doc) => {
    if (!signTooltipData[doc.id]) {
      let nstd = { ...signTooltipData };
      const response = await getJsonWithErrorHandlerFunc(
        (args) => API.getSignsDocuments(args),
        [doc.id]
      );
      
      console.log("Ответ от бэка на getSignsDocuments для документа:", doc.id);
      console.log(response); 
      
      nstd[doc.id] = response.signs;
      setSignTooltipData(nstd);
      console.log(
        "Подписанты для документа:", doc.id,
        response.signs.map(sign => ({
          employee_id: sign.employee.id,
          name: sign.employee.surname + " " + sign.employee.name,
          signed: sign.signed,
          document_id: sign.document_id
        }))
      );
      
    }
    
    let nsto = { ...signTooltipOpen };
    nsto[doc.id] = !nsto[doc.id];
    setSignTooltipOpen(nsto);
  };
  

  return !info || !docData || !ueran ? null : (
    <div style={{ display: "flex" }}>
      <LeftPanel highlight="docreport" />
      <div>
        <TopPanel
          title="Отчет по документам"
          profpic={info.photo_link}
          showfunctions={false}
          username={info.name}
        />
          <Row>
            <Col>
              <div className="report-doc-sent-area">
              <Typography variant="h4" style={{textAlign: 'center' }}>Отправленные сотрудникам</Typography>
                {docData.documents.map((doc) =>
                  doc.type === "admin_request" ? (
                    <Paper elevation={3} key={doc.id} style={{ margin: "20px 0", padding: "20px" }}>
                      <form>
                        <Row className="report-doc-sent-doc">
                          <Col className="report-doc-info-col">
                            <Typography variant="body1" className="report-doc-name">
                              {doc.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              className="report-doc-preformat"
                              
                            >
                              {doc.description}
                            </Typography>
                          </Col>
                          <Col className="report-doc-button-col">
                            <Button
                              className="report-doc-button"
                              onClick={() => download(doc)}
                            >
                              Прочитать
                            </Button>
                            {doc.sign_required && (
                              <Tooltip
                                interactive
                                PopperProps={{}}
                                onClose={() => {
                                  let nsto = { ...signTooltipOpen };
                                  nsto[doc.id] = false;
                                  setSignTooltipOpen(nsto);
                                }}
                                open={signTooltipOpen[doc.id]}
                                disableFocusListener
                                disableHoverListener
                                disableTouchListener
                                title={
                                  <Container>
                                    {signTooltipData[doc.id]
                                      ? sortSignTooltipData(
                                          signTooltipData[doc.id]
                                        ).map((sign) => (
                                        
                                          
                                          <Row
                                          className={
                                            sign.signed
                                              ? "report-doc-employee-signed"
                                              : "report-doc-employee-unsigned"
                                          }
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 16px",
                                            borderRadius: "12px",
                                            marginBottom: "10px",
                                            backgroundColor: sign.signed ? "#f0fdf4" : "#fff1f0", // более мягкие тона
                                            border: `1px solid ${sign.signed ? "#a7f3d0" : "#ffccc7"}`, // лёгкая обводка
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)", // лёгкая тень
                                            transition: "background-color 0.3s, box-shadow 0.3s", // плавные эффекты
                                          }}
                                        >
                                          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                            <Link
                                              to={`/user/${sign.employee.id}`}
                                              className="report-doc-user-link"
                                              style={{
                                                color: "#1e88e5",
                                                textDecoration: "none",
                                                fontWeight: 600,
                                                fontSize: "15px",
                                                marginBottom: "6px",
                                                transition: "color 0.2s",
                                              }}
                                              onMouseOver={(e) => (e.target.style.color = "#1565c0")}
                                              onMouseOut={(e) => (e.target.style.color = "#1e88e5")}
                                            >
                                              {sign.employee.surname + " " + sign.employee.name}
                                            </Link>
                                        
                                            {sign.document_id ? (
                                              <ButtonBase
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  download({ id: sign.document_id });
                                                }}
                                                style={{
                                                  alignSelf: "flex-start",
                                                  padding: "0",
                                                  marginTop: "2px",
                                                  background: "none",
                                                  color: "#0288d1",
                                                  fontSize: "13px",
                                                  textTransform: "none",
                                                  textDecoration: "underline",
                                                  cursor: "pointer",
                                                  transition: "color 0.2s",
                                                }}
                                                onMouseOver={(e) => (e.target.style.color = "#01579b")}
                                                onMouseOut={(e) => (e.target.style.color = "#0288d1")}
                                              >
                                                Скачать документ
                                              </ButtonBase>
                                            ) : (
                                              <Typography variant="caption" style={{ fontSize: "12px", color: "#9e9e9e" }}>
                                                Документ не прикреплён
                                              </Typography>
                                            )}
                                          </div>
                                        
                                          {/* <IconRender
                                            path={
                                              sign.signed
                                                ? "/images/icons/tick.svg"
                                                : "/images/icons/cross.svg"
                                            }
                                            width="24px"
                                            height="24px"
                                            iwidth="24px"
                                            iheight="24px"
                                          /> */}
                                        </Row>
                                        

                                         
                                        ))
                                      : null}
                                  </Container>
                                }
                              >
                                <Button
                                  className="report-doc-button"
                                  onClick={() => handleTooltipToggle(doc)}
                                >
                                  Кто подписал?
                                </Button>
                              </Tooltip>
                            )}
                          </Col>
                        </Row>
                      </form>
                    </Paper>
                  ) : null
                )}
              </div>
            </Col>

            <Col>
              <div className="report-doc-sent-area">
              <Typography variant="h4" style={{textAlign: 'center' }}>Запросы от сотрудников</Typography>
                {docData.documents.map((doc) =>
                  doc.type === "employee_request" ? (
                    <Paper elevation={3} key={doc.id} style={{ margin: "20px 0", padding: "20px" }}>
                      <form>
                        <Row className="report-doc-sent-doc">
                          <Col className="report-doc-info-col">
                            <Typography variant="body1" className="report-doc-name">
                              {doc.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              className="report-doc-preformat"
                            >
                              {doc.description}
                            </Typography>
                          </Col>
                          <Col className="report-doc-button-col">
                            <Button
                              className="report-doc-button"
                              onClick={() => download(doc)}
                            >
                              Прочитать
                            </Button>
                            {doc.sign_required && (
                              <Tooltip
                                interactive
                                PopperProps={{}}
                                onClose={() => {
                                  let nsto = { ...signTooltipOpen };
                                  nsto[doc.id] = false;
                                  setSignTooltipOpen(nsto);
                                }}
                                open={signTooltipOpen[doc.id]}
                                disableFocusListener
                                disableHoverListener
                                disableTouchListener
                                title={
                                  <Container>
                                    {signTooltipData[doc.id]
                                      ? sortSignTooltipData(
                                          signTooltipData[doc.id]
                                        ).map((sign) => (
                                          
                                          <Row
                                          className={
                                            sign.signed
                                              ? "report-doc-employee-signed"
                                              : "report-doc-employee-unsigned"
                                          }
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 16px",
                                            borderRadius: "12px",
                                            marginBottom: "10px",
                                            backgroundColor: sign.signed ? "#f0fdf4" : "#fff1f0", // более мягкие тона
                                            border: `1px solid ${sign.signed ? "#a7f3d0" : "#ffccc7"}`, // лёгкая обводка
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)", // лёгкая тень
                                            transition: "background-color 0.3s, box-shadow 0.3s", // плавные эффекты
                                          }}
                                        >
                                          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                            <Link
                                              to={`/user/${sign.employee.id}`}
                                              className="report-doc-user-link"
                                              style={{
                                                color: "#1e88e5",
                                                textDecoration: "none",
                                                fontWeight: 600,
                                                fontSize: "15px",
                                                marginBottom: "6px",
                                                transition: "color 0.2s",
                                              }}
                                              onMouseOver={(e) => (e.target.style.color = "#1565c0")}
                                              onMouseOut={(e) => (e.target.style.color = "#1e88e5")}
                                            >
                                              {sign.employee.surname + " " + sign.employee.name}
                                            </Link>
                                        
                                            {sign.document_id ? (
                                              <ButtonBase
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  download({ id: sign.document_id });
                                                }}
                                                style={{
                                                  alignSelf: "flex-start",
                                                  padding: "0",
                                                  marginTop: "2px",
                                                  background: "none",
                                                  color: "#0288d1",
                                                  fontSize: "13px",
                                                  textTransform: "none",
                                                  textDecoration: "underline",
                                                  cursor: "pointer",
                                                  transition: "color 0.2s",
                                                }}
                                                onMouseOver={(e) => (e.target.style.color = "#01579b")}
                                                onMouseOut={(e) => (e.target.style.color = "#0288d1")}
                                              >
                                                Скачать документ
                                              </ButtonBase>
                                            ) : (
                                              <Typography variant="caption" style={{ fontSize: "12px", color: "#9e9e9e" }}>
                                                Документ не прикреплён
                                              </Typography>
                                            )}
                                          </div>
                                        
                                          {/* <IconRender
                                            path={
                                              sign.signed
                                                ? "/images/icons/tick.svg"
                                                : "/images/icons/cross.svg"
                                            }
                                            width="24px"
                                            height="24px"
                                            iwidth="24px"
                                            iheight="24px"
                                          /> */}
                                        </Row>
                                         
                                        ))
                                      : null}
                                  </Container>
                                }
                              >
                                <Button
                                  className="report-doc-button"
                                  onClick={() => handleTooltipToggle(doc)}
                                >
                                  Кто подписал?
                                </Button>
                              </Tooltip>
                            )}
                          </Col>
                        </Row>
                      </form>
                    </Paper>
                  ) : null
                )}
              </div>
            </Col>
          </Row>
        </div>
      </div>
  );
}

export default ReportDocuments;
