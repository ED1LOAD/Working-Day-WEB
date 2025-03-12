import { Button, Col, Container, Image, Row, Modal, Form } from "react-bootstrap";
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
  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]); 

  const [info, setInfo] = useState(null);
  useAsync(
    getJsonWithErrorHandlerFunc,
    setInfo,
    [(args) => API.infoEmployee(args), [id]]
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");

  // Обработчик добавления инвентаря
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

  return !info || !myInfo ? null : (
    <div className="page-container">
      <LeftPanel highlight="user" />
      <div className="main-content">
        <TopPanel
          title={my_id == id ? "Мой профиль" : "Профиль сотрудника"}
          profpic={myInfo.photo_link}
          showfunctions={false}
          username={myInfo.name}
        />
        <Container className="main-body" fluid>
          <Row>
            <Col md="auto">
              <h1 className="user-page-name">
                {info.name +
                  " " +
                  optional(info.patronymic) +
                  " " +
                  info.surname}
              </h1>
              {my_role == "admin" && id !== my_id ? (
                <Button
                  className="user-page-delete-button"
                  variant="danger"
                  onClick={() => {
                    API.removeEmployee({ employee_id: id });
                    alert("Пользователь удален");
                  }}
                >
                  Удалить
                </Button>
              ) : (
                <div className="user-page-delete-button-replacer"></div>
              )}
              <TitleField title="Электронная почта" value={optional(info.email)} />
              <TitleField title="Номер телефона" value={optional(info.phones, info.phones[0])} />
              <Row>
                <Col className="user-page-col-padding">
                  <TitleField title="День рождения" value={optional(info.birthday)} />
                </Col>
                <Col className="user-page-col-padding">
                  <TitleField title="Telegram ID" value={optional(info.telegram_id)} />
                </Col>
              </Row>  
              <Row>
                <Col className="user-page-col-padding">
                  <TitleField title="Команда" value={optional(info.team)} />
                </Col>
                <Col className="user-page-col-padding">
                  <TitleField title="VK ID" value={optional(info.vk_id)} />
                </Col>
              </Row>

              {optional(
                my_id == id,
                <Button
                  className="edit-button"
                  onClick={() => navigate("./edit")}
                >
                  Изменить личную информацию
                </Button>
              )}

              <div style={{ paddingTop: "40px" }}>
                <h3>Инвентарь</h3>
                {info.inventory && info.inventory.length > 0 ? (
                  info.inventory.map((item, index) => (
                    <div
                      key={index}
                      className="inventory-item"
                      onClick={() => {
                        setSelectedDescription(item.description || "Описание отсутствует");
                        setShowDescriptionModal(true);
                      }}
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: "8px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        marginBottom: "8px",
                      }}
                    >
                      {item.name}
                    </div>
                  ))
                ) : (
                  <p>Инвентарь отсутствует</p>
                )}

                {my_role === "admin" && (
                  <Button
                    className="edit-button"
                    onClick={() => setShowAddModal(true)}
                    style={{ marginTop: "20px" }}
                  >
                    Добавить инвентарь
                  </Button>
                )}
              </div>

            </Col>
            <Col className="img-col" md="auto" style={{ marginLeft: "140px" }}>
              {optional(
                info.photo_link,
                <Image
                  className="img"
                  src={info.photo_link}
                  width={400}
                  height={388}
                  roundedCircle
                />
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Модальное окно для добавления инвентаря */}
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
            <Form.Group controlId="formItemDescription">
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

      {/* Модальное окно для отображения описания предмета */}
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
  );
}

export default UserPage;
