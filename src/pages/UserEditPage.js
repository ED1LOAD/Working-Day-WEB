import { Button, Col, Container, Image, Row } from "react-bootstrap";
import TitleField from "../components/UserPage/TitleField";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import "../styles/usereditpage.css";
import "../styles/overlay_editimage.css";
import "../styles/hidden.css";
import { useEffect, useRef, useState } from "react";
import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import { useNavigate, useParams } from "react-router-dom";
import optional from "../functions/optional";
import convertNull from "../functions/convertNull";
import EditIcon from '@mui/icons-material/Edit';
import getCachedRole from "../functions/getCachedRole";


function UserEditPage({ get_id = useParams }) {
  const { id } = get_id();
  const my_role = getCachedRole();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  useAsync(getJsonWithErrorHandlerFunc, setInfo, [
    (args) => API.infoEmployee(args),
    [id],
  ]);

  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram_id, setTelegramId] = useState("");
  const [vk_id, setVkId] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [job_position, setJobPosition] = useState("");

  const photo_input = useRef(null);

  useEffect(() => {
    if (!info) {
      return;
    }
    setBirthday(optional(info.birthday));
    setEmail(optional(info.email));
    setPhone(optional(info.phones, optional(info.phones[0])));
    setTelegramId(optional(info.telegram_id));
    setVkId(optional(info.vk_id));
    setJobPosition(optional(info.job_position) || "");
  }, [info]);

  async function onClick(event) {
    event.preventDefault();
  
    console.log("Отправляемая должность:", job_position || "Пустая строка");
  
    let resdata = await API.editProfile({
      phones: optional(phone, [phone], []),
      email: convertNull(email),
      birthday: convertNull(birthday),
      telegram_id: convertNull(telegram_id),
      vk_id: convertNull(vk_id),
      job_position: convertNull(job_position),
    });
  
    let responseText = await resdata.text();
    console.log("Ответ от сервера (text):", responseText);
  
    if (!resdata.ok) {
      console.error("Ошибка API, статус:", resdata.status);
      alert("Ошибка при сохранении данных: " + responseText);
      return;
    }
  
    try {
      let jsonResponse = JSON.parse(responseText);
      console.log("Парсинг JSON:", jsonResponse);
    } catch (error) {
      console.error("Ошибка парсинга JSON, сервер вернул:", responseText);
    }
  
    navigate("./..");
  }
  

  const readPhoto = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    reader.readAsArrayBuffer(files[0]);
    reader.onload = (e) => {
      setPhotoData(e.target.result);
    };
  };

  return !info ? null : (
    <div style={{ display: "flex" }}>
      <LeftPanel highlight="user" />
      <div>
        <TopPanel
          title="Настройки аккаунта"
          profpic={info.photo_link}
          username={info.name}
          showfunctions={false}
        />
        <div className="main-content">
          <div className="overlay-container">
            <Image
              className="overlay-bgimage profpic"
              src={optional(info.photo_link)}
              width={100}
              height={100} 
              roundedCircle
            />
            <button
              className="overlay-fgimage image-button"
              onClick={() => photo_input.current.click()}
            >
              <EditIcon style={{ color: "white" }} />
            </button>
            <input
              type="file"
              id="photo"
              name="photo"
              ref={photo_input}
              className="hidden"
              onChange={readPhoto}
            />
          </div>

          <form id="edit-profile-form">
            <Container className="form-container" fluid>
              <Row>
                <Col className="form-col">
                  <label className="edit-label" for="birthday">
                    День рождения
                  </label>
                  <br />
                  <input
                    className="edit-input"
                    type="date"
                    id="birthday"
                    name="birthday"
                    defaultValue={optional(info.birthday)}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col className="form-col">
                  <label className="edit-label" for="email">
                    Электронная почта
                  </label>
                  <br />
                  <input
                    className="edit-input"
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={optional(info.email)}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col className="form-col">
                  <label className="edit-label" for="phone">
                    Номер телефона
                  </label>
                  <br />
                  <input
                    className="edit-input"
                    type="tel"
                    id="phone"
                    name="phone"
                    pattern="\+[0-9]{1,3} [0-9]{3} [0-9]{3} [0-9]{4}"
                    defaultValue={optional(info.phones, info.phones[0])}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
              <Col className="form-col">
                  <label className="edit-label" for="job_position">
                    Должность
                  </label>
                  <br />
                  <input
                    className="edit-input"
                    type="text"
                    id="job_position"
                    name="job_position"
                    defaultValue={optional(info.job_position)}
                    onChange={(e) => setJobPosition(e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col className="form-col">
                  <label className="edit-label" for="telegram_id">
                    Telegram ID
                  </label>
                  <br />
                  <input
                    className="edit-input"
                    type="text"
                    id="telegram_id"
                    name="telegram_id"
                    defaultValue={optional(info.telegram_id)}
                    onChange={(e) => setTelegramId(e.target.value)}
                  />
                </Col>
                <Col className="form-col">
                  <label className="edit-label" for="vk_id">
                    VK ID
                  </label>
                  <br />
                  <input
                    className="edit-input"
                    type="text"
                    id="vk_id"
                    name="vk_id"
                    defaultValue={optional(info.vk_id)}
                    onChange={(e) => setVkId(e.target.value)}
                  />
                </Col>
              </Row>
              <Row>
                <Col className="form-col">
                  <button
                    type="submit"
                    className="edit-save-button"
                    onClick={onClick}
                  >
                    Сохранить изменения
                  </button>
                </Col>
              </Row>
            </Container>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserEditPage;
