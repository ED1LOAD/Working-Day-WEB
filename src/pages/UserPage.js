import { Button, Image, Modal, Form } from "react-bootstrap";
import TitleField from "../components/UserPage/TitleField";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";
import "../styles/userpage.css";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../network/API";
import useAsync from "../functions/hooks/useAsync";
import optional from "../functions/optional";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import getCachedLogin from "../functions/getCachedLogin";
import getCachedRole from "../functions/getCachedRole";

function UserPage({ get_id = useParams }) {
  const { id } = get_id();
  const my_id = getCachedLogin();
  const my_role = getCachedRole();
  const navigate = useNavigate();

  const [myInfo, setMyInfo] = useState(null);
  const [headInfo, setHeadInfo] = useState(null);
  const [info, setInfo] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");

  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]);

  useAsync(getJsonWithErrorHandlerFunc, setInfo, [(args) => API.infoEmployee(args), [id]]);

  useEffect(() => {
    if (info?.head_id) {
      getJsonWithErrorHandlerFunc(() => API.infoEmployee(info.head_id)).then(setHeadInfo);
    }
  }, [info?.head_id]);

  const handleAddInventory = async () => {
    try {
      const result = await API.addInventoryItem({
        name: itemName,
        description: itemDescription,
        employee_id: id,
      });
      if (result.ok) {
        alert("Инвентарь успешно добавлен");
        setShowAddModal(false);
        setItemName("");
        setItemDescription("");
      } else {
        alert("Ошибка при добавлении инвентаря");
      }
    } catch (error) {
      console.error("Ошибка при добавлении инвентаря:", error);
      alert("Ошибка при добавлении инвентаря");
    }
  };

  if (!info || !myInfo) return null;

  return (
    <div className="page-container">
      <LeftPanel highlight="user" />
      <div className="main-content">
        <TopPanel
          title={my_id === id ? "Мой профиль" : "Профиль сотрудника"}
          profpic={myInfo.photo_link}
          showfunctions={false}
          username={myInfo.name}
        />

<div className="userpage-body">
  <div className="userpage-left">
  <Image
  src={info.photo_link}
  className="user-profile-image"
/>

<h4 className="user-fullname">
  {info.name} {optional(info.patronymic)} {info.surname}
</h4>

    <div style={{ color: "#888", marginBottom: "12px" }}>{info.job_position}</div>

    {optional(
      my_id === id,
      <Button variant="outline-primary" onClick={() => navigate("./edit")}>
        ✏ Изменить информацию
      </Button>
    )}

    {my_role === "admin" && id !== my_id && (
      <div style={{ marginTop: "12px" }}>
        <Button
          variant="danger"
          onClick={() => {
            API.removeEmployee({ employee_id: id });
            alert("Пользователь удален");
          }}
        >
          Удалить
        </Button>
      </div>
    )}
  </div>

  <div className="userpage-middle">
    <h5 style={{ marginBottom: "16px" }}>Контактная информация</h5>
    <TitleField title="Электронная почта" value={optional(info.email)} />
    <TitleField title="Номер телефона" value={optional(info.phones, info.phones[0])} />
    <TitleField title="Telegram ID" value={optional(info.telegram_id)} />
    <TitleField title="VK ID" value={optional(info.vk_id)} />
    <TitleField title="День рождения" value={optional(info.birthday)} />
    <TitleField title="Команда" value={optional(info.team)} />
    {info.head_id && headInfo && (
      <TitleField
        title="Руководитель"
        value={
          <span
            style={{ textDecoration: "underline", cursor: "pointer", color: "#164f94" }}
            onClick={() => navigate(`/user/${info.head_id}`)}
          >
            {headInfo.name} {optional(headInfo.patronymic)} {headInfo.surname}
          </span>
        }
      />
    )}
  </div>

  <div className="userpage-right">
    <h5 style={{ marginBottom: "16px" }}>Инвентарь</h5>

    {info.inventory && info.inventory.length > 0 ? (
      info.inventory.map((item, index) => (
        <div
  key={index}
  className="inventory-item-field hoverable-field"
  onClick={() => {
    setSelectedDescription(item.description || "Описание отсутствует");
    setShowDescriptionModal(true);
  }}
  title="Нажмите, чтобы посмотреть описание"
>
  {item.name}
</div>

      ))
    ) : (
      <p style={{ color: "#666" }}>Инвентарь отсутствует</p>
    )}

    {my_role === "admin" && (
      <Button className="edit-button" onClick={() => setShowAddModal(true)} style={{ marginTop: "12px" }}>
        Добавить инвентарь
      </Button>
    )}
  </div>
</div>



        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Добавить инвентарь</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="formItemName">
                <Form.Label>Название предмета</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите название предмета"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="formItemDescription" className="mt-3">
                <Form.Label>Описание предмета</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите описание предмета"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleAddInventory}>
              Добавить
            </Button>
          </Modal.Footer>
        </Modal>


        <Modal show={showDescriptionModal} onHide={() => setShowDescriptionModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Описание предмета</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{selectedDescription}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDescriptionModal(false)}>
              Закрыть
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default UserPage;
