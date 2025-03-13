import { Drawer } from "@mui/material";
import Config from "../../config/UserPageConfig";
import IconRender from "../IconRender/IconRender";
import optional from "../../functions/optional";
import getCachedRole from "../../functions/getCachedRole";
import { Link } from "react-router-dom";
import "../../styles/leftpanel.css";

function LeftPanel({ highlight }) {
  const userRole = getCachedRole();
  
  return (
    <Drawer
      className="left-panel"
      sx={{
        width: Config.leftPanelWidth,
        "& .MuiDrawer-paper": {
          width: Config.leftPanelWidth,
          zIndex: 2,
          backgroundColor: "inherit",
          paddingTop: "inherit",
          alignItems: "inherit",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Link className={`left-panel-link ${highlight === "user" ? "highlight" : ""}`} to="/user/me">
        <IconRender className="left-panel-icon" path="/images/icons/user.svg" iwidth="24px" iheight="24px" />
        <p className="left-panel-label">Профиль</p>
      </Link>
      <Link className={`left-panel-link ${highlight === "search" ? "highlight" : ""}`} to="/search">
        <IconRender className="left-panel-icon" path="/images/icons/users.svg" iwidth="24px" iheight="24px" />
        <p className="left-panel-label">Сотрудники</p>
      </Link>
      <Link className={`left-panel-link ${highlight === "notifications" ? "highlight" : ""}`} to="/notifications">
        <IconRender className="left-panel-icon" path="/images/icons/bell.svg" iwidth="24px" iheight="24px" />
        <p className="left-panel-label">Уведомления</p>
      </Link>
      <Link className={`left-panel-link ${highlight === "viewdoc" ? "highlight" : ""}`} to="/documents">
        <IconRender className="left-panel-icon" path="/images/icons/document.svg" iwidth="24px" iheight="24px" />
        <p className="left-panel-label">Мои документы</p>
      </Link>
      {optional(
        userRole === "manager",
        <Link className={`left-panel-link ${highlight === "attendance" ? "highlight" : ""}`} to="/attendance">
          <IconRender className="left-panel-icon" path="/images/icons/clock.svg" iwidth="24px" iheight="24px" />
          <p className="left-panel-label">Табель</p>
        </Link>
      )}
      {optional(
        userRole === "admin" || userRole === "manager",
        <Link className={`left-panel-link ${highlight === "viewattendance" ? "highlight" : ""}`} to="/attendance/view">
          <IconRender className="left-panel-icon" path="/images/icons/table.svg" iwidth="24px" iheight="24px" />
          <p className="left-panel-label">Рабочее время</p>
        </Link>
      )}
      {optional(
        userRole === "admin",
        <Link className={`left-panel-link ${highlight === "senddoc" ? "highlight" : ""}`} to="/documents/send">
          <IconRender className="left-panel-icon" path="/images/icons/send.svg" iwidth="24px" iheight="24px" />
          <p className="left-panel-label">Отправить документ</p>
        </Link>
      )}
      <Link className={`left-panel-link ${highlight === "calendar" ? "highlight" : ""}`} to="/calendar">
        <IconRender className="left-panel-icon" path="/images/icons/calendar-day.svg" iwidth="24px" iheight="24px" />
        <p className="left-panel-label">Календарь</p>
      </Link>
      <Link className={`left-panel-link ${highlight === "absenserequest" ? "highlight" : ""}`} to="/absense/request">
        <IconRender className="left-panel-icon" path="/images/icons/vacation.svg" iwidth="24px" iheight="24px" />
        <p className="left-panel-label">Запросы</p>
      </Link>
      {optional(
        userRole === "admin",
        <Link className={`left-panel-link ${highlight === "docreport" ? "highlight" : ""}`} to="/documents/report">
          <IconRender className="left-panel-icon" path="/images/icons/resume.svg" iwidth="24px" iheight="24px" />
          <p className="left-panel-label">Отчет по документам</p>
        </Link>
      )}
    </Drawer>
  );
}

export default LeftPanel;
