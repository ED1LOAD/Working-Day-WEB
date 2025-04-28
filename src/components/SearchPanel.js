import React, { useState, useEffect } from "react";
import {
  Drawer,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button as MUIButton,
  Popper,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ClickAwayListener,
  Avatar,
} from "@mui/material";
import { Button, Container, Form, Image, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BellIcon from "./TopPanel/BellIcon";
import IconRender from "./IconRender/IconRender";
import Config from "../config/UserPageConfig";
import API from "../network/API";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import optional from "../functions/optional";
import useAsync from "../functions/hooks/useAsync";
import getCachedLogin from "../functions/getCachedLogin";
import getCachedRole from "../functions/getCachedRole";

function SearchPanel({ setOuterRequest, searchFunc }) {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [getCachedLogin()],
  ]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEmailModalOpen = () => {
    navigate("/select-email-client");
  };

  function logout() {
    API.logout();
    navigate("/login");
  }

  useEffect(() => {
    if (!info) return;
    document.getElementById("sp-drawer").style.height =
      document.getElementById("search-panel-all").offsetHeight.toString() + "px";
  }, [info]);

  const [request, setRequest] = useState("");
  const [suggest, setSuggest] = useState({ employees: [] });
  const [anchorEl, setAnchorEl] = useState(null);

  useAsync(
    getJsonWithErrorHandlerFunc,
    setSuggest,
    [(args) => API.suggestSearch(args), [{ search_key: request, limit: 5 }]],
    [request]
  );

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchFunc(e);
      setAnchorEl(null);
    }
  };

  const handleInputChange = (e) => {
    setRequest(e.target.value);
    setOuterRequest(e.target.value);
    setAnchorEl(e.currentTarget);
  };

  const handleClickAway = () => {
    setAnchorEl(null);
  };

  const buttonStyle = {
    borderColor: "#164f94",
    color: "#164f94",
    marginLeft: "10px",
    display: "flex",
    alignItems: "center",
    transition: "all 0.3s ease-in-out",
    ...(buttonHovered && { backgroundColor: "#164f94", color: "#fff" }),
  };

  const iconWrapperStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "5px",
    color: buttonHovered ? "#fff" : "#164f94",
  };

  return !info ? null : (
    <>
      <Drawer
        id="sp-drawer"
        sx={{
          "& .MuiDrawer-paper": {
            zIndex: 1,
            borderBottom: 0,
          },
        }}
        variant="permanent"
        anchor="top"
      >
        <div
          id="search-panel-all"
          style={{ marginLeft: Config.leftPanelWidth }}
        >
          <div className="search-content">
            <Form onSubmit={(e) => e.preventDefault()}>
              <div className="overlay-container-search" style={{ position: "relative" }}>
                <Form.Control
                  className="overlay-bgimage-search search-field"
                  type="text"
                  placeholder="Поиск коллег"
                  value={request}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  className="overlay-fgimage-search search-button modern-search-button"
                  onClick={(e) => {
                    searchFunc(e);
                    setAnchorEl(null);
                  }}
                >
                  <IconRender
                    path="/images/icons/search.svg"
                    width="16px"
                    height="16px"
                    iwidth="16px"
                    iheight="16px"
                    addstyle={{ display: "flex" }}
                  />
                </Button>

                <Popper
  open={Boolean(request) && suggest.employees.length > 0}
  anchorEl={anchorEl}
  placement="bottom-start"
  style={{ zIndex: 2, width: anchorEl?.offsetWidth }}
>
  <ClickAwayListener onClickAway={handleClickAway}>
    <Paper elevation={3} sx={{ maxHeight: 250, overflowY: 'auto' }}>
      <List>
        {suggest.employees.map((emp) => (
          <ListItemButton
            key={emp.id}
            component={Link}
            to={`/user/${emp.id}`}
            onClick={() => setAnchorEl(null)}
          >
            <Avatar
              src={emp.photo_link || undefined}
              sx={{ width: 32, height: 32, marginRight: 1 }}
            >
              {!emp.photo_link && (emp.surname ? emp.surname[0] : "?")}
            </Avatar>
            <ListItemText
              primary={`${emp.surname} ${emp.name} ${optional(emp.patronymic)}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  </ClickAwayListener>
</Popper>
              </div>
            </Form>

            {optional(
              getCachedRole() === "admin",
              <Button
                onClick={() => navigate("/user/add")}
                className="add-employee-button"
                style={{ marginLeft: '10px' }}
              >
                Добавить сотрудника
              </Button>
            )}

            <div className="search-controls">
              <BellIcon />
              {optional(
                info.photo_link,
                <Image
                  className="top-panel-profpic"
                  src={info.photo_link}
                  width={40}
                  height={40}
                  roundedCircle
                />
              )}
              <Link to="/user/me" className="top-panel-mp-link">
                {info.name}
              </Link>
              <Button
                variant="outline-primary"
                onClick={handleClickOpen}
                style={buttonStyle}
                onMouseOver={() => setButtonHovered(true)}
                onMouseOut={() => setButtonHovered(false)}
              >
                <span style={iconWrapperStyle}><HelpOutlineIcon /></span>
                Поддержка
              </Button>
              <Button
                variant="outline-danger"
                onClick={logout}
                style={{ marginLeft: "10px" }}
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      <Dialog
        open={open}
        onClose={handleClose}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "15px",
            padding: "20px",
          },
        }}
        TransitionProps={{
          onEntering: (node) => {
            node.style.transition = "all 0.3s ease-in-out";
            node.style.opacity = 0;
            node.style.transform = "scale(0.9)";
          },
          onEntered: (node) => {
            node.style.opacity = 1;
            node.style.transform = "scale(1)";
          },
          onExiting: (node) => {
            node.style.transition = "all 0.3s ease-in-out";
            node.style.opacity = 1;
            node.style.transform = "scale(1)";
          },
          onExited: (node) => {
            node.style.opacity = 0;
            node.style.transform = "scale(0.9)";
          },
        }}
      >
        <DialogTitle>Поддержка</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Выберите способ связи:
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outline-primary"
            onClick={() => window.open("https://t.me/working_day_support", "_blank", "noopener noreferrer")}
            style={{
              borderColor: "#164f94",
              color: "#164f94",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#164f94";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#fff";
              e.target.style.color = "#164f94";
            }}
          >
            Написать в Телеграм
          </Button>
          <Button
            variant="outline-primary"
            onClick={handleEmailModalOpen}
            style={{
              borderColor: "#164f94",
              color: "#164f94",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#164f94";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#fff";
              e.target.style.color = "#164f94";
            }}
          >
            Написать на почту
          </Button>
          <MUIButton onClick={handleClose} style={{ color: "#EA1515" }}>
            Закрыть
          </MUIButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SearchPanel;
