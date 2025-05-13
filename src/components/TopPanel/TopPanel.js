import React, { useState, useEffect, useRef } from "react";
import { Drawer, Button as MUIButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { Button, Image, Card, Form, InputGroup } from "react-bootstrap";
import Config from "../../config/UserPageConfig";
import "../../styles/toppanel.css";
import BellIcon from "./BellIcon";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Link, useNavigate } from "react-router-dom";
import API from "../../network/API";
import Draggable from "react-draggable"; 
import optional from "../../functions/optional";

function TopPanel({ profpic, title = "Мой профиль", showfunctions = true, username }) {
  let height = showfunctions ? 164 : 128;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openChatBot, setOpenChatBot] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  function logout() {
    API.logout();
    navigate("/login");
  }

  useEffect(() => {
    document.getElementById("tp-drawer").style.height =
      document.getElementById("top-panel-all").offsetHeight.toString() + "px";
  }, []);

  const handleStartChat = () => {
    setChatStarted(true);
    setMessages([
      { from: "bot", text: "Привет! Я чат-бот поддержки. Чем могу помочь?" }
    ]);
  };

  const handleSendMessage = () => {
    if (input.trim() === "") return;

    setMessages((prev) => [
      ...prev,
      { from: "user", text: input },
      { from: "bot", text: "Спасибо за сообщение! Мы свяжемся с вами скоро." }
    ]);
    setInput("");
  };

  const handleEnterPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  

  return (
    <>
      <Drawer
        id="tp-drawer"
        sx={{
          "& .MuiDrawer-paper": {
            zIndex: 1,
          },
        }}
        variant="permanent"
        anchor="top"
      >
        <div id="top-panel-all" className="top-panel-all" style={{ marginLeft: Config.leftPanelWidth }}>
          <div className="top-panel-content">
            <p className="top-panel-title">{title}</p>
            <div className="top-panel-controls">
              <Link to="/notifications">
                <BellIcon />
              </Link>
              {optional(
                profpic,
                <Image className="top-panel-profpic" src={profpic} width={40} height={40} roundedCircle />
              )}
              <Link to="/user/me" className="top-panel-mp-link">
                {username ? username : "Мой профиль"}
              </Link>

              <Button
                variant="outline-primary"
                onClick={() => setOpen(true)}
                className="support-button"
              >
                <span className="icon-wrapper"><HelpOutlineIcon /></span>
                Поддержка
              </Button>

              <Button
                variant="outline-primary"
                onClick={logout}
                style={{
                  borderColor: "#EA1515",
                  color: "#EA1515",
                  marginLeft: "10px",
                  transition: "all 0.3s ease-in-out",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#EA1515";
                  e.target.style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#fff";
                  e.target.style.color = "#EA1515";
                }}
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </Drawer>


      <Dialog open={open} onClose={() => setOpen(false)} sx={{ "& .MuiDialog-paper": { borderRadius: "15px", padding: "20px" } }}>
        <DialogTitle>Поддержка</DialogTitle>
        <DialogContent>
          <DialogContentText>Выберите способ связи:</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outline-primary"
            onClick={() => window.open("https://t.me/working_day_support", "_blank", "noopener noreferrer")}
            className="support-button"
          >
            Написать в Телеграм
          </Button>

          <Button
            variant="outline-primary"
            onClick={() => navigate("/select-email-client")}
            className="support-button"
          >
            Написать на почту
          </Button>

          <Button
            variant="outline-primary"
            onClick={() => {
              setOpen(false);
              setOpenChatBot(true); 
              setChatStarted(false); 
            }}
            className="support-button"
          >
            Открыть чат-бота
          </Button>

          <MUIButton onClick={() => setOpen(false)} style={{ color: "#EA1515" }}>
            Закрыть
          </MUIButton>
        </DialogActions>
      </Dialog>


{openChatBot && (
  <Card
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "380px",
      height: "500px",
      borderRadius: "20px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999,
      overflow: "hidden",
      backgroundColor: "#f4f6f8",
    }}
  >

    <div style={{
      padding: "12px 16px",
      backgroundColor: "#164f94",
      color: "#fff",
      borderTopLeftRadius: "20px",
      borderTopRightRadius: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontWeight: "600",
      fontSize: "18px",
    }}>
      Чат-бот
      <MUIButton variant="text" onClick={() => setOpenChatBot(false)} style={{ color: "#fff" }}>
        ✕
      </MUIButton>
    </div>


<div style={{
  flexGrow: 1,
  padding: "15px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  backgroundColor: "#f4f6f8",
  scrollbarWidth: "thin",
}}>
  {chatStarted ? (
    <>
      {messages.map((msg, idx) => (
  <div
    key={idx}
    style={{
      display: "flex",
      justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
    }}
  >
    <div
      style={{
        background: msg.from === "user" ? "#164f94" : "#e5e5ea",
        color: msg.from === "user" ? "#fff" : "#000",
        borderRadius: "18px",
        borderBottomRightRadius: msg.from === "user" ? "4px" : "18px",
        borderBottomLeftRadius: msg.from === "user" ? "18px" : "4px",
        padding: "8px 12px",
        fontSize: "14px",
        maxWidth: "75%",
        wordBreak: "break-word",
        position: "relative",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      {msg.text}
    </div>
  </div>
))}

      <div ref={messagesEndRef} /> 
    </>
  ) : (
   <div style={{
  textAlign: "center",
  marginTop: "50px",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "15px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  margin: "auto",
}}>
  <h5 style={{ marginBottom: "15px", color: "#164f94" }}>
    👋 Добро пожаловать!
  </h5>
  <p style={{ fontSize: "14px", color: "#555", marginBottom: "20px" }}>
    Я — ваш умный помощник!<br />
    Помогу быстро разобраться в возможностях приложения и отвечу на ваши вопросы.
  </p>
  <Button
    variant="contained"
    onClick={handleStartChat}
    sx={{
      backgroundColor: "#164f94",
      "&:hover": { backgroundColor: "#133d73" },
      borderRadius: "20px",
      padding: "10px 20px",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "none",
    }}
  >
    Начать общение
  </Button>
</div>

  )}
</div>


    {chatStarted && (
      <div style={{
        padding: "10px",
        borderTop: "1px solid #ccc",
        background: "#fff",
      }}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleEnterPress}
            style={{
              borderRadius: "20px",
              backgroundColor: "#f4f6f8",
              border: "1px solid #ccc",
              paddingLeft: "15px",
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            sx={{
              marginLeft: "8px",
              backgroundColor: "#164f94",
              "&:hover": { backgroundColor: "#133d73" },
              borderRadius: "20px",
              padding: "10px",
              minWidth: "50px",
            }}
          >
            ➤
          </Button>
        </InputGroup>
      </div>
    )}
  </Card>
)}

    </>
  );
}

export default TopPanel;
