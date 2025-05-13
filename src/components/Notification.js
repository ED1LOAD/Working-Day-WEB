import { useState } from "react";
import { Button as MUIButton, Container, Grid, Box, Typography, Avatar, Paper } from "@mui/material";
import optional from "../functions/optional";
import API from "../network/API";
import "../styles/notifications.css";

function Notification({ id, sender, text, type, action_id, created }) {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [buttonText, setButtonText] = useState({ approve: "Согласовать", reject: "Отклонить" });
  const [selectedButton, setSelectedButton] = useState(null);

  async function send_verdict(approve) {
    setIsButtonDisabled(true);
    setButtonText(approve ? { ...buttonText, approve: "Согласовано" } : { ...buttonText, reject: "Отклонено" });
    setSelectedButton(approve ? "approve" : "reject");

    let res = await API.verdictAbsence({
      action_id: action_id,
      notification_id: id,
      approve: approve,
    });
    if (res && res.ok) {
      alert("Решение об отпуске принято");
    } else {
      alert("Не удалось отправить решение об отпуске");
      setIsButtonDisabled(false); 
      setButtonText({ approve: "Согласовать", reject: "Отклонить" }); 
      setSelectedButton(null);
    }
  }

  const senderName = sender ? `${sender.name} ${sender.surname} ${optional(sender.patronymic)}` : "Система";
  const senderPhoto = sender && sender.photo_link ? sender.photo_link : "/default-avatar.png"; 

  return (
    <Paper elevation={3} className="notification">
      <Grid container spacing={2}>
        <Grid item>
          {/* Отображаем аватар отправителя или дефолтный */}
          <Avatar src={senderPhoto} alt={senderName} />
        </Grid>
        <Grid item xs={8}>
          <Typography variant="subtitle1" className="notif-sender">
            {senderName}
          </Typography>
          <Typography variant="body2" className="notif-text">
            {text}
          </Typography>
          {type === "vacation_request" && (
            <Box mt={2}>
              <MUIButton
                variant="contained"
                sx={{
                  mr: 1,
                  backgroundColor: '#229320',
                  '&:hover': { backgroundColor: '#1B6F1A' },
                  ...(selectedButton === "approve" && {
                    border: '2px solid #229320',
                    color: '#229320',
                    backgroundColor: '#fff',
                  }),
                }}
                onClick={() => send_verdict(true)}
                disabled={isButtonDisabled}
              >
                {buttonText.approve}
              </MUIButton>
              <MUIButton
                variant="contained"
                sx={{
                  mr: 1,
                  backgroundColor: '#D32F2F',
                  '&:hover': { backgroundColor: '#B71C1C' },
                  ...(selectedButton === "reject" && {
                    border: '2px solid #D32F2F',
                    color: '#D32F2F',
                    backgroundColor: '#fff',
                  }),
                }}
                onClick={() => send_verdict(false)}
                disabled={isButtonDisabled}
              >
                {buttonText.reject}
              </MUIButton>
            </Box>
          )}
        </Grid>
        <Grid item xs={2}>
          <Typography variant="body2" className="notif-datetime">
            {new Date(created).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" className="notif-datetime">
            {new Date(created).toLocaleTimeString()}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default Notification;
