import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UserPage from "./pages/UserPage";
import UserEditPage from "./pages/UserEditPage";
import Notifications from "./pages/Notifications";
import MyPage from "./pages/MyPage";
import MyEditPage from "./pages/MyEditPage";
import SearchEmployee from "./pages/SearchEmployee";
import AttendanceTable from "./pages/AttendanceTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AttendanceView from "./pages/AttendanceView";
import SendDocument from "./pages/SendDocument";
import ViewDocuments from "./pages/ViewDocuments";
import Calendar from "./pages/Calendar";
import ReportDocuments from "./pages/ReportDocuments";
import { ThemeProvider, createTheme } from "@mui/material";
import { useEffect } from "react";
import UserAdd from "./pages/UserAdd";
import AbsenseRequest from "./pages/AbsenseRequest";
import ExcelReader from "./pages/ExcelReader"; 
import EmailClientSelector from "./components/TopPanel/EmailClientSelector"; 

function App() {
  useEffect(() => {
    document.title = "Рабочий День";
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/user/me" element={<MyPage />} />
          <Route path="/user/me/edit" element={<MyEditPage />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route path="/user/:id/edit" element={<UserEditPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<SearchEmployee />} />
          <Route path="/attendance" element={<AttendanceTable />} />
          <Route path="/attendance/view" element={<AttendanceView />} />
          <Route path="/documents/send" element={<SendDocument />} />
          <Route path="/documents" element={<ViewDocuments />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/documents/report" element={<ReportDocuments />} />
          <Route path="/user/add" element={<UserAdd />} />
          <Route path="/absense/request" element={<AbsenseRequest />} />
          <Route path="/excel" element={<ExcelReader />} />
          <Route path="/select-email-client" element={<EmailClientSelector />} /> {/* Add the new route */}
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;
