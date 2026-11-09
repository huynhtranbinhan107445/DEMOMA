import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, Clock3, BookOpen, Plus, X, Pencil, Trash2, MapPin, UserRound, Users, RefreshCw } from 'lucide-react';
import './teaching-planner.css';
import { previewTeachingPlan, weekOptions } from './teachingPlan';

export type PlannerCourse = { id?: string; code: string; name: string; credits: number; department: string; semester: string; lecturerId?: string };
export type PlannerSchedule = { id?: string; planId?: string; classGroupId?: string; lop: string; tenMonHoc: string; thu: string; caHoc: string; phongHoc: string; giangVien: string; courseId?: string; lecturerId?: string; tietBatDau?: number | null; soTiet?: number | null; ngayBatDau?: string; ngayKetThuc?: string };
export type PlannerLecturer = { id?: string; fullName: string; code: string };
export type PlannerFaculty = { id?: string; code: string; name: string };
type PlannerTask = { id?: string; title: string; description: string; dueDate: string; courseId: string; className: string; ownerLecturerId: string; completed: boolean };
type Props = {
  role: 'ADMIN' | 'LECTURER';
  lecturerId?: string;
  courses: PlannerCourse[];
  schedules: PlannerSchedule[];
  lecturers: PlannerLecturer[];
  faculties: PlannerFaculty[];
  classNames: string[];
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  onRefresh: () => Promise<void>;
  prefillCourseId?: string;
  onPrefillConsumed?: () => void;
};
type View = 'month' | 'week' | 'day';
type Modal = 'course' | 'schedule' | 'task' | null;
type ScheduleDraft = { courseId: string; lecturerId: string; lop: string; lops: string[]; phongHoc: string; caHoc: string; tietBatDau: number; soTiet: number; date: string; repeatWeekly: boolean; endDate: string; daysPerWeek: number; weekdays: string[] };
const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const dayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const dayNumbers: Record<string, number> = { 'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = (v: string) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
const plusDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monday = (d: Date) => plusDays(d, -(d.getDay() + 6) % 7);
const dateText = (d: Date) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }).format(d);
const defaultCourse = (): PlannerCourse => ({ code: '', name: '', credits: 3, department: '', semester: '', lecturerId: '' });
const defaultTask = (date: string, lecturerId: string): PlannerTask => ({ title: '', description: '', dueDate: date, courseId: '', className: '', ownerLecturerId: lecturerId, completed: false });
const defaultSchedule = (date: string, lecturerId: string): ScheduleDraft => ({ courseId: '', lecturerId, lop: '', lops: [], phongHoc: '', caHoc: 'Sáng (7:30 - 11:30)', tietBatDau: 1, soTiet: 3, date, repeatWeekly: true, endDate: '', daysPerWeek: 1, weekdays: [dayLabels[fromKey(date).getDay()]] });
const lessonLabel = (s: PlannerSchedule) => s.tietBatDau && s.soTiet ? `Tiết ${s.tietBatDau}–${s.tietBatDau + s.soTiet - 1}` : s.caHoc;
const eventSort = (a: PlannerSchedule, b: PlannerSchedule) => (a.tietBatDau || 99) - (b.tietBatDau || 99);
function scheduleForDate(rows: PlannerSchedule[], d: Date) {
  const k = key(d);
  const dayRows = rows.filter(s => dayNumbers[s.thu] === d.getDay() && (!s.ngayBatDau || s.ngayBatDau <= k) && (!s.ngayKetThuc || s.ngayKetThuc >= k));
  // A shared plan is stored as one schedule per class for student timetable compatibility.
  // In Admin/Lecturer calendar show it as one lesson with all its classes.
  const grouped = new Map<string, PlannerSchedule>();
  for (const row of dayRows) {
    const groupKey = row.planId ? `${row.planId}:${row.thu}:${row.courseId}:${row.tietBatDau}:${row.phongHoc}:${row.lecturerId}`
      : row.classGroupId ? `manual:${row.classGroupId}` : row.id || `${row.tenMonHoc}:${row.lop}`;
    const previous = grouped.get(groupKey);
    if (previous && (row.planId || row.classGroupId)) {
      const classes = new Set([...previous.lop.split(',').map(c => c.trim()), row.lop.trim()]);
      grouped.set(groupKey, { ...previous, lop: [...classes].filter(Boolean).join(', ') });
    } else grouped.set(groupKey, { ...row });
  }
  return [...grouped.values()].sort(eventSort);
}
function colorIndex(value: string) { return Array.from(value).reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5; }

