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
  
    try {

      console.log("Сохранение профиля...");
 
      if (photoData) {
        console.log("Попытка загрузить новое фото...");
        const uploadRes = await API.uploadPhotoProfile();
        const uploadJson = await uploadRes.json();
        console.log("Ответ на /upload-photo:", uploadJson);
  
        if (!uploadRes.ok || !uploadJson?.url) {
          throw new Error("Ошибка получения ссылки для загрузки фото");
        }
  
        const putRes = await fetch(uploadJson.url, {
          method: "PUT",
          body: new Blob([photoData]),
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });
  
        console.log("Фото отправлено, статус PUT:", putRes.status);
  
        if (!putRes.ok) {
          throw new Error("Ошибка при отправке файла на S3");
        }
      } else {
        console.log("Новое фото не выбрано — пропуск загрузки");
      }
  
      console.log("Отправка остальных данных профиля...");
      const resdata = await API.editProfile({
        phones: optional(phone, [phone], []),
        email: convertNull(email),
        birthday: convertNull(birthday),
        telegram_id: convertNull(telegram_id),
        vk_id: convertNull(vk_id),
        job_position: convertNull(job_position),
      });
  
      const responseText = await resdata.text();
      console.log("Ответ на /edit:", responseText);
  
      if (!resdata.ok) {
        alert("Ошибка при сохранении данных: " + responseText);
        return;
      }
  
      console.log("Данные успешно обновлены, переход назад");
      navigate("./..");
  
    } catch (err) {
      console.error("Ошибка в процессе сохранения профиля:", err);
      alert("Ошибка при сохранении изменений: " + err.message);
    }
  }
  
  const [previewUrl, setPreviewUrl] = useState(""); 

  const readPhoto = (e) => {
    let file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoData(event.target.result); 
      setPreviewUrl(URL.createObjectURL(file)); 
    };
    reader.readAsArrayBuffer(file);
  };
  
  

  return !info ? null : (
    <div className="page-container">
      <LeftPanel highlight="user" />
      <div className="main-content">
        <TopPanel
          title="Настройки аккаунта"
          profpic={info.photo_link}
          username={info.name}
          showfunctions={false}
        />
  
        <div className="edit-userpage-body">
        <div className="edit-userpage-left">
  <div className="edit-photo-wrapper">
    <img src={previewUrl || optional(info.photo_link)} alt="Аватар" />
    <button
      type="button"
      className="edit-photo-button"
      onClick={() => photo_input.current.click()}
    >
      Изменить фото
    </button>
    <input
      type="file"
      ref={photo_input}
      className="hidden"
      onChange={readPhoto}
    />
  </div>
</div>


          <form className="edit-userpage-middle" onSubmit={onClick}>
            <div className="edit-field">
              <label className="edit-label">Электронная почта</label>
              <input
                className="edit-input"
                type="email"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">Номер телефона</label>
              <input
                className="edit-input"
                type="tel"
                defaultValue={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">Telegram ID</label>
              <input
                className="edit-input"
                type="text"
                defaultValue={telegram_id}
                onChange={(e) => setTelegramId(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">VK ID</label>
              <input
                className="edit-input"
                type="text"
                defaultValue={vk_id}
                onChange={(e) => setVkId(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">День рождения</label>
              <input
                className="edit-input"
                type="date"
                defaultValue={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">Должность</label>
              <input
                className="edit-input"
                type="text"
                defaultValue={job_position}
                onChange={(e) => setJobPosition(e.target.value)}
              />
            </div>
  
            <button className="edit-save-button" type="submit">
              Сохранить изменения
            </button>
          </form>

          <div className="edit-userpage-right"></div>
        </div>
      </div>
    </div>
  );
  
}

export default UserEditPage;
