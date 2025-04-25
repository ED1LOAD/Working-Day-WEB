import React, { useMemo, useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths } from "date-fns";
import ru from "date-fns/locale/ru";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";

import { Modal, Box, Typography } from "@mui/material";


import useAsync from "../functions/hooks/useAsync";
import getJsonWithErrorHandlerFunc from "../functions/getJsonWithErrorHandlerFunc";
import API from "../network/API";
import formatDate from "../functions/formatDate";
import getCachedLogin from "../functions/getCachedLogin";
import LeftPanel from "../components/LeftPanel/LeftPanel";
import TopPanel from "../components/TopPanel/TopPanel";

const locales = { ru };
const localizer = dateFnsLocalizer({
  format: (date, formatStr, options) => format(date, formatStr, { locale: ru, ...options }),
  parse: (value, formatStr, backupDate) => parse(value, formatStr, backupDate, { locale: ru }),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const formats = {
  dateFormat: "d",
  dayFormat: (date) => format(date, "EEEEEE", { locale: ru }),
  weekdayFormat: (date) => format(date, "EEEEEE", { locale: ru }),
  monthHeaderFormat: (date) => format(date, "LLLL yyyy", { locale: ru }),
  dayHeaderFormat: (date) => format(date, "d MMMM yyyy", { locale: ru }),
  dayRangeHeaderFormat: ({ start, end }) =>
    `${format(start, "d MMM", { locale: ru })} – ${format(end, "d MMM", { locale: ru })}`,

  timeGutterFormat: (date) => format(date, "HH:mm", { locale: ru }),
  eventTimeRangeFormat: ({ start, end }) =>
    `${format(start, "HH:mm", { locale: ru })} – ${format(end, "HH:mm", { locale: ru })}`,

};

const eventTypeTitles = {
  vacation: "Отпуск",
  attendance: "Посещение",
  sick_leave: "Больничный",
  business_trip: "Командировка",
  overtime: "Сверхурочные",
  unpaid_vacation: "Отпуск без оплаты",
};

const eventTypeColors = {
  vacation: "#9c27b0",
  attendance: "#009688",
  sick_leave: "#1976d2",
  business_trip: "#ff9800",
  overtime: "#f44336",
  unpaid_vacation: "#9e9e9e",
};

function Calendar() {
  const my_id = getCachedLogin();
  const [myInfo, setMyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [actions, setActions] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useAsync(getJsonWithErrorHandlerFunc, setMyInfo, [
    (args) => API.infoEmployee(args),
    [my_id],
  ]);

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      const from = formatDate(month);
      const to = formatDate(addMonths(month, 1));

      console.log("📤 Запрашиваем действия за:", { from, to });
      

      try {
        const data = await getJsonWithErrorHandlerFunc(() =>
          API.actions({ from, to })
        );

        if (!data || !Array.isArray(data.actions)) {
          console.warn("⚠️ Неверный формат данных:", data);
        } else {
          console.table(
            data.actions.map((a) => ({
              Тип: a.type,
              Статус: a.status,
              С: a.start_date,
              По: a.end_date,
            }))
          );
        }
        
        setActions(data);
      } catch (err) {
        console.error("❌ Ошибка при загрузке данных:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [month]);

  const events = useMemo(() => {
    if (!actions || !actions.actions) return [];
  
    return actions.actions.map((action, index) => {
      const start = new Date(action.start_date);
      const end = new Date(action.end_date);
  
      const isPending = action.status === "pending";
      const isAttendance = action.type === "attendance";
  
      const baseTitle = eventTypeTitles[action.type] || "Событие";
      const title = isPending && !isAttendance ? `Запрос: ${baseTitle}` : baseTitle;
      
      const hasTime =
      start.getHours() !== 0 ||
      start.getMinutes() !== 0 ||
      end.getHours() !== 23 ||
      end.getMinutes() !== 59;

    return {
      id: index,
      title,
      start,
      end,
      allDay: !hasTime,
      resource: { ...action },
    };
    });
  }, [actions]);
  

  const eventStyleGetter = (event) => {
    const { type, status } = event.resource;
    const color = eventTypeColors[type] || "#000";
  
    const isPending = status === "pending";
    const isAttendance = type === "attendance";
  
    return {
      style: {
        backgroundColor: color,
        borderRadius: "8px",
        color: "white",
        padding: "4px 8px",
        border: "none",
        fontWeight: 500,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        opacity: isPending && !isAttendance ? 0.6 : 1,
        fontStyle: isPending && !isAttendance ? "italic" : "normal",
      },
    };
  };
  

  const workedDays = useMemo(() => {
    if (!actions?.actions) return 0;
  
    const dates = new Set();
  
    actions.actions.forEach((action) => {
      if (action.type === "attendance") {
        const start = new Date(action.start_date);
        const end = new Date(action.end_date);
  
        for (
          let d = new Date(start);
          d <= end;
          d.setDate(d.getDate() + 1)
        ) {
          const day = new Date(d);
          day.setHours(0, 0, 0, 0);
          dates.add(day.getTime());
        }
      }
    });
  
    return dates.size;
  }, [actions]);
  
  const [selectedDate, setSelectedDate] = useState(null);

    return myInfo ? (
      <div className="calendar-layout">
        <LeftPanel highlight="calendar" />

        <div className="calendar-content">

          <TopPanel
            title="Учет рабочего времени"
            profpic={myInfo.photo_link}
            showfunctions={false}
            username={myInfo.name}
          />
    
          <div className="notion-calendar-container">
            <div className="calendar-main">
              <BigCalendar
              views={["month", "week", "day"]} 
                localizer={localizer}
                formats={formats}
                events={events}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={(event) => setSelectedEvent(event)}
                onNavigate={(date) => {
                  const newMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                  setMonth(newMonth);
                }}
                onSelectSlot={(slotInfo) => {
                  const date = new Date(slotInfo.start);
                  setSelectedDate(date);
                }}
                selectable
                
                messages={{
                  allDay: "Весь день",
                  previous: "Предыдущий",
                  next: "Следующий",
                  today: "Сегодня",
                  month: "Месяц",
                  week: "Неделя",
                  day: "День",
                  agenda: "Повестка",
                  date: "Дата",
                  time: "Время",
                  event: "Событие",
                  noEventsInRange: "Нет событий в выбранном диапазоне",
                  showMore: (total) => `+ ещё ${total}`,
                }}
                eventPropGetter={eventStyleGetter}
                popup
                style={{ height: "90vh", background: "white" }}
              />
            </div>

            <div className="calendar-footer">
              <div className="calendar-legend">
                {Object.entries(eventTypeTitles).map(([key, title]) => (
                  <div key={key} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: eventTypeColors[key] }}
                    />
                    <span>{title}</span>
                  </div>
                ))}
              </div>
              <div className="worked-days-display">
                Отработано дней: {workedDays}
              </div>
            </div>
    

            {selectedEvent && (
              <Modal open={true} onClose={() => setSelectedEvent(null)}>
                <Box sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "background.paper",
                  boxShadow: 24,
                  p: 4,
                  borderRadius: 2,
                  minWidth: 320
                }}>
                  <Typography variant="h6" mb={2}>{selectedEvent.title}</Typography>
                  <Typography variant="body2">
                    Тип: {eventTypeTitles[selectedEvent.resource.type] || "Событие"}
                  </Typography>
                  <Typography variant="body2">
                    С: {format(new Date(selectedEvent.start), "d MMMM yyyy HH:mm", { locale: ru })}
                  </Typography>
                  <Typography variant="body2">
                    По: {format(new Date(selectedEvent.end), "d MMMM yyyy HH:mm", { locale: ru })}
                  </Typography>
                </Box>
              </Modal>
            )}
            {selectedDate && (
  <Modal open={true} onClose={() => setSelectedDate(null)}>
    <Box sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "background.paper",
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
      minWidth: 320
    }}>
      <Typography variant="h6" mb={2}>
        {format(selectedDate, "d MMMM yyyy", { locale: ru })}
      </Typography>
      {events.filter(ev =>
        selectedDate >= new Date(ev.start) &&
        selectedDate <= new Date(ev.end)
      ).length > 0 ? (
        events
          .filter(ev =>
            selectedDate >= new Date(ev.start) &&
            selectedDate <= new Date(ev.end)
          )
          .map((ev, i) => (
            <Typography key={i} variant="body2" sx={{ mb: 1 }}>
              {ev.title} —{" "}
              {ev.allDay
                ? "весь день"
                : `${format(ev.start, "HH:mm")}–${format(ev.end, "HH:mm")}`}
            </Typography>
          ))
      ) : (
        <Typography variant="body2">Событий нет</Typography>
      )}
    </Box>
  </Modal>
)}


            {loading && (
              <div className="calendar-loading-overlay">
                <div className="calendar-loading-spinner">
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null;
    
}

export default Calendar;