export default function TeachingPlanner({ role, lecturerId = '', courses, schedules, lecturers, faculties, classNames, request, onRefresh, prefillCourseId = '', onPrefillConsumed }: Props) {
  const isAdmin = role === 'ADMIN';
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState<View>('month');
  const [modal, setModal] = useState<Modal>(null);
  const [createMenu, setCreateMenu] = useState(false);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [courseForm, setCourseForm] = useState<PlannerCourse>(defaultCourse());
  const [scheduleForm, setScheduleForm] = useState<ScheduleDraft>(() => defaultSchedule(key(new Date()), lecturerId));
  const [taskForm, setTaskForm] = useState<PlannerTask>(() => defaultTask(key(new Date()), lecturerId));
  const [courseSearch, setCourseSearch] = useState('');
  const selectedKey = key(selected);
  const todayKey = key(new Date());
  const selectedLessons = useMemo(() => scheduleForDate(schedules, selected), [schedules, selected]);
  const selectedTasks = useMemo(() => tasks.filter(t => t.dueDate === selectedKey).sort((a, b) => Number(a.completed) - Number(b.completed)), [tasks, selectedKey]);
  const pendingTasks = useMemo(() => tasks.filter(t => showDone || !t.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [tasks, showDone]);
  const cells = useMemo(() => {
    if (view === 'day') return [selected];
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => plusDays(monday(selected), i));
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const start = monday(first);
    const count = Math.ceil((Math.round((first.getTime() - start.getTime()) / 86400000) + new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: count }, (_, i) => plusDays(start, i));
  }, [selected, view]);
  const heading = view === 'month' ? `Tháng ${selected.getMonth() + 1}, ${selected.getFullYear()}` : view === 'week' ? `Tuần ${dateText(monday(selected))}` : dateText(selected);
  const selectedCourse = courses.find(c => c.id === scheduleForm.courseId);
  const selectedClasses = scheduleForm.lops;
  const planClasses = editingPlanId ? [...new Set(schedules.filter(s => s.planId === editingPlanId).map(s => s.lop))] : [];
  const planRows = editingPlanId ? schedules.filter(s => s.planId === editingPlanId) : [];
  const planStartDate = planRows.map(s => s.ngayBatDau || '').filter(Boolean).sort()[0] || scheduleForm.date;
  const planEndDate = planRows.map(s => s.ngayKetThuc || '').filter(Boolean).sort().slice(-1)[0] || scheduleForm.endDate;
  const planPreview = useMemo(() => previewTeachingPlan(scheduleForm.date, scheduleForm.weekdays, selectedCourse?.credits || 0), [scheduleForm.date, scheduleForm.weekdays, selectedCourse?.credits]);
  const ownedCourses = courses.filter(c => isAdmin || c.lecturerId === lecturerId || schedules.some(s => s.courseId === c.id && s.lecturerId === lecturerId));

  async function loadTasks() {
    try { setTasks(await request<PlannerTask[]>('/api/teaching-tasks')); }
    catch (e) { setError('Không tải được công việc: ' + (e as Error).message); }
  }
  useEffect(() => { void loadTasks(); }, [lecturerId, role]);
  useEffect(() => {
    if (!prefillCourseId) return;
    const c = courses.find(course => course.id === prefillCourseId);
    if (!c) return; // Đợi onRefresh() tải xong học phần vừa tạo.
    setScheduleForm({ ...defaultSchedule(key(new Date()), isAdmin ? c.lecturerId || '' : lecturerId), courseId: prefillCourseId });
    setEditingId(null); setEditingPlanId(''); setError(''); setModal('schedule');
    onPrefillConsumed?.();
  }, [prefillCourseId, courses, isAdmin, lecturerId, onPrefillConsumed]);
  function navigate(direction: number) {
    if (view === 'month') setSelected(d => new Date(d.getFullYear(), d.getMonth() + direction, Math.min(d.getDate(), new Date(d.getFullYear(), d.getMonth() + direction + 1, 0).getDate())));
    else setSelected(d => plusDays(d, direction * (view === 'week' ? 7 : 1)));
  }
  function openCreate(kind: Exclude<Modal, null>, date = selectedKey) {
    setModal(kind); setCreateMenu(false); setEditingId(null); setEditingPlanId(''); setError(''); setNotice('');
    if (kind === 'course') setCourseForm({ ...defaultCourse(), lecturerId: isAdmin ? '' : lecturerId });
    if (kind === 'schedule') setScheduleForm(defaultSchedule(date, isAdmin ? '' : lecturerId));
    if (kind === 'task') setTaskForm(defaultTask(date, isAdmin ? '' : lecturerId));
  }
  function editCourse(c: PlannerCourse) {
    if (!isAdmin && c.lecturerId !== lecturerId) { setNotice('Bạn được phân công dạy môn này nhưng chỉ Admin hoặc giảng viên phụ trách chính mới được sửa học phần.'); return; }
    setCourseForm({ ...c, department: faculties.find(f => f.code.toUpperCase() === c.department?.toUpperCase() || f.name.toUpperCase() === c.department?.toUpperCase())?.code || '' }); setEditingId(c.id || null); setModal('course'); setError('');
  }
  function editSchedule(s: PlannerSchedule, date = selectedKey) {
    const first = s.ngayBatDau || date;
    const repeat = !s.ngayKetThuc || s.ngayKetThuc !== first;
    const groupClasses = s.classGroupId
      ? [...new Set(schedules.filter(row => row.classGroupId === s.classGroupId).map(row => row.lop))]
      : [s.lop];
    setScheduleForm({ courseId: s.courseId || courses.find(c => c.name === s.tenMonHoc)?.id || '', lecturerId: s.lecturerId || lecturerId, lop: groupClasses[0] || '', lops: groupClasses, phongHoc: s.phongHoc, caHoc: s.caHoc, tietBatDau: s.tietBatDau || 1, soTiet: 3, date: first, repeatWeekly: repeat, endDate: repeat ? s.ngayKetThuc || '' : '', daysPerWeek: 1, weekdays: [s.thu] });
    setEditingId(s.id || null); setEditingPlanId(s.planId || ''); setModal('schedule'); setError('');
  }
  function editTask(t: PlannerTask) { setTaskForm({ ...t }); setEditingId(t.id || null); setModal('task'); setError(''); }
  async function saveCourse(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...courseForm, lecturerId: isAdmin ? courseForm.lecturerId : lecturerId };
      const saved = await request<PlannerCourse>(editingId ? `/api/courses/${encodeURIComponent(editingId)}` : '/api/courses', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      await onRefresh();
      if (!editingId && saved.id) {
        setScheduleForm({ ...defaultSchedule(selectedKey, isAdmin ? saved.lecturerId || '' : lecturerId), courseId: saved.id });
        setEditingId(null); setEditingPlanId(''); setModal('schedule');
        setNotice('Đã tạo học phần. Chọn ngày bắt đầu và số ngày học/tuần để tạo toàn bộ lịch.');
      } else { setModal(null); setNotice('Đã cập nhật học phần.'); }
    } catch (err) { setError('Không lưu được học phần: ' + (err as Error).message); }
    finally { setBusy(false); }
  }
  function changeDaysPerWeek(days: number) {
    const order = Array.from({ length: 7 }, (_, i) => dayLabels[(fromKey(scheduleForm.date).getDay() + i) % 7]);
    const chosen = scheduleForm.weekdays.slice(0, days);
    for (const day of order) if (chosen.length < days && !chosen.includes(day)) chosen.push(day);
    setScheduleForm({ ...scheduleForm, daysPerWeek: days, weekdays: chosen });
  }
  function toggleWeekday(day: string) {
    const chosen = scheduleForm.weekdays.includes(day) ? scheduleForm.weekdays.filter(x => x !== day) : [...scheduleForm.weekdays, day];
    setScheduleForm({ ...scheduleForm, weekdays: chosen });
  }
  function toggleClass(code: string) {
    setScheduleForm(prev => ({ ...prev, lops: prev.lops.includes(code) ? prev.lops.filter(x => x !== code) : [...prev.lops, code] }));
  }
  async function saveSchedule(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (!scheduleForm.courseId) throw new Error('Hãy chọn học phần đã có.');
      if (editingId) {
        if (selectedClasses.length === 0) throw new Error('Hãy chọn ít nhất một lớp học.');
        if (scheduleForm.repeatWeekly && scheduleForm.endDate && scheduleForm.endDate < scheduleForm.date) throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
        const d = fromKey(scheduleForm.date);
        const lecturer = lecturers.find(l => l.id === (isAdmin ? scheduleForm.lecturerId : lecturerId));
        const payload: PlannerSchedule = {
          lop: selectedClasses[0], courseId: scheduleForm.courseId, lecturerId: isAdmin ? scheduleForm.lecturerId : lecturerId,
          tenMonHoc: selectedCourse?.name || '', giangVien: lecturer?.fullName || '', thu: dayLabels[d.getDay()],
          caHoc: scheduleForm.caHoc.trim(), phongHoc: scheduleForm.phongHoc.trim(),
          tietBatDau: scheduleForm.tietBatDau, soTiet: 3,
          ngayBatDau: scheduleForm.date, ngayKetThuc: scheduleForm.repeatWeekly ? scheduleForm.endDate : scheduleForm.date,
        };
        await request(`/api/schedules/${encodeURIComponent(editingId)}/classes`, {
          method: 'PUT', body: JSON.stringify({ schedule: payload, lops: selectedClasses }),
        });
        setSelected(d); setNotice(`Đã cập nhật lịch học cho ${selectedClasses.length} lớp: ${selectedClasses.join(', ')}.`);
      } else {
        if (scheduleForm.weekdays.length !== scheduleForm.daysPerWeek || !planPreview) throw new Error('Hãy chọn đủ số thứ học trong tuần.');
        if (selectedClasses.length === 0) throw new Error('Hãy chọn ít nhất một lớp học.');
        const result = await request<{ firstClassDate: string; endDate: string; totalMeetings: number; classCount: number; totalClassMeetings: number }>('/api/schedules/auto-plan', {
          method: 'POST', body: JSON.stringify({
            courseId: scheduleForm.courseId, lecturerId: isAdmin ? scheduleForm.lecturerId : lecturerId,
            lops: selectedClasses, phongHoc: scheduleForm.phongHoc.trim(), caHoc: scheduleForm.caHoc.trim(),
            tietBatDau: scheduleForm.tietBatDau, ngayBatDau: scheduleForm.date, weekdays: scheduleForm.weekdays,
          }),
        });
        setSelected(fromKey(result.firstClassDate));
        setNotice(`Đã tạo một kế hoạch chung cho ${result.classCount} lớp: ${result.totalMeetings} buổi/lớp (${result.totalClassMeetings} lượt học theo lớp), kết thúc ${result.endDate}.`);
      }
      setModal(null); await onRefresh();
    } catch (err) { setError('Không lưu được lịch học: ' + (err as Error).message); }
    finally { setBusy(false); }
  }
  async function deleteWholePlan(planId: string) {
    if (!window.confirm('Xóa toàn bộ các thứ học trong kế hoạch này? Dữ liệu thời khóa biểu của lớp sẽ được cập nhật.')) return;
    setBusy(true); setError('');
    try {
      await request(`/api/schedules/auto-plan/${encodeURIComponent(planId)}`, { method: 'DELETE' });
      setModal(null); await onRefresh(); setNotice('Đã xóa kế hoạch lịch học. Bạn có thể tạo lại với ngày hoặc số buổi mới.');
    } catch (err) { setError('Không xóa được kế hoạch: ' + (err as Error).message); }
    finally { setBusy(false); }
  }
  async function saveTask(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...taskForm, ownerLecturerId: isAdmin ? taskForm.ownerLecturerId : lecturerId };
      await request(editingId ? `/api/teaching-tasks/${encodeURIComponent(editingId)}` : '/api/teaching-tasks', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setModal(null); await loadTasks(); setSelected(fromKey(payload.dueDate)); setNotice('Đã lưu công việc.');
    } catch (err) { setError('Không lưu được công việc: ' + (err as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(kind: 'course' | 'schedule' | 'task', id?: string) {
    const sharedManualSchedule = kind === 'schedule' && schedules.some(row => row.id === id && !!row.classGroupId);
    const question = sharedManualSchedule
      ? 'Xóa lịch học của tất cả các lớp trong nhóm này?'
      : `Bạn có chắc muốn xóa ${kind === 'course' ? 'học phần' : kind === 'schedule' ? 'lịch học' : 'công việc'} này?`;
    if (!id || !window.confirm(question)) return;
    setBusy(true); setError('');
    try {
      const route = kind === 'course' ? 'courses' : kind === 'schedule' ? 'schedules' : 'teaching-tasks';
      await request(`/api/${route}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (kind === 'task') await loadTasks(); else await onRefresh();
      setModal(null); setNotice('Đã xóa thành công.');
    } catch (err) { setError('Không xóa được: ' + (err as Error).message); }
    finally { setBusy(false); }
  }
  async function toggleTask(t: PlannerTask) {
    if (!t.id) return;
    setBusy(true); setError('');
    try { await request(`/api/teaching-tasks/${encodeURIComponent(t.id)}/toggle`, { method: 'PATCH' }); await loadTasks(); }
    catch (err) { setError('Không cập nhật được công việc: ' + (err as Error).message); }
    finally { setBusy(false); }
  }
  function eventPill(s: PlannerSchedule, index: number, date: string) {
    return <button type="button" key={`${s.id || s.tenMonHoc}-${index}`} className={`tp-event tp-color-${colorIndex(s.courseId || s.tenMonHoc)}`} title={`${s.tenMonHoc} · ${lessonLabel(s)} · ${s.lop}`} onClick={e => { e.stopPropagation(); editSchedule(s, date); }}>
      <span>{s.tietBatDau ? `T${s.tietBatDau}` : '●'}</span>{s.tenMonHoc} <small>· {s.lop}</small>
    </button>;
  }
  return <div className="tp-root">
    <div className="tp-toolbar">
      <div className="tp-brand"><CalendarDays size={23}/><div><strong>Lịch giảng & Công việc</strong><small>Quản lý môn học, buổi giảng và nhiệm vụ</small></div></div>
      <div className="tp-navigation"><button type="button" className="tp-today" onClick={() => setSelected(new Date())}>Hôm nay</button><button type="button" aria-label="Trước" onClick={() => navigate(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label="Sau" onClick={() => navigate(1)}><ChevronRight size={18}/></button><b>{heading}</b></div>
      <div className="tp-toolbar-right"><select aria-label="Chế độ xem" value={view} onChange={e => setView(e.target.value as View)}><option value="month">Tháng</option><option value="week">Tuần</option><option value="day">Ngày</option></select><button type="button" className="tp-reload" title="Tải lại dữ liệu" onClick={() => { void onRefresh(); void loadTasks(); }}><RefreshCw size={17}/></button></div>
    </div>
    {notice && <div className="tp-notice" role="status"><Check size={16}/>{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice('')}><X size={15}/></button></div>}
    {error && !modal && <div className="tp-error" role="alert">{error}<button type="button" onClick={() => setError('')}><X size={15}/></button></div>}
    <div className="tp-layout">
      <aside className="tp-left">
        <div className="tp-create-wrap"><button type="button" className="tp-create" onClick={() => setCreateMenu(v => !v)}><Plus size={21}/> Tạo mới <span>▾</span></button>
          {createMenu && <div className="tp-create-menu"><button type="button" onClick={() => openCreate('schedule')}><CalendarDays size={17}/> Lịch học</button><button type="button" onClick={() => openCreate('course')}><BookOpen size={17}/> Học phần</button><button type="button" onClick={() => openCreate('task')}><ClipboardList size={17}/> Công việc</button></div>}
        </div>
        <div className="tp-left-block"><h3>Ngày đang chọn</h3><label className="tp-date-select"><CalendarDays size={16}/><input type="date" value={selectedKey} onChange={e => e.target.value && setSelected(fromKey(e.target.value))}/></label><div className="tp-day-bubble"><strong>{selected.getDate()}</strong><span>{dateText(selected)}</span></div></div>
        <div className="tp-left-block"><div className="tp-heading-row"><h3>Học phần</h3><button type="button" title="Tạo học phần" onClick={() => openCreate('course')}><Plus size={16}/></button></div><input className="tp-course-search" placeholder="Tìm học phần..." aria-label="Tìm học phần" value={courseSearch} onChange={e => setCourseSearch(e.target.value)}/>
          <div className="tp-course-list">{ownedCourses.filter(c => `${c.code} ${c.name}`.toLowerCase().includes(courseSearch.toLowerCase())).map(c => <button type="button" key={c.id} onClick={() => editCourse(c)}><span className={`tp-course-dot tp-color-${colorIndex(c.id || c.name)}`}/><span><strong>{c.name}</strong><small>{c.code} · {c.credits} tín chỉ · {c.credits * 15} tiết</small></span><Pencil size={13}/></button>)}{ownedCourses.length === 0 && <p>Chưa có học phần. Bấm “Tạo mới” để bắt đầu.</p>}</div>
        </div>
      </aside>
      <main className="tp-main">
        {view !== 'day' ? <div className={`tp-calendar tp-${view}`}>
          <div className="tp-weekday-head">{['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map(x => <span key={x}>{x}</span>)}</div>
          <div className="tp-cells">{cells.map(d => { const k = key(d); const lessons = scheduleForDate(schedules, d); const due = tasks.filter(t => t.dueDate === k); return <div key={k} className={`tp-cell ${d.getMonth() !== selected.getMonth() && view === 'month' ? 'tp-outside' : ''} ${k === todayKey ? 'tp-is-today' : ''} ${k === selectedKey ? 'tp-selected' : ''}`}>
            <button type="button" className="tp-cell-date" onClick={() => { setSelected(d); setView('day'); }} aria-label={`Xem lịch ngày ${dateText(d)}`}>{d.getDate()}</button>
            <div className="tp-cell-events">{lessons.slice(0, view === 'week' ? 5 : 2).map((s, i) => eventPill(s, i, k))}{due.slice(0, view === 'week' ? 4 : 2).map(t => <button type="button" key={t.id} className={`tp-task-pill ${t.completed ? 'done' : ''}`} onClick={() => editTask(t)}><ClipboardList size={12}/>{t.title}</button>)}{lessons.length + due.length > (view === 'week' ? 9 : 4) && <button className="tp-more" type="button" onClick={() => { setSelected(d); setView('day'); }}>+ Xem thêm</button>}</div>
            <button type="button" className="tp-cell-add" aria-label={`Tạo lịch học ngày ${dateText(d)}`} onClick={() => { setSelected(d); openCreate('schedule', k); }}><Plus size={14}/></button>
          </div>; })}</div>
        </div> : <div className="tp-day-view"><div className="tp-day-title"><div><span>LỊCH THEO NGÀY</span><h2>{dateText(selected)}</h2><p>{selectedLessons.length} buổi học · {selectedTasks.length} công việc</p></div><button type="button" onClick={() => openCreate('schedule')}><Plus size={16}/> Thêm buổi học</button></div>
          <div className="tp-timeline">{selectedLessons.length === 0 && selectedTasks.length === 0 ? <div className="tp-empty"><CalendarDays size={34}/><h3>Chưa có lịch trong ngày này</h3><p>Bấm “Tạo mới” để thêm buổi học hoặc công việc.</p></div> : <>
            {selectedLessons.map((s, i) => <article className={`tp-lesson-card tp-color-${colorIndex(s.courseId || s.tenMonHoc)}`} key={`${s.id}-${i}`}><div className="tp-period">{lessonLabel(s)}</div><div className="tp-lesson-content"><strong>{s.tenMonHoc}</strong><div><Users size={15}/> Lớp {s.lop}</div><div><Clock3 size={15}/> {s.caHoc}</div><div><MapPin size={15}/> Phòng {s.phongHoc}</div><div><UserRound size={15}/> {s.giangVien}</div></div><div className="tp-item-actions"><button type="button" title="Sửa lịch" onClick={() => editSchedule(s)}><Pencil size={16}/></button><button type="button" title="Xóa lịch" disabled={busy} onClick={() => s.planId ? void deleteWholePlan(s.planId) : void remove('schedule', s.id)}><Trash2 size={16}/></button></div></article>)}
            {selectedTasks.map(t => <article key={t.id} className={`tp-daily-task ${t.completed ? 'done' : ''}`}><button type="button" className="tp-task-check" aria-label={t.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'} onClick={() => void toggleTask(t)}>{t.completed ? <Check size={17}/> : null}</button><div><strong>{t.title}</strong><p>{t.description || 'Công việc trong ngày'}</p></div><button type="button" title="Sửa công việc" onClick={() => editTask(t)}><Pencil size={15}/></button></article>)}
          </>}</div>
        </div>}
      </main>
      <aside className="tp-right"><div className="tp-heading-row"><div><h3><ClipboardList size={18}/> Công việc</h3><p>{tasks.filter(t => !t.completed).length} việc chưa hoàn thành</p></div><button type="button" aria-label="Thêm công việc" onClick={() => openCreate('task')}><Plus size={17}/></button></div>
        <label className="tp-done-toggle"><input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)}/> Hiện việc đã xong</label>
        <div className="tp-task-list">{pendingTasks.map(t => <article key={t.id} className={`tp-task-row ${t.completed ? 'done' : ''}`}><button type="button" className="tp-task-check" title="Đổi trạng thái" onClick={() => void toggleTask(t)}>{t.completed ? <Check size={15}/> : null}</button><div className="tp-task-info"><button type="button" onClick={() => { setSelected(fromKey(t.dueDate)); setView('day'); }}>{t.title}</button><small>{t.dueDate.split('-').reverse().join('/')} {t.className ? `· ${t.className}` : ''}</small>{t.courseId && <span>{courses.find(c => c.id === t.courseId)?.name || 'Học phần'}</span>}</div><button type="button" title="Sửa công việc" onClick={() => editTask(t)}><Pencil size={14}/></button></article>)}{pendingTasks.length === 0 && <div className="tp-task-empty"><Check size={22}/><p>Không có công việc đang chờ.</p></div>}</div>
      </aside>
    </div>
    {modal && <div className="tp-modal-backdrop"><section className="tp-modal" role="dialog" aria-modal="true" aria-labelledby="tp-modal-title"><header><div><span>{modal === 'course' ? 'HỌC PHẦN' : modal === 'schedule' ? 'LỊCH HỌC' : 'GOOGLE TASKS STYLE'}</span><h2 id="tp-modal-title">{editingId ? 'Chỉnh sửa ' : 'Tạo '}{modal === 'course' ? 'học phần' : modal === 'schedule' ? 'lịch học' : 'công việc'}</h2></div><button type="button" aria-label="Đóng" onClick={() => { setModal(null); setError(''); }}><X size={20}/></button></header>
      {error && <div className="tp-error" role="alert">{error}</div>}
      {modal === 'course' && <form className="tp-form" onSubmit={e => void saveCourse(e)}>
        <div className="tp-form-two"><label>Mã học phần<input required maxLength={40} placeholder="VD: IT204" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}/></label><label>Số tín chỉ<input required type="number" min={1} max={10} value={courseForm.credits} onChange={e => setCourseForm({ ...courseForm, credits: Number(e.target.value) })}/></label></div>
        <label>Tên học phần<input required maxLength={160} placeholder="VD: Lập trình Java" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}/></label>
        <div className="tp-form-two"><label>Khoa<select required value={courseForm.department} onChange={e => setCourseForm({ ...courseForm, department: e.target.value })}><option value="">-- Chọn khoa --</option>{faculties.map(f=><option key={f.id} value={f.code}>{f.code} – {f.name}</option>)}{courseForm.department&&!faculties.some(f=>f.code===courseForm.department)&&<option value={courseForm.department}>{courseForm.department} (khoa cũ)</option>}</select></label><label>Học kỳ<input placeholder="2026-2027 HK1" value={courseForm.semester} onChange={e => setCourseForm({ ...courseForm, semester: e.target.value })}/></label></div>
        <div className="tp-credit-summary"><BookOpen size={18}/><div><strong>{courseForm.credits} tín chỉ = {courseForm.credits * 15} tiết</strong><span>Mỗi buổi 3 tiết · Tổng cộng {courseForm.credits * 5} buổi học. Ngày kết thúc sẽ được tính khi xếp lịch.</span></div></div>
        {isAdmin ? <label>Giảng viên phụ trách<select required value={courseForm.lecturerId || ''} onChange={e => setCourseForm({ ...courseForm, lecturerId: e.target.value })}><option value="">-- Chọn giảng viên --</option>{lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName} ({l.code})</option>)}</select></label> : <div className="tp-form-hint">Học phần mới sẽ được phân công cho chính tài khoản giảng viên của bạn.</div>}
        <footer>{editingId && <button type="button" className="tp-delete" disabled={busy} onClick={() => void remove('course', editingId)}><Trash2 size={15}/> Xóa</button>}<button type="button" onClick={() => setModal(null)}>Hủy</button><button type="submit" className="tp-save" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu học phần'}</button></footer>
      </form>}
      {modal === 'schedule' && editingPlanId ? <div className="tp-form">
        <div className="tp-plan-info"><strong>Kế hoạch lịch học tự động</strong><p>Học phần {selectedCourse?.name || 'đã chọn'} · {planClasses.length} lớp: {planClasses.join(', ')} · {planStartDate} đến {planEndDate}.</p><p>Để thay đổi ngày bắt đầu hoặc số ngày học mỗi tuần mà vẫn bảo đảm đúng tổng số buổi, hãy xóa cả kế hoạch và tạo lại.</p></div>
        <footer><button type="button" onClick={() => setModal(null)}>Đóng</button><button type="button" className="tp-delete" disabled={busy} onClick={() => void deleteWholePlan(editingPlanId)}><Trash2 size={15}/> Xóa toàn bộ kế hoạch</button></footer>
      </div> : null}
      {modal === 'schedule' && !editingPlanId && <form className="tp-form" onSubmit={e => void saveSchedule(e)}>
        <label>Học phần đã có<select required value={scheduleForm.courseId} onChange={e => { const c = courses.find(x => x.id === e.target.value); const limit = Math.min(7, (c?.credits || 1) * 5); const count = Math.min(scheduleForm.daysPerWeek, limit); setScheduleForm({ ...scheduleForm, courseId: e.target.value, lecturerId: isAdmin ? c?.lecturerId || '' : lecturerId, daysPerWeek: count, weekdays: scheduleForm.weekdays.slice(0, count) }); }}><option value="">-- Chọn môn học --</option>{ownedCourses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name} ({c.credits} tín chỉ)</option>)}</select></label>
        <div className="tp-form-two"><label>Ngày bắt đầu<input required type="date" value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}/></label>
        <div className="tp-class-field"><span>Chọn nhiều lớp học <b>({selectedClasses.length} đã chọn)</b></span><details className="tp-class-picker"><summary>{selectedClasses.length ? selectedClasses.join(', ') : '-- Chọn một hoặc nhiều lớp --'}</summary><div className="tp-class-options"><div className="tp-class-actions"><button type="button" onClick={() => setScheduleForm(prev => ({ ...prev, lops: [...new Set(classNames)] }))}>Chọn tất cả</button><button type="button" onClick={() => setScheduleForm(prev => ({ ...prev, lops: [] }))}>Bỏ chọn</button></div>{[...new Set([...classNames, ...selectedClasses])].map(code => <label key={code}><input type="checkbox" checked={selectedClasses.includes(code)} onChange={() => toggleClass(code)}/>{code}{!classNames.includes(code) ? ' (lớp cũ)' : ''}</label>)}{classNames.length === 0 && selectedClasses.length === 0 && <p>Chưa có lớp. Admin hãy tạo lớp tại mục Khoa & Lớp.</p>}</div></details>{selectedClasses.length > 0 && <div className="tp-selected-classes">{selectedClasses.map(code => <button key={code} type="button" title={`Bỏ lớp ${code}`} onClick={() => toggleClass(code)}>{code} <X size={12}/></button>)}</div>}</div></div>
        {isAdmin && <label>Giảng viên giảng dạy<select required value={scheduleForm.lecturerId} onChange={e => setScheduleForm({ ...scheduleForm, lecturerId: e.target.value })}><option value="">-- Chọn giảng viên --</option>{lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName} ({l.code})</option>)}</select></label>}
        <div className="tp-form-two"><label>Tiết bắt đầu<input required type="number" min={1} max={14} value={scheduleForm.tietBatDau} onChange={e => setScheduleForm({ ...scheduleForm, tietBatDau: Number(e.target.value) })}/></label><label>Số tiết mỗi buổi<input readOnly type="number" value={3}/></label></div>
        <div className="tp-form-two"><label>Ca học<input required list="tp-shift-options" value={scheduleForm.caHoc} onChange={e => setScheduleForm({ ...scheduleForm, caHoc: e.target.value })}/><datalist id="tp-shift-options"><option value="Sáng (7:30 - 11:30)"/><option value="Chiều (13:00 - 17:00)"/><option value="Tối (18:00 - 21:00)"/></datalist></label><label>Phòng học<input required placeholder="VD: A302" value={scheduleForm.phongHoc} onChange={e => setScheduleForm({ ...scheduleForm, phongHoc: e.target.value })}/></label></div>
        {!editingId ? <>
          <div className="tp-form-two"><label>Số ngày học trong tuần<select value={scheduleForm.daysPerWeek} onChange={e => changeDaysPerWeek(Number(e.target.value))}>{weekOptions.slice(0, Math.min(7, (selectedCourse?.credits || 1) * 5)).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} ngày/tuần</option>)}</select></label><div className="tp-form-hint">Chọn đúng các thứ học để hệ thống tính ngày kết thúc. Nếu ngày bắt đầu không trùng thứ đã chọn, buổi đầu tiên sẽ là ngày học kế tiếp.</div></div>
          <div className="tp-weekdays"><strong>Chọn các thứ học ({scheduleForm.weekdays.length}/{scheduleForm.daysPerWeek})</strong><div>{weekOptions.map(day => <label key={day} className={scheduleForm.weekdays.includes(day) ? 'selected' : ''}><input type="checkbox" checked={scheduleForm.weekdays.includes(day)} onChange={() => toggleWeekday(day)}/>{day}</label>)}</div></div>
          {planPreview && scheduleForm.weekdays.length === scheduleForm.daysPerWeek ? <div className="tp-plan-summary"><strong>{selectedCourse?.credits} tín chỉ = {planPreview.totalPeriods} tiết = {planPreview.totalMeetings} buổi</strong><span>{scheduleForm.daysPerWeek} ngày/tuần · Mỗi buổi 3 tiết · {selectedClasses.length} lớp · cùng một kế hoạch · {planPreview.totalMeetings * selectedClasses.length} lượt học theo lớp</span><span>Buổi đầu tiên: <b>{planPreview.firstDate.split('-').reverse().join('/')}</b></span><span>Ngày kết thúc tự động: <b>{planPreview.endDate.split('-').reverse().join('/')}</b></span><small>{weekOptions.filter(day => scheduleForm.weekdays.includes(day)).map(day => `${day}: ${planPreview.counts[day]} buổi`).join(' · ')}</small></div> : <div className="tp-form-hint tp-warning">Chọn học phần và đúng {scheduleForm.daysPerWeek} thứ học để xem ngày kết thúc tự động.</div>}
        </> : <>
          <label className="tp-repeat"><input type="checkbox" checked={scheduleForm.repeatWeekly} onChange={e => setScheduleForm({ ...scheduleForm, repeatWeekly: e.target.checked })}/> Lặp lại hằng tuần vào {scheduleForm.date ? dayLabels[fromKey(scheduleForm.date).getDay()] : 'ngày đã chọn'}</label>
          {scheduleForm.repeatWeekly && <label>Ngày kết thúc của lịch cũ<input type="date" min={scheduleForm.date} value={scheduleForm.endDate} onChange={e => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}/></label>}
          <div className="tp-form-hint">Có thể chọn nhiều lớp cùng học buổi này. Khi lưu, lịch được đồng bộ cho tất cả lớp đã chọn. Muốn tạo đủ số buổi theo tín chỉ, hãy dùng Tạo lịch học mới.</div>
        </>}
        <footer>{editingId && <button type="button" className="tp-delete" disabled={busy} onClick={() => void remove('schedule', editingId)}><Trash2 size={15}/> Xóa</button>}<button type="button" onClick={() => setModal(null)}>Hủy</button><button type="submit" className="tp-save" disabled={busy || selectedClasses.length === 0 || (!editingId && (!planPreview || scheduleForm.weekdays.length !== scheduleForm.daysPerWeek))}>{busy ? 'Đang lưu...' : editingId ? `Lưu lịch cho ${selectedClasses.length} lớp` : `Tạo lịch chung cho ${selectedClasses.length} lớp`}</button></footer>
      </form>}
      {modal === 'task' && <form className="tp-form" onSubmit={e => void saveTask(e)}>
        <label>Tiêu đề công việc<input required maxLength={160} placeholder="VD: Chuẩn bị slide buổi học" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}/></label>
        <label>Mô tả<textarea rows={3} maxLength={2000} placeholder="Nội dung cần hoàn thành..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}/></label>
        <div className="tp-form-two"><label>Ngày thực hiện<input required type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}/></label><label>Lớp (tùy chọn)<input list="tp-task-classes" value={taskForm.className} onChange={e => setTaskForm({ ...taskForm, className: e.target.value })}/><datalist id="tp-task-classes">{classNames.map(x => <option key={x} value={x}/>)}</datalist></label></div>
        <label>Học phần liên quan (tùy chọn)<select value={taskForm.courseId} onChange={e => setTaskForm({ ...taskForm, courseId: e.target.value })}><option value="">Không gắn học phần</option>{ownedCourses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}</select></label>
        {isAdmin && <label>Giao cho giảng viên<select value={taskForm.ownerLecturerId} onChange={e => setTaskForm({ ...taskForm, ownerLecturerId: e.target.value })}><option value="">Công việc của Admin</option>{lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName} ({l.code})</option>)}</select></label>}
        {editingId && <label className="tp-repeat"><input type="checkbox" checked={taskForm.completed} onChange={e => setTaskForm({ ...taskForm, completed: e.target.checked })}/> Đã hoàn thành</label>}
        <footer>{editingId && <button type="button" className="tp-delete" disabled={busy} onClick={() => void remove('task', editingId)}><Trash2 size={15}/> Xóa</button>}<button type="button" onClick={() => setModal(null)}>Hủy</button><button type="submit" className="tp-save" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu công việc'}</button></footer>
      </form>}
    </section></div>}
  </div>;
}
