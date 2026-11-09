import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound, RefreshCw, BookOpen } from 'lucide-react';
import './student-calendar.css';

export type CalendarSchedule = {
  id?: string;
  lop: string;
  tenMonHoc: string;
  thu: string;
  caHoc: string;
  phongHoc: string;
  giangVien: string;
  tietBatDau?: number | null;
  soTiet?: number | null;
  ngayBatDau?: string;
  ngayKetThuc?: string;
};

type Props = {
  schedules: CalendarSchedule[];
  className: string;
  loading?: boolean;
  onRefresh: () => void;
};
const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const weekdayNumbers: Record<string, number> = { 'Chủ nhật': 0, 'Chu nhat': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateLabel = (date: Date) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const shiftMonth = (date: Date, delta: number) => new Date(date.getFullYear(), date.getMonth()+delta, 1);
const getStartPeriod = (schedule: CalendarSchedule) => {
  if (schedule.tietBatDau != null && schedule.soTiet != null && schedule.tietBatDau > 0 && schedule.soTiet > 0) {
    const last = schedule.tietBatDau + schedule.soTiet - 1;
    return `Tiết ${schedule.tietBatDau}–${last}`;
  }
  const match = schedule.caHoc?.match(/tiết\s*(\d+)\s*(?:[-–—]\s*(\d+))?/i);
  return match ? `Tiết ${match[1]}${match[2] ? '–'+match[2] : ''}` : 'Chưa cập nhật tiết';
};
const timeOrder = (schedule: CalendarSchedule) => {
  if (schedule.tietBatDau != null) return schedule.tietBatDau;
  const m = schedule.caHoc?.match(/(\d{1,2})[:h](\d{2})/i);
  if (m) return Number(m[1]) + Number(m[2]) / 60;
  return /sáng/i.test(schedule.caHoc) ? 7 : /chiều/i.test(schedule.caHoc) ? 13 : /tối/i.test(schedule.caHoc) ? 18 : 99;
};
function forDate(schedules: CalendarSchedule[], date: Date) {
  const day = date.getDay();
  const key = dateKey(date);
  return schedules.filter(item => weekdayNumbers[item.thu?.trim()] === day
    && (!item.ngayBatDau || key >= item.ngayBatDau)
    && (!item.ngayKetThuc || key <= item.ngayKetThuc))
    .sort((a,b) => timeOrder(a)-timeOrder(b) || a.tenMonHoc.localeCompare(b.tenMonHoc, 'vi'));
}

export default function StudentCalendar({ schedules, className, loading, onRefresh }: Props) {
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'day'>('month');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const todayKey = dateKey(new Date());
  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1-first.getDay());
    // 35 or 42 cells so each calendar row is a full week.
    const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
    const cellCount = Math.ceil((first.getDay()+daysInMonth)/7)*7;
    return Array.from({length:cellCount},(_,index)=>new Date(gridStart.getFullYear(),gridStart.getMonth(),gridStart.getDate()+index));
  },[month]);
  const dayLessons = useMemo(() => forDate(schedules, selected), [schedules, selected]);
  const lessonDays = useMemo(() => cells.map(date => forDate(schedules,date)), [cells,schedules]);
  const selectDate = (date: Date, openDay = false) => {
    setSelected(date);
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(startOfMonth(date));
    if (openDay) setView('day');
  };
  const moveDay = (delta: number) => {
    const next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + delta);
    selectDate(next);
  };
  const selectDateString = (value: string) => {
    const parts = value.split('-').map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) selectDate(new Date(parts[0], parts[1]-1, parts[2]));
  };
  const weekStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - selected.getDay());
  const weekDays = Array.from({length:7}, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+i));
  const jumpToday = () => {const now=new Date();setSelected(now);setMonth(startOfMonth(now));};
  return <div className="student-cal" aria-label="Lịch học sinh viên">
    <div className="student-cal-toolbar">
      <div className="student-cal-toolbar-title"><CalendarDays size={22}/><div><h3>{view === 'month' ? 'Lịch học theo tháng' : 'Lịch học theo ngày'}</h3><small>{className ? `Lớp ${className}` : 'Lịch học của bạn'}</small></div></div>
      <div className="student-cal-navigation"><button type="button" onClick={jumpToday}>Hôm nay</button><button type="button" aria-label={view === 'month' ? 'Tháng trước' : 'Ngày trước'} onClick={()=>view === 'month' ? setMonth(m=>shiftMonth(m,-1)) : moveDay(-1)}><ChevronLeft size={19}/></button><button type="button" aria-label={view === 'month' ? 'Tháng sau' : 'Ngày sau'} onClick={()=>view === 'month' ? setMonth(m=>shiftMonth(m,1)) : moveDay(1)}><ChevronRight size={19}/></button><strong>{view === 'month' ? `Tháng ${month.getMonth()+1}, ${month.getFullYear()}` : dateLabel(selected)}</strong></div>
      <div className="student-cal-actions">
        <label className="student-cal-view-label" htmlFor="student-cal-view">Chế độ xem</label>
        <select id="student-cal-view" className="student-cal-view-select" value={view} onChange={e=>setView(e.target.value as 'month'|'day')} aria-label="Chế độ xem lịch học">
          <option value="month">Tháng</option>
          <option value="day">Ngày</option>
        </select>
        <button className="student-cal-refresh" type="button" disabled={loading} onClick={onRefresh}><RefreshCw size={16}/> Tải lại</button>
      </div>
    </div>
    {view === 'month' ? <div className="student-cal-layout">
      <div className="student-cal-month">
        <div className="student-cal-weekdays">{weekdays.map(w=><div key={w}>{w}</div>)}</div>
        <div className="student-cal-grid">{cells.map((date,i)=>{
          const key=dateKey(date); const lessons=lessonDays[i];const current=date.getMonth()===month.getMonth();
          return <button type="button" key={key} aria-label={`${dateLabel(date)}: ${lessons.length} buổi học`} aria-pressed={key===dateKey(selected)} className={`student-cal-day${current?'':' outside'}${key===todayKey?' today':''}${key===dateKey(selected)?' active':''}`} onClick={()=>selectDate(date, true)}>
            <span className="student-cal-date">{date.getDate()}</span>
            <span className="student-cal-events">{lessons.slice(0,2).map((lesson,j)=><span className="student-cal-event" key={`${lesson.id||lesson.tenMonHoc}-${j}`} title={`${lesson.tenMonHoc} · ${getStartPeriod(lesson)}`}>{lesson.tenMonHoc}</span>)}{lessons.length>2&&<span className="student-cal-more">+{lessons.length-2} môn khác</span>}</span>
            {lessons.length>0&&<span className="student-cal-count">{lessons.length} môn</span>}
          </button>;
        })}</div>
      </div>
      <aside className="student-cal-agenda" aria-live="polite">
        <div className="student-cal-agenda-header"><span>CHI TIẾT NGÀY HỌC</span><h3>{dateLabel(selected)}</h3><p>{dayLessons.length} môn học</p></div>
        {dayLessons.length===0 ? <div className="student-cal-empty"><CalendarDays size={32}/><b>Không có lịch học</b><span>Chọn ngày có môn học trên lịch để xem chi tiết.</span></div> : <div className="student-cal-lesson-list">{dayLessons.map((item,index)=><article className="student-cal-lesson" key={`${item.id||item.tenMonHoc}-${index}`}><div className="student-cal-lesson-number">{index+1}</div><div className="student-cal-lesson-content"><h4>{item.tenMonHoc}</h4><div className="student-cal-lesson-line"><Clock3 size={15}/><strong>{getStartPeriod(item)}</strong><span>· {item.caHoc || 'Chưa có giờ học'}</span></div><div className="student-cal-lesson-line"><UserRound size={15}/><span>{item.giangVien || 'Chưa phân công giảng viên'}</span></div><div className="student-cal-lesson-line"><MapPin size={15}/><span>{item.phongHoc || 'Chưa cập nhật phòng'}</span></div><div className="student-cal-lesson-line"><BookOpen size={15}/><span>Lớp {item.lop}</span></div></div></article>)}</div>}
      </aside>
    </div> : <section className="student-cal-daily" aria-label="Lịch học chi tiết theo ngày">
      <div className="student-cal-daily-top">
        <div><span className="student-cal-daily-kicker">LỊCH HỌC TRONG NGÀY</span><h3>{dateLabel(selected)}</h3><p>{dayLessons.length} môn học · {className ? `Lớp ${className}` : 'Lịch học cá nhân'}</p></div>
        <label className="student-cal-date-input-label">Chọn ngày <input type="date" value={dateKey(selected)} onChange={e=>selectDateString(e.target.value)} aria-label="Chọn ngày xem lịch học" /></label>
      </div>
      <div className="student-cal-weekstrip" role="group" aria-label="Chọn ngày trong tuần">
        {weekDays.map(date => <button type="button" key={dateKey(date)} className={`student-cal-weekstrip-day${dateKey(date)===dateKey(selected)?' active':''}${dateKey(date)===todayKey?' today':''}`} aria-pressed={dateKey(date)===dateKey(selected)} onClick={()=>selectDate(date)}><span>{weekdays[date.getDay()]}</span><strong>{date.getDate()}</strong><small>{forDate(schedules,date).length} môn</small></button>)}
      </div>
      <div className="student-cal-daily-list">
        {dayLessons.length === 0 ? <div className="student-cal-empty"><CalendarDays size={36}/><b>Ngày này chưa có lịch học</b><span>Chọn ngày khác hoặc chuyển sang chế độ Tháng để xem tổng quan.</span></div>
        : dayLessons.map((item,index) => <article className="student-cal-daily-event" key={`${item.id||item.tenMonHoc}-${index}`}>
          <div className="student-cal-daily-time"><Clock3 size={18}/><strong>{getStartPeriod(item)}</strong><span>{item.caHoc || 'Chưa cập nhật ca học'}</span></div>
          <div className="student-cal-daily-card"><div className="student-cal-daily-order">Môn {index+1} / {dayLessons.length}</div><h4>{item.tenMonHoc}</h4><div className="student-cal-daily-details"><span><UserRound size={16}/> Giảng viên: <strong>{item.giangVien || 'Chưa phân công'}</strong></span><span><MapPin size={16}/> Phòng: <strong>{item.phongHoc || 'Chưa cập nhật'}</strong></span><span><BookOpen size={16}/> Lớp: <strong>{item.lop}</strong></span></div></div>
        </article>)}
      </div>
    </section>}
    <p className="student-cal-footnote">Lịch lặp lại hằng tuần theo Thứ do Admin thiết lập. Nếu Admin chưa nhập ngày bắt đầu/kết thúc, lịch sẽ hiển thị ở mọi tuần; ngày nghỉ lễ và lịch học bù chưa được tự động tính.</p>
  </div>;
}
