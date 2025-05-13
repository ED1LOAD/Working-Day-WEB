import { useEffect, useState } from "react";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import { Drawer } from "@mui/material";
import Config from "../config/UserPageConfig";
import BellIcon from "../components/TopPanel/BellIcon";
import AngleDownIcon from "../components/TopPanel/AngleDownIcon";
import Function from "../components/TopPanel/Function";
import UserIcon from "../components/TopPanel/UserIcon";
import UnlockIcon from "../components/TopPanel/UnlockIcon";
import MoneyIcon from "../components/TopPanel/MoneyIcon";
import optional from "../functions/optional";
import { Button, Container, Form, Image, Row } from "react-bootstrap";
import { Typography, Grid, Paper, Avatar, Box, Fade } from "@mui/material";
import "../styles/overlay_search.css";
import "../styles/search.css";
import getCachedLogin from "../functions/getCachedLogin";
import { Link, useNavigate } from "react-router-dom";
import IconRender from "../components/IconRender/IconRender";
import SearchPanel from "../components/SearchPanel";

function SearchEmployee() {
  const [res, setRes] = useState([]);
  const [info, setInfo] = useState(null);
  const [myEmployees, setMyEmployees] = useState([]);

  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [getCachedLogin()],
  ]);

  const [request, setRequest] = useState("");

  const navigate = useNavigate();

  function logout() {
    API.logout();
    navigate("/login");
  }

  async function searchFunc(e) {
    e.preventDefault();
    let r = await getJsonWithErrorHandlerFunc(
      (args) => API.fullSearch(args),
      [{ search_key: request }]
    );
    if (r) {
      setRes(r.employees);
    }
  }


  useEffect(() => {
    async function fetchMyEmployees() {
      try {
        const response = await getJsonWithErrorHandlerFunc(
          (args) => API.getEmployees(args),
          []
        );
        if (response && response.employees) {
          console.log("Мои сотрудники:", response.employees); 
          setMyEmployees(response.employees);
        } else {
          console.log("Нет сотрудников или ошибка в ответе.");
        }
      } catch (error) {
        console.error("Ошибка при получении сотрудников:", error);
      }
    }
    fetchMyEmployees();
  }, []);

  return !info ? null : (
    <Box display="flex" overflow="hidden" width="100vw" minHeight="100vh">
      <LeftPanel highlight="search" />
      <Box flexGrow={1} bgcolor="#ffffff" minHeight="100vh">
        <SearchPanel setOuterRequest={setRequest} searchFunc={searchFunc} />

        <Box px={4} py={3}>


          {/* {res.length > 0 ? (
            <Grid container spacing={4} justifyContent="center">
              {res.map((user) => (
                <Grid item key={user.id} xs={12} sm={6} md={4} lg={2}>
                  <Fade in timeout={500}>
                    <Paper
                      elevation={3}
                      sx={{
                        padding: 2,
                        textAlign: "center",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minHeight: 250,
                        transition: "all 0.3s",
                        '&:hover': {
                          transform: "scale(1.03)",
                          boxShadow: 6,
                        }
                      }}
                    >
                      <Link to={`/user/${user.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <Avatar
                          src={user.photo_link || "/images/default-avatar.png"}
                          alt={`${user.surname} ${user.name}`}
                          sx={{ width: 100, height: 100, mb: 2 }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {user.surname}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {user.name}
                        </Typography>
                        {user.patronymic && (
                          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                            {user.patronymic}
                          </Typography>
                        )}
                      </Link>
                    </Paper>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" align="center" color="text.secondary">
              Введите запрос для поиска коллег
            </Typography>
          )} */}

          {myEmployees.length > 0 && (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 8, mb: 4, textAlign: "center" }}>
                Коллеги
              </Typography>
              <Grid container spacing={4} justifyContent="center">
                {myEmployees.map((emp) => (
                  <Grid item key={emp.id} xs={12} sm={6} md={4} lg={2}>
                    <Fade in timeout={500}>
                      <Paper
                        elevation={3}
                        sx={{
                          padding: 2,
                          textAlign: "center",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minHeight: 250,
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "scale(1.03)",
                            boxShadow: 6,
                          }
                        }}
                      >
                        <Link to={`/user/${emp.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <Avatar
                            src={emp.photo_link || "/images/default-avatar.png"}
                            alt={`${emp.surname} ${emp.name}`}
                            sx={{ width: 100, height: 100, mb: 2 }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {emp.surname}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {emp.name}
                          </Typography>
                          {emp.patronymic && (
                            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                              {emp.patronymic}
                            </Typography>
                          )}
                        </Link>
                      </Paper>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default SearchEmployee;
