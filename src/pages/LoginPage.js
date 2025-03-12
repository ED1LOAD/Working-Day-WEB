import { useState, useEffect } from "react";
import { Button, Card } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../network/API";
import '../styles/LoginPage.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Cookies from "universal-cookie";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (min - max + 1)) + min;
}

function setElementPosition(element) {
  const randomFinalLeft = getRandomInt(-window.innerWidth, window.innerWidth);
  const randomFinalTop = getRandomInt(-window.innerHeight, window.innerHeight);

  const randomInitialRotation = getRandomInt(0, 360);
  const randomFinalRotation = getRandomInt(0, 360);

  element.style.left = '50%';
  element.style.top = '50%';
  element.style.setProperty('--final-left', `${randomFinalLeft}px`);
  element.style.setProperty('--final-top', `${randomFinalTop}px`);
  element.style.setProperty('--initial-rotation', `${randomInitialRotation}deg`);
  element.style.setProperty('--final-rotation', `${randomFinalRotation}deg`);
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const cookies = new Cookies();

  useEffect(() => {
    const checkAuth = async () => {
      const token = cookies.get("auth_token");
      const login = cookies.get("login");
      console.log("Cookies in checkAuth:", { token, login });

      if (token && login) {
        try {
          const response = await API.infoEmployee(login);
          if (response.status === 200) {
            navigate("/user/me");
          }
        } catch (error) {
          console.error("Authorization check failed", error);
        }
      }
    };

    checkAuth();

    const lines = document.querySelectorAll('.line');
    const dots = document.querySelectorAll('.dot');
    const elements = [...lines, ...dots];

    elements.forEach((element, index) => {
      setElementPosition(element);
      element.style.animationDelay = `${index * 1}s`;
    });

    const handleAnimationEnd = (event) => {
      const element = event.target;
      setElementPosition(element);
      element.style.animation = 'none';
      const reflow = element.offsetHeight;
      element.style.animation = '';
    };

    elements.forEach(element => {
      element.addEventListener('animationend', handleAnimationEnd);
    });

    return () => {
      elements.forEach(element => {
        element.removeEventListener('animationend', handleAnimationEnd);
      });
    };
  }, [navigate, cookies]);

  const onClick = async (event) => {
    event.preventDefault();
    try {
      let success = await API.login({
        login: email,
        password: password,
        company_id: companyId, 
      });
      if (success) {
        navigate("/user/me");
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const goToLandingPage = () => {
    window.location.href = "https://xn----7sbdnfph9adr4f2c.xn--p1ai/";
  };

  return (
    <div className="login-page">
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="line" />
      ))}
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} className="dot" />
      ))}
      <Card className="login-card">
        <Card.Body>
          <h1 className="login-title">Рабочий день</h1>
          <Form>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Логин</Form.Label>
              <Form.Control
                placeholder="Введите логин"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 form-group" controlId="password">
              <Form.Label>Пароль</Form.Label>
              <div className="input-wrapper">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span onClick={togglePasswordVisibility} className="eye-icon">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </Form.Group>
            <Form.Group className="mb-3" controlId="company_id">
              <Form.Label>Company ID</Form.Label>
              <Form.Control
                placeholder="Введите Company ID"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
            </Form.Group>
            <Button className="login-button" variant="primary" type="submit" onClick={onClick}>
              Войти
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <Button className="landing-button" variant="primary" onClick={goToLandingPage}>
        Перейти на лендинг
      </Button>
    </div>
  );
}

export default LoginPage;
