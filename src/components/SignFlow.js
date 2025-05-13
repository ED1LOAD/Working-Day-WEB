import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import "../styles/signflow.css";
import API from "../network/API";

const SignFlow = React.memo(function SignFlow({ chainMetadata = [] }) {
  const [employeeInfoMap, setEmployeeInfoMap] = useState({});

  useEffect(() => {
    const uniqueIds = [...new Set(chainMetadata.map((item) => item.employee_id))];

    Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const response = await API.infoEmployee(id);  
          const data = await response.json(); 


          return {
            id,
            fullName: `${data.surname} ${data.name} ${data.patronymic || ""}`.trim(),
          };
        } catch (error) {
     
          return { id, fullName: `Employee ${id}` };  
        }
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ id, fullName }) => {
        map[id] = fullName;
      });
      setEmployeeInfoMap(map);  
    });
  }, [chainMetadata]);

  if (!chainMetadata.length) {
    return <Typography>Нет цепочки согласования</Typography>;
  }

  const currentIndex = chainMetadata.findIndex(
    (item) => item.status === 0 && item.requires_signature
  );

  return (
    <div className="signflow-grid">
      {chainMetadata.map((item, index) => {
        const isSigned = item.status === 1;
        const isRejected = item.status === 2;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex && item.requires_signature;
        const isAcknowledged = !item.requires_signature;
        const isAcknowledging = isAcknowledged && item.status === 0;
        const isAcknowledgedDone = isAcknowledged && item.status === 1;
        const isLast = index === chainMetadata.length - 1;

        const statusText = isSigned
          ? "Подписано"
          : isRejected
          ? "Отклонено"
          : isCurrent
          ? "Требуется подпись"
          : isPending
          ? "Ожидается"
          : isAcknowledging
          ? "На рассмотрении"
          : isAcknowledgedDone
          ? "Ознакомлен"
          : "—";

          const avatarClass = isSigned
          ? "signflow-avatar signed"
          : isRejected
          ? "signflow-avatar rejected"
          : isCurrent
          ? "signflow-avatar current"
          : isAcknowledging
          ? "signflow-avatar acknowledging"
          : isAcknowledgedDone
          ? "signflow-avatar acknowledged"
          : isPending
          ? "signflow-avatar pending"
          : "signflow-avatar";

        const lineClass = isSigned
          ? "signflow-line signed"
          : isCurrent
          ? "signflow-line current"
          : "signflow-line";

        const initials = (employeeInfoMap[item.employee_id] || item.employee_id)
          .split(" ")
          .map((s) => s[0]?.toUpperCase())
          .join("")
          .slice(0, 2);

        const fullName = employeeInfoMap[item.employee_id] || item.employee_id;

        return (
          <React.Fragment key={index}>
            <div className="signflow-signer-col">
              <div className={avatarClass}>{initials}</div>
              <div className="signflow-label">{fullName}</div>
              <div className="signflow-status">{statusText}</div>
            </div>
            {!isLast && (
              <div className="signflow-line-col">
                <div className={lineClass}></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

export default SignFlow;
