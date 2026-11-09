import { useEffect, useState, type FormEvent } from 'react';
import GraduationConditionsPage from './graduation/GraduationConditionsPage';
import StudentCalendar from './calendar/StudentCalendar';
import TeachingPlanner from './planner/TeachingPlanner';
import AcademicStructurePage, { type Faculty, type AcademicClass } from './academics/AcademicStructurePage';
import { BookOpen, GraduationCap, LayoutDashboard, Users, CalendarDays, ClipboardList, Bell, LogOut, Plus, Trash2, RefreshCw, MessageCircle, School, MapPin, Mail, Phone, ArrowRight, Send, Home } from 'lucide-react';

type Student = { id?: string; maSV: string; hoTen: string; email: string; soDienThoai?: string; lop: string; password?: string };
type Course = { id?: string; code: string; name: string; credits: number; department: string; semester: string; lecturerId?: string };
type Schedule = { id?: string; planId?: string; classGroupId?: string; lop: string; tenMonHoc: string; thu: string; caHoc: string; phongHoc: string; giangVien: string; courseId?: string; lecturerId?: string; tietBatDau?: number | null; soTiet?: number | null; ngayBatDau?: string; ngayKetThuc?: string };
type Lecturer = { id?: string; code: string; fullName: string; email: string; department: string; password?: string; payPerCredit?: number; loginEnabled?: boolean };
type TeachingLine = { courseId: string; courseCode: string; courseName: string; semester: string; credits: number; classCount: number; classes: string[]; unitPrice: number; amount: number };
type TeachingPayment = { lecturerId: string; lecturerCode: string; lecturerName: string; unitPrice: number; totalClasses: number; totalCredits: number; totalAmount: number; details: TeachingLine[] };
type Exam = { id?: string; courseId: string; date: string; startTime: string; room: string; semester: string };
type Tuition = { id?: string; maSV: string; semester: string; amount: number; paidAmount: number; status?: string };
type Grade = { id?: string; maSV: string; courseId: string; processScore: number; examScore: number };
type Enrollment = { id?: string; maSV: string; courseId: string; semester?: string; unitPrice?: number; tuitionAmount?: number };
type SchoolInfo = { id?: string; name: string; tagline: string; introduction: string; training: string; studentSupport: string; address: string; email: string; phone: string; website: string };
type ForumComment = { id: string; author: string; content: string; createdAt: string };
type ForumPost = { id: string; title: string; content: string; author: string; authorRole: string; createdAt: string; comments?: ForumComment[] };
const initialSchoolInfo: SchoolInfo = { name: 'Trường Đại học Đông Á', tagline: 'Cổng thông tin đào tạo và kết nối sinh viên', introduction: 'Thông tin giới thiệu sẽ được nhà trường cập nhật.', training: 'Thông tin chương trình đào tạo sẽ được cập nhật.', studentSupport: 'Thông tin hỗ trợ sinh viên sẽ được cập nhật.', address: '', email: '', phone: '', website: '' };
type CreditPrice = { configured: boolean; pricePerCredit: number };
type AutomaticTuition = { maSV: string; semester: string; courseCount: number; totalCredits: number; amount: number; estimated: boolean };
const vnd = (amount: number) => `${amount.toLocaleString('vi-VN')} đ`;
type Notice = { id?: string; title: string; content: string; createdAt?: string };
type Account = { role: string; name: string; maSV?: string; lecturerId?: string };
type Page = 'dashboard' | 'academics' | 'students' | 'courses' | 'schedules' | 'notifications' | 'enrollments' | 'grades' | 'lecturers' | 'exams' | 'tuition' | 'school' | 'forum' | 'salary' | 'graduation' | 'planner';
const pages: { id: Page; label: string; Icon: typeof BookOpen }[] = [
  { id: 'dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
  { id: 'academics', label: 'Khoa & Lớp', Icon: School },
  { id: 'students', label: 'Sinh viên', Icon: Users },
  { id: 'courses', label: 'Học phần', Icon: BookOpen },
  { id: 'schedules', label: 'Thời khóa biểu', Icon: CalendarDays },
  { id: 'planner', label: 'Lịch giảng & Công việc', Icon: ClipboardList },
  { id: 'notifications', label: 'Thông báo', Icon: Bell },
  { id: 'enrollments', label: 'Đăng ký học phần', Icon: BookOpen },
  { id: 'grades', label: 'Bảng điểm', Icon: GraduationCap },
  { id: 'lecturers', label: 'Giảng viên', Icon: Users },
  { id: 'salary', label: 'Tiền giảng dạy', Icon: BookOpen },
  { id: 'exams', label: 'Lịch thi', Icon: CalendarDays },
  { id: 'tuition', label: 'Học phí', Icon: BookOpen },
  { id: 'graduation', label: 'Điều kiện tốt nghiệp', Icon: GraduationCap },
  { id: 'school', label: 'Thông tin trường', Icon: School },
  { id: 'forum', label: 'Diễn đàn', Icon: MessageCircle },
];
const studentPages: Page[] = ['dashboard','courses','schedules','notifications','enrollments','grades','exams','tuition','graduation','school','forum'];
const adminPages: Page[] = ['dashboard','academics','students','courses','lecturers','salary','schedules','planner','notifications','enrollments','grades','exams','tuition','graduation','school','forum'];
const teacherPages: Page[] = ['dashboard','courses','schedules','planner','salary','notifications','school','forum'];
const AUTH_KEY = 'uniportal-demo-basic-auth';
let authorization = '';
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}), ...options?.headers } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  if (!body) return undefined as T;
  try { return JSON.parse(body) as T; } catch { return body as T; }
}
const initialStudent: Student = { maSV: '', hoTen: '', email: '', soDienThoai: '', lop: '', password: '' };
const initialCourse: Course = { code: '', name: '', credits: 3, department: '', semester: '', lecturerId: '' };
const initialSchedule: Schedule = { lop: '', tenMonHoc: '', thu: 'Thứ 2', caHoc: 'Sáng (7:30 - 11:30)', phongHoc: '', giangVien: '', courseId: '', lecturerId: '', tietBatDau: 1, soTiet: 3, ngayBatDau: '', ngayKetThuc: '' };
const initialLecturer: Lecturer = {code:'',fullName:'',email:'',department:'',password:'',payPerCredit:0};
export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(initialSchoolInfo);
  const [schoolDraft, setSchoolDraft] = useState<SchoolInfo>(initialSchoolInfo);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [forumTitle, setForumTitle] = useState('');
  const [forumContent, setForumContent] = useState('');
  const [forumReplies, setForumReplies] = useState<Record<string, string>>({});
  const [publicError, setPublicError] = useState('');
  const [restoring, setRestoring] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [page, setPage] = useState<Page>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleForm, setScheduleForm] = useState<Schedule>(initialSchedule);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [teachingPayments, setTeachingPayments] = useState<TeachingPayment[]>([]);
  const [editingLecturerId, setEditingLecturerId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [changeOldPassword, setChangeOldPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [tuition, setTuition] = useState<Tuition[]>([]);
  const [creditPrice, setCreditPrice] = useState<CreditPrice>({ configured: false, pricePerCredit: 0 });
  const [priceInput, setPriceInput] = useState('');
  const [automaticTuition, setAutomaticTuition] = useState<AutomaticTuition[]>([]);
  const [lecturerForm, setLecturerForm] = useState<Lecturer>(initialLecturer);
  const [examForm, setExamForm] = useState<Exam>({courseId:'',date:'',startTime:'',room:'',semester:''});
  const [tuitionForm, setTuitionForm] = useState<Tuition>({maSV:'',semester:'',amount:0,paidAmount:0});
  const [myProfile, setMyProfile] = useState<Student | null>(null);
  const [gradeForm, setGradeForm] = useState<Grade>({maSV:'',courseId:'',processScore:0,examScore:0});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentForm, setStudentForm] = useState<Student>(initialStudent);
  const [studentFacultyId, setStudentFacultyId] = useState('');
  const [studentCohort, setStudentCohort] = useState('');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<Course>(initialCourse);
  const [pendingPlanCourseId, setPendingPlanCourseId] = useState('');
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });
  const [showForm, setShowForm] = useState(false);
  const admin = account?.role === 'ADMIN';
  const teacher = account?.role === 'LECTURER';
  useEffect(() => {
    let active = true;
    const saved = sessionStorage.getItem(AUTH_KEY);
    if (!saved) { setRestoring(false); return; }
    authorization = saved;
    void api<Account>('/api/auth/me').then(result => {
      if (!active) return;
      if (['ADMIN','STUDENT','LECTURER'].includes(result.role)) setAccount(result);
      else { authorization=''; sessionStorage.removeItem(AUTH_KEY); }
    }).catch(() => {
      if (active) { authorization=''; sessionStorage.removeItem(AUTH_KEY); }
    }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);
  async function refreshPublic() {
    const [school, posts] = await Promise.allSettled([
      api<SchoolInfo>('/api/public/school'),
      api<ForumPost[]>('/api/forum/posts')
    ]);
    if (school.status === 'fulfilled') { setSchoolInfo(school.value); setSchoolDraft(school.value); }
    if (posts.status === 'fulfilled') { setForumPosts(posts.value); setPublicError(''); }
    else setPublicError('Không tải được diễn đàn. Hãy kiểm tra Backend và thử tải lại.');
  }
  useEffect(() => { void refreshPublic(); }, []);
  async function saveSchool(e: FormEvent) {
    e.preventDefault(); setError(''); setInfo('');
    try {
      const result = await api<SchoolInfo>('/api/public/school', { method: 'PUT', body: JSON.stringify(schoolDraft) });
      setSchoolInfo(result); setSchoolDraft(result); setInfo('Đã cập nhật thông tin trường. Trang công khai sẽ hiển thị nội dung mới.');
    } catch (err) { setError('Không lưu được thông tin trường: ' + (err as Error).message); }
  }
  async function publishPost(e: FormEvent) {
    e.preventDefault(); setError(''); setInfo('');
    try {
      await api('/api/forum/posts', { method: 'POST', body: JSON.stringify({ title: forumTitle, content: forumContent }) });
      setForumTitle(''); setForumContent(''); await refreshPublic(); setInfo('Đã đăng bài viết.');
    } catch (err) { setError('Không đăng được bài viết: ' + (err as Error).message); }
  }
  async function publishReply(e: FormEvent, id: string) {
    e.preventDefault(); setError(''); setInfo('');
    try {
      await api('/api/forum/posts/' + encodeURIComponent(id) + '/comments', { method: 'POST', body: JSON.stringify({ content: forumReplies[id] || '' }) });
      setForumReplies(old => ({ ...old, [id]: '' })); await refreshPublic();
    } catch (err) { setError('Không gửi được bình luận: ' + (err as Error).message); }
  }
  async function deletePost(id: string) {
    if (!admin || !confirm('Bạn muốn xóa bài viết này?')) return;
    try { await api('/api/forum/posts/' + encodeURIComponent(id), { method: 'DELETE' }); await refreshPublic(); setInfo('Đã xóa bài viết.'); }
    catch (err) { setError('Không xóa được bài viết: ' + (err as Error).message); }
  }
  function forumFeed() {
    return <div className="forum-list">
      {forumPosts.length === 0 && <p className="public-empty">Chưa có bài thảo luận. Admin hoặc sinh viên có thể tạo bài đầu tiên sau khi đăng nhập.</p>}
      {forumPosts.map(post => <article className="forum-post" key={post.id}>
        <div className="forum-post-top"><span className="forum-author"><MessageCircle size={16}/>{post.authorRole === 'ADMIN' ? 'Quản trị viên' : post.authorRole === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'} · {post.author}</span><time>{post.createdAt ? new Date(post.createdAt).toLocaleString('vi-VN') : ''}</time></div>
        <div className="forum-post-title"><h3>{post.title}</h3>{admin && <button className="danger" type="button" title="Xóa bài viết" onClick={() => void deletePost(post.id)}><Trash2 size={16}/></button>}</div>
        <p className="forum-post-body">{post.content}</p>
        <div className="forum-comments"><strong><MessageCircle size={15}/> {post.comments?.length || 0} bình luận</strong>
          {(post.comments || []).map(reply => <div className="forum-comment" key={reply.id}><b>{reply.author}</b><small>{reply.createdAt ? new Date(reply.createdAt).toLocaleString('vi-VN') : ''}</small><p>{reply.content}</p></div>)}
          {account && <form className="forum-reply-form" onSubmit={e => void publishReply(e, post.id)}><input required maxLength={800} placeholder="Viết bình luận của bạn..." value={forumReplies[post.id] || ''} onChange={e => setForumReplies(old => ({ ...old, [post.id]: e.target.value }))}/><button className="primary compact" type="submit"><Send size={15}/> Gửi</button></form>}
        </div>
      </article>)}
    </div>;
  }
  function beginCreateStudent() {
    setEditingStudent(null); setStudentForm(initialStudent); setStudentFacultyId(''); setStudentCohort(''); setShowForm(true);
  }
  function beginEditStudent(s: Student) {
    const c = academicClasses.find(x => x.code.toUpperCase() === s.lop?.trim().toUpperCase());
    setEditingStudent(s.maSV); setStudentForm({ ...s, password: '' });
    setStudentFacultyId(c?.facultyId || '__legacy'); setStudentCohort(c?.cohort || ''); setShowForm(true);
  }
  async function submitStudent(e: FormEvent) {
    e.preventDefault();
    const editing = editingStudent;
    const path = editing ? '/api/students/' + encodeURIComponent(editing) : '/api/students';
    const payload = editing
      ? { hoTen: studentForm.hoTen, lop: studentForm.lop, soDienThoai: studentForm.soDienThoai }
      : { hoTen: studentForm.hoTen, lop: studentForm.lop, soDienThoai: studentForm.soDienThoai, password: studentForm.password };
    setError(''); setInfo('');
    if (!studentForm.lop || (!academicClasses.some(c => c.code === studentForm.lop) && !editing)) { setError('Hãy chọn lớp đã tạo trong mục Khoa & Lớp.'); return; }
    try {
      const saved = await api<Student>(path, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setInfo(editing ? 'Đã cập nhật sinh viên.' : `Đã tạo sinh viên ${saved.maSV} – ${saved.email}`);
      setShowForm(false); setEditingStudent(null); setStudentForm(initialStudent); await refresh();
    } catch (err) { setError(`Không thể lưu sinh viên: ${(err as Error).message}`); }
  }
  function beginNewSchedule() {
    setEditingScheduleId(null);
    setScheduleForm(initialSchedule);
    setShowForm(true);
    setError(''); setInfo('');
  }
  function beginEditSchedule(item: Schedule) {
    if (item.planId || item.classGroupId) { setPage('planner'); setShowForm(false); setInfo('Lịch nhiều lớp hoặc lịch tự động được quản lý trong mục Lịch giảng & Công việc.'); return; }
    if (!item.id) return;
    setEditingScheduleId(item.id);
    const course = courses.find(c=>c.id===item.courseId) || courses.find(c=>c.name.trim().toLowerCase()===item.tenMonHoc.trim().toLowerCase());
    const lecturer = lecturers.find(l=>l.id===item.lecturerId) || lecturers.find(l=>l.fullName.trim().toLowerCase()===item.giangVien?.trim().toLowerCase());
    setScheduleForm({ ...item, courseId: course?.id || item.courseId || '', lecturerId: lecturer?.id || item.lecturerId || course?.lecturerId || '' });
    setShowForm(true);
    setError(''); setInfo('');
  }
  function cancelScheduleForm() {
    setShowForm(false);
    setEditingScheduleId(null);
    setScheduleForm(initialSchedule);
  }
  async function submitSchedule(e: FormEvent) {
    e.preventDefault();
    if (!admin) return;
    const selectedCourse = courses.find(c=>c.id===scheduleForm.courseId);
    const selectedLecturer = lecturers.find(l=>l.id===scheduleForm.lecturerId);
    if (!selectedCourse || !selectedLecturer) {
      setError('Vui lòng chọn học phần và giảng viên từ danh sách có sẵn.'); return;
    }
    const data = {
      lop: scheduleForm.lop.trim(),
      tenMonHoc: selectedCourse.name,
      thu: scheduleForm.thu.trim(),
      caHoc: scheduleForm.caHoc.trim(),
      phongHoc: scheduleForm.phongHoc.trim(),
      giangVien: selectedLecturer.fullName,
      courseId: selectedCourse.id || '', lecturerId: selectedLecturer.id || '',
      tietBatDau: scheduleForm.tietBatDau ?? null, soTiet: 3,
      ngayBatDau: scheduleForm.ngayBatDau || '', ngayKetThuc: scheduleForm.ngayKetThuc || ''
    };
    if (!data.lop || !data.thu || !data.caHoc || !data.phongHoc) {
      setError('Vui lòng nhập lớp, thứ, ca học và phòng học.'); return;
    }
    if (data.tietBatDau != null && data.soTiet != null && (data.tietBatDau < 1 || data.tietBatDau > 16 || data.soTiet < 1 || data.soTiet > 10 || data.tietBatDau + data.soTiet - 1 > 16)) {
      setError('Tiết học phải nằm trong khoảng 1–16 và số tiết từ 1–10.'); return;
    }
    if (data.ngayBatDau && data.ngayKetThuc && data.ngayBatDau > data.ngayKetThuc) {
      setError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'); return;
    }
    setError(''); setInfo('');
    try {
      const editing = editingScheduleId;
      await api<Schedule>(editing ? '/api/schedules/' + encodeURIComponent(editing) : '/api/schedules', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(data)
      });
      cancelScheduleForm();
      await refresh();
      setInfo(editing ? 'Đã cập nhật thời khóa biểu.' : 'Đã thêm lịch học mới.');
    } catch (err) { setError('Không lưu được thời khóa biểu: ' + (err as Error).message); }
  }
  async function removeSchedule(item: Schedule) {
    if (!admin || !item.id || !confirm(item.planId || item.classGroupId ? `Xóa toàn bộ nhóm lịch ${item.tenMonHoc} (gồm các lớp liên quan)?` : `Xóa lịch ${item.tenMonHoc} của lớp ${item.lop}?`)) return;
    setError(''); setInfo('');
    try {
      await api<void>(item.planId ? '/api/schedules/auto-plan/' + encodeURIComponent(item.planId) : '/api/schedules/' + encodeURIComponent(item.id), { method: 'DELETE' });
      if (editingScheduleId === item.id) cancelScheduleForm();
      await refresh();
      setInfo('Đã xóa lịch học.');
    } catch (err) { setError('Không xóa được lịch học: ' + (err as Error).message); }
  }
  async function refresh() {
    if (!account) return;
    setLoading(true);
    setError('');
    const failures: string[] = [];
    // Tải độc lập: một API bị lỗi không được làm mất danh sách học phần.
    async function load<T>(name: string, request: Promise<T>, fallback: T): Promise<T> {
      try { return await request; }
      catch (e) {
        failures.push(`${name}: ${(e as Error).message}`);
        return fallback;
      }
    }
    try {
      if (account.role === 'LECTURER') {
        const [c, t, n, mine, payments, facultyList, classList] = await Promise.all([
          load('Học phần',api<Course[]>('/api/courses'),[]),
          load('Lịch giảng',api<Schedule[]>('/api/schedules'),[]),
          load('Thông báo',api<Notice[]>('/api/notifications'),[]),
          load('Hồ sơ giảng viên',api<Lecturer>('/api/lecturers/me'),null as unknown as Lecturer),
          load('Tiền giảng dạy',api<TeachingPayment[]>('/api/lecturer-payments'),[]),
          load('Khoa',api<Faculty[]>('/api/faculties'),[]),
          load('Lớp',api<AcademicClass[]>('/api/academic-classes'),[])
        ]);
        setCourses(c.filter(x=>x.lecturerId===account.lecturerId || t.some(s=>s.courseId===x.id && s.lecturerId===account.lecturerId)));
        setSchedules(t);setNotices(n);setLecturers(mine?[mine]:[]);setTeachingPayments(payments);setFaculties(facultyList);setAcademicClasses(classList);
        if (failures.length) setError('Một số dữ liệu chưa tải được: '+failures.join(' | '));
        return;
      }
      const [s, c, t, n, en, g, profile, ls, es, ts, price, calculated, payments, facultyList, classList] = await Promise.all([
        account.role === 'ADMIN' ? load('Sinh viên', api<Student[]>('/api/students'), students) : Promise.resolve([] as Student[]),
        load('Học phần', api<Course[]>('/api/courses'), courses),
        load('Thời khóa biểu', api<Schedule[]>('/api/schedules'), schedules),
        load('Thông báo', api<Notice[]>('/api/notifications'), notices),
        load('Đăng ký học phần', api<Enrollment[]>('/api/enrollments'), enrollments),
        load('Bảng điểm', api<Grade[]>('/api/grades'), grades),
        account.role === 'STUDENT' ? load('Hồ sơ sinh viên', api<Student>('/api/profile/me'), myProfile) : Promise.resolve(null),
        load('Giảng viên', api<Lecturer[]>('/api/lecturers'), lecturers),
        load('Lịch thi', api<Exam[]>('/api/exams'), exams),
        load('Học phí nhập tay', api<Tuition[]>('/api/tuition'), tuition),
        load('Đơn giá tín chỉ', api<CreditPrice>('/api/credit-price'), creditPrice),
        load('Học phí tự động', api<AutomaticTuition[]>('/api/tuition/automatic'), automaticTuition),
        account.role === 'ADMIN' ? load('Tiền giảng dạy',api<TeachingPayment[]>('/api/lecturer-payments'),teachingPayments) : Promise.resolve([] as TeachingPayment[]),
        load('Khoa',api<Faculty[]>('/api/faculties'),faculties),
        load('Lớp',api<AcademicClass[]>('/api/academic-classes'),academicClasses)
      ]);
      setStudents(s); setCourses(c); setSchedules(t); setNotices(n); setEnrollments(en); setGrades(g);
      setMyProfile(profile); setLecturers(ls); setExams(es); setTuition(ts);
      setCreditPrice(price); setPriceInput(String(price.configured ? price.pricePerCredit : ''));
      setAutomaticTuition(calculated);setTeachingPayments(payments);setFaculties(facultyList);setAcademicClasses(classList);
      if (failures.length) setError('Một số dữ liệu chưa tải được: ' + failures.join(' | '));
    } catch (e) { setError(`Không tải được dữ liệu: ${(e as Error).message}`); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (account) void refresh(); }, [account]);
  async function login(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      authorization = 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode(username + ':' + password)));
      const result = await api<Account>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (!['ADMIN', 'STUDENT', 'LECTURER'].includes(result.role)) throw new Error('Vai trò chưa được hỗ trợ');
      sessionStorage.setItem(AUTH_KEY, authorization); setAccount(result); setPage('dashboard'); setPassword('');
    } catch (e) { authorization = ''; sessionStorage.removeItem(AUTH_KEY); setError(`Đăng nhập thất bại: ${(e as Error).message}`); }
    finally { setLoading(false); }
  }
  async function mutate(path: string, method: 'POST' | 'DELETE', payload?: unknown) {
    setError(''); setInfo('');
    try {
      await api(path, { method, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      setInfo('Thao tác thành công'); setShowForm(false); await refresh();
    } catch (e) { setError(`Thao tác thất bại: ${(e as Error).message}`); }
  }
  function beginNewCourse(){setEditingCourseId(null);setCourseForm(initialCourse);setShowForm(true);setError('');}
  function beginEditCourse(c: Course){setEditingCourseId(c.id||null);setCourseForm({...c,department:faculties.find(f=>f.code.toUpperCase()===c.department?.toUpperCase()||f.name.toUpperCase()===c.department?.toUpperCase())?.code||'',lecturerId:c.lecturerId||''});setShowForm(true);setError('');}
  async function submitCourse(e: FormEvent){
    e.preventDefault();setError('');setInfo('');
    if(!courseForm.lecturerId){setError('Bạn phải chọn giảng viên đã được tạo.');return;}
    if(!faculties.some(f=>f.code===courseForm.department)){setError('Hãy chọn khoa đã tạo trong mục Khoa & Lớp.');return;}
    try{
      const edit=editingCourseId;
      const saved = await api<Course>(edit?'/api/courses/'+encodeURIComponent(edit):'/api/courses',{method:edit?'PUT':'POST',body:JSON.stringify(courseForm)});
      setShowForm(false);setEditingCourseId(null);setCourseForm(initialCourse);await refresh();
      if (!edit && saved.id) { setPendingPlanCourseId(saved.id); setPage('planner'); }
      setInfo(edit?'Đã cập nhật phân công giảng viên.':'Đã tạo học phần. Tiếp theo, chọn Tạo mới → Lịch học để xếp đủ số buổi và tính ngày kết thúc tự động.');
    }catch(e){setError('Không lưu được học phần: '+(e as Error).message);}
  }
  function beginNewLecturer(){setEditingLecturerId(null);setLecturerForm(initialLecturer);setShowForm(true);setError('');}
  function beginEditLecturer(l: Lecturer){setEditingLecturerId(l.id||null);setLecturerForm({...l,password:''});setShowForm(true);setError('');}
  async function submitLecturer(e: FormEvent){
    e.preventDefault();setError('');setInfo('');
    try{
      const edit=editingLecturerId;
      await api<Lecturer>(edit?'/api/lecturers/'+encodeURIComponent(edit):'/api/lecturers',{method:edit?'PUT':'POST',body:JSON.stringify(lecturerForm)});
      setShowForm(false);setEditingLecturerId(null);setLecturerForm(initialLecturer);await refresh();
      setInfo(edit?'Đã cập nhật giảng viên và đơn giá.':'Đã tạo tài khoản giảng viên. Giảng viên có thể đăng nhập bằng email và mật khẩu được cấp.');
    }catch(e){setError('Không lưu được giảng viên: '+(e as Error).message);}
  }
  async function changeTeacherPassword(e: FormEvent){
    e.preventDefault();setError('');setInfo('');
    try{
      await api('/api/auth/change-password',{method:'POST',body:JSON.stringify({oldPassword:changeOldPassword,newPassword:changeNewPassword})});
      setChangeOldPassword('');setChangeNewPassword('');setInfo('Đã đổi mật khẩu. Vui lòng đăng xuất và đăng nhập bằng mật khẩu mới.');
    }catch(e){setError('Không đổi được mật khẩu: '+(e as Error).message);}
  }
  function logout(){authorization='';sessionStorage.removeItem(AUTH_KEY);setAccount(null);setStudents([]);setCourses([]);setSchedules([]);setNotices([]);setEnrollments([]);setGrades([]);setMyProfile(null);setLecturers([]);setExams([]);setTuition([]);setAutomaticTuition([]);setTeachingPayments([]);setCreditPrice({configured:false,pricePerCredit:0});setPage('dashboard');setError('');setInfo('');}
  function salaryTable(rows:TeachingPayment[]){return <>
    {rows.map(x=><div key={x.lecturerId} className="payroll-group"><div className="payroll-summary"><div><strong>{x.lecturerName}</strong><small>{x.lecturerCode} · {vnd(x.unitPrice)}/tín chỉ/lớp</small></div><div><span>{x.totalClasses} lớp · {x.totalCredits} tín chỉ-lớp</span><b>{vnd(x.totalAmount)}</b></div></div>
    <div className="table-scroll"><table><thead><tr><th>Học phần</th><th>Học kỳ</th><th>Tín chỉ</th><th>Số lớp</th><th>Lớp phụ trách</th><th>Đơn giá/tín chỉ</th><th>Thành tiền</th></tr></thead><tbody>
      {x.details.map(d=><tr key={d.courseId}><td><b>{d.courseCode}</b> – {d.courseName}</td><td>{d.semester}</td><td>{d.credits}</td><td>{d.classCount}</td><td>{d.classes.join(', ')||'Chưa xếp lớp'}</td><td>{vnd(d.unitPrice)}</td><td><b>{vnd(d.amount)}</b></td></tr>)}
    </tbody></table>{x.details.length===0&&<p className="empty">Chưa được phân công học phần.</p>}</div></div>)}
    {rows.length===0&&<p className="empty">Chưa có dữ liệu tiền giảng dạy.</p>}
  </>}
  async function saveCreditPrice(e: FormEvent) {
    e.preventDefault(); setError(''); setInfo('');
    const amount = Number(priceInput);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000) {
      setError('Đơn giá phải là số nguyên từ 1 đến 1.000.000.000 VND.'); return;
    }
    try {
      await api<CreditPrice>('/api/credit-price', { method: 'PUT', body: JSON.stringify({ pricePerCredit: amount }) });
      setInfo('Đã lưu đơn giá tín chỉ. Học phần đăng ký mới sẽ áp dụng đơn giá này.');
      await refresh();
    } catch (e) { setError('Không lưu được đơn giá: ' + (e as Error).message); }
  }
  const visibleStudents = students.filter(s => [s.maSV, s.hoTen, s.email, s.lop].some(v => (v || '').toLowerCase().includes(search.toLowerCase())));
  const filteredCourses = courses.filter(c => [c.code, c.name, c.department, c.semester].some(v => (v || '').toLowerCase().includes(courseSearch.trim().toLowerCase())));
  const ownStudent = myProfile;
  // Backend đã lọc lịch theo lớp và quyền sinh viên. Không lọc lần hai ở Frontend:
  // hồ sơ tải chậm hoặc định dạng tên lớp khác nhau có thể làm ẩn lịch hợp lệ.
  const visibleSchedules = schedules
    .filter(s => !admin || [s.lop, s.tenMonHoc, s.thu, s.caHoc, s.phongHoc, s.giangVien].some(v => (v || '').toLowerCase().includes(scheduleSearch.trim().toLowerCase())))
    .sort((a,b) => {
      const days = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
      return days.indexOf(a.thu) - days.indexOf(b.thu) || a.caHoc.localeCompare(b.caHoc, 'vi') || a.lop.localeCompare(b.lop, 'vi');
    });
  if (restoring) return <div className="restoring"><GraduationCap size={36}/><h2>Đang khôi phục phiên đăng nhập...</h2></div>;
  if (!account) return <div className="public-site">
    <header className="public-header">
      <a className="public-logo" href="#home"><GraduationCap size={30}/><span>UNI PORTAL<small>CỔNG THÔNG TIN ĐÀO TẠO</small></span></a>
      <nav aria-label="Điều hướng chính"><a href="#home"><Home size={16}/> Trang chủ</a><a href="#school"><School size={16}/> Thông tin trường</a><a href="#forum"><MessageCircle size={16}/> Diễn đàn</a><a className="nav-login" href="#login">Đăng nhập <ArrowRight size={16}/></a></nav>
    </header>
    <main>
      <section className="public-hero" id="home"><div className="public-hero-content">
        <div className="hero-kicker"><GraduationCap size={18}/> HỆ THỐNG THÔNG TIN ĐÀO TẠO</div>
        <h1>Kết nối tri thức.<br/><span>Đồng hành tương lai.</span></h1>
        <p>Truy cập học phần, thời khóa biểu, học phí và các thông tin đào tạo trên một nền tảng. Cùng trao đổi, học hỏi tại diễn đàn sinh viên.</p>
        <div className="hero-highlights"><span><BookOpen size={17}/> Học phần</span><span><CalendarDays size={17}/> Thời khóa biểu</span><span><MessageCircle size={17}/> Diễn đàn</span></div>
        <a className="hero-school-link" href="#school">Khám phá thông tin trường <ArrowRight size={17}/></a>
      </div>
      <form className="login-card public-login" id="login" onSubmit={login}><span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span><h2>Đăng nhập hệ thống</h2><p>Đăng nhập bằng tài khoản Admin, Sinh viên hoặc Giảng viên đã được cấp.</p><label>Tài khoản / Email<input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Email sinh viên, giảng viên hoặc admin" autoComplete="username"/></label><label>Mật khẩu<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password"/></label>{error && <div className="alert error">{error}</div>}<button className="primary" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'} <ArrowRight size={17}/></button><small>Hệ thống demo dùng HTTP Basic. Chỉ sử dụng trên máy phát triển; cần HTTPS và bảo mật bổ sung trước khi triển khai thật.</small></form>
      </section>
      <section className="public-section" id="school"><div className="public-section-head"><span className="section-kicker">VỀ NHÀ TRƯỜNG</span><h2>{schoolInfo.name}</h2><p>{schoolInfo.tagline}</p></div>
        <div className="school-grid"><article className="school-card school-feature"><School size={28}/><h3>Giới thiệu</h3><p>{schoolInfo.introduction}</p></article><article className="school-card"><BookOpen size={26}/><h3>Đào tạo</h3><p>{schoolInfo.training}</p></article><article className="school-card"><Users size={26}/><h3>Hỗ trợ sinh viên</h3><p>{schoolInfo.studentSupport}</p></article></div>
        {(schoolInfo.address || schoolInfo.email || schoolInfo.phone || schoolInfo.website) && <div className="school-contact">{schoolInfo.address && <span><MapPin size={16}/>{schoolInfo.address}</span>}{schoolInfo.email && <span><Mail size={16}/>{schoolInfo.email}</span>}{schoolInfo.phone && <span><Phone size={16}/>{schoolInfo.phone}</span>}{schoolInfo.website && <a href={/^https?:\/\//i.test(schoolInfo.website) ? schoolInfo.website : '#school'} target="_blank" rel="noreferrer">Website trường <ArrowRight size={14}/></a>}</div>}
      </section>
      <section className="public-section public-forum-section" id="forum"><div className="public-section-head"><span className="section-kicker">CỘNG ĐỒNG SINH VIÊN</span><h2>Diễn đàn học tập</h2><p>Chia sẻ kinh nghiệm, hỏi đáp và kết nối cùng cộng đồng. Đăng nhập để đăng bài và bình luận.</p></div>
        {publicError && <div className="alert error">{publicError}</div>}
        <div className="public-forum-layout"><div>{forumFeed()}</div><aside className="forum-side"><MessageCircle size={32}/><h3>Cùng nhau học hỏi</h3><p>Đăng nhập bằng tài khoản được cấp để đặt câu hỏi, chia sẻ tài liệu và tham gia thảo luận.</p><a className="primary" href="#login">Đăng nhập để thảo luận <ArrowRight size={16}/></a></aside></div>
      </section>
    </main>
    <footer className="public-footer"><div className="public-footer-inner"><div><div className="public-footer-logo"><GraduationCap size={28}/> UNI PORTAL</div><p>{schoolInfo.tagline}</p><small>Trang thông tin mẫu dành cho hệ thống quản lý đào tạo.</small></div><div><b>Điều hướng</b><a href="#home">Trang chủ</a><a href="#school">Thông tin trường</a><a href="#forum">Diễn đàn</a></div><div><b>Liên hệ</b><span>{schoolInfo.address || 'Địa chỉ: Chưa cập nhật'}</span><span>{schoolInfo.email || 'Email: Chưa cập nhật'}</span><span>{schoolInfo.phone || 'Điện thoại: Chưa cập nhật'}</span></div></div><div className="footer-bottom">© {new Date().getFullYear()} UNI PORTAL · Hệ thống quản lý đào tạo · Nội dung trường do Admin cập nhật</div></footer>
  </div>;
  if (teacher) {
    const pay=teachingPayments.find(x=>x.lecturerId===account.lecturerId);
    const teacherPagesInfo=pages.filter(x=>teacherPages.includes(x.id));
    return <div className="app teacher-portal"><aside className="sidebar"><div className="logo"><GraduationCap/><span>UNI LECTURER<small>CỔNG GIẢNG VIÊN</small></span></div><div className="side-caption">MENU GIẢNG VIÊN</div><nav>{teacherPagesInfo.map(({id,label,Icon})=><button key={id} className={page===id?'selected':''} onClick={()=>{setPage(id);setError('');setInfo('')}}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-bottom"><div className="profile"><div className="avatar">{account.name.charAt(0)}</div><div><strong>{account.name}</strong><small>Giảng viên</small></div></div><button className="logout" onClick={logout}><LogOut size={18}/> Đăng xuất</button></div></aside>
    <main className="main"><header className="topbar"><div><span className="eyebrow">CỔNG THÔNG TIN GIẢNG VIÊN</span><h1>{teacherPagesInfo.find(x=>x.id===page)?.label||'Tổng quan'}</h1></div><div className="top-actions"><span className="role">GIẢNG VIÊN</span><button className="icon-button" title="Tải lại" onClick={()=>void refresh()}><RefreshCw size={18}/></button></div></header><div className="content">
      {error&&<div className="alert error">{error}</div>}{info&&<div className="alert success">{info}</div>}{loading&&<p className="muted">Đang tải dữ liệu...</p>}
      {page==='dashboard'&&<><div className="hero"><div><span>GIẢNG VIÊN</span><h2>Xin chào, {account.name}!</h2><p>Tra cứu học phần được phân công, lớp đang dạy, lịch giảng và tiền giảng dạy dự tính.</p></div><GraduationCap size={96}/></div><div className="stats"><div className="stat"><BookOpen/><span>Học phần phụ trách</span><strong>{courses.length}</strong></div><div className="stat"><Users/><span>Lớp giảng dạy</span><strong>{pay?.totalClasses||0}</strong></div><div className="stat"><CalendarDays/><span>Buổi trong thời khóa biểu</span><strong>{schedules.length}</strong></div><div className="stat"><BookOpen/><span>Tiền giảng dạy dự tính</span><strong className="pay-stat">{vnd(pay?.totalAmount||0)}</strong></div></div><section className="panel"><h2>Đổi mật khẩu giảng viên</h2><form className="form-grid" onSubmit={changeTeacherPassword}><label>Mật khẩu hiện tại<input type="password" required value={changeOldPassword} onChange={e=>setChangeOldPassword(e.target.value)}/></label><label>Mật khẩu mới (ít nhất 10 ký tự)<input type="password" required minLength={10} value={changeNewPassword} onChange={e=>setChangeNewPassword(e.target.value)}/></label><button className="primary">Đổi mật khẩu</button></form></section></>}
      {page==='courses'&&<section className="panel"><div className="section-heading"><div><h2>Học phần được phân công</h2><p>Chỉ hiển thị học phần Admin đã giao cho bạn</p></div></div><div className="table-scroll"><table><thead><tr><th>Mã học phần</th><th>Tên học phần</th><th>Số tín chỉ</th><th>Tổng tiết / buổi</th><th>Khoa</th><th>Học kỳ</th></tr></thead><tbody>{courses.map(c=><tr key={c.id}><td><b>{c.code}</b></td><td>{c.name}</td><td>{c.credits}</td><td>{c.credits*15} tiết / {c.credits*5} buổi</td><td>{faculties.find(f=>f.code===c.department||f.name===c.department)?.name||c.department}</td><td>{c.semester}</td></tr>)}</tbody></table>{courses.length===0&&<p className="empty">Admin chưa phân công học phần cho bạn.</p>}</div></section>}
      {page==='schedules'&&<section className="panel"><div className="section-heading"><div><h2>Lịch giảng dạy của tôi</h2><p>Lịch học theo lớp được Admin xếp</p></div><button className="secondary compact" onClick={()=>void refresh()}><RefreshCw size={16}/> Tải lại</button></div><div className="table-scroll"><table><thead><tr><th>Lớp</th><th>Học phần</th><th>Thứ</th><th>Ca học</th><th>Phòng</th><th>Bắt đầu</th><th>Kết thúc</th></tr></thead><tbody>{schedules.map((x,i)=><tr key={x.id||i}><td><b>{x.lop}</b></td><td>{x.tenMonHoc}</td><td>{x.thu}</td><td>{x.caHoc}</td><td>{x.phongHoc}</td><td>{x.ngayBatDau||'—'}</td><td>{x.ngayKetThuc||'—'}</td></tr>)}</tbody></table>{schedules.length===0&&<p className="empty">Chưa có lịch giảng dạy.</p>}</div></section>}
      {page==='planner'&&<TeachingPlanner role="LECTURER" lecturerId={account.lecturerId} courses={courses} schedules={schedules} lecturers={lecturers} faculties={faculties} classNames={academicClasses.map(c=>c.code)} request={api} onRefresh={refresh}/>}
      {page==='salary'&&<section className="panel"><div className="section-heading"><div><h2>Tiền giảng dạy dự tính</h2><p>Đơn giá/tín chỉ × số tín chỉ × số lớp đã phân công</p></div></div>{salaryTable(teachingPayments)}<p className="muted">Số lớp được tính theo các lớp khác nhau của từng học phần trong thời khóa biểu, không tính theo số buổi. Đây không phải xác nhận đã thanh toán.</p></section>}
      {page==='notifications'&&<section className="panel"><h2>Thông báo đào tạo</h2>{notices.map(n=><div className="notice" key={n.id}><b>{n.title}</b><p>{n.content}</p></div>)}{notices.length===0&&<p className="empty">Chưa có thông báo.</p>}</section>}
      {page==='school'&&<section className="panel school-profile"><h2>{schoolInfo.name}</h2><p>{schoolInfo.tagline}</p><h4>Giới thiệu</h4><p>{schoolInfo.introduction}</p><h4>Đào tạo</h4><p>{schoolInfo.training}</p><h4>Hỗ trợ</h4><p>{schoolInfo.studentSupport}</p></section>}
      {page==='forum'&&<section className="panel"><div className="section-heading"><div><h2>Diễn đàn</h2><p>Thảo luận cùng sinh viên và giảng viên</p></div><button className="secondary compact" onClick={()=>void refreshPublic()}><RefreshCw size={16}/> Tải lại</button></div><form className="forum-new-post" onSubmit={publishPost}><label>Tiêu đề<input required maxLength={120} value={forumTitle} onChange={e=>setForumTitle(e.target.value)}/></label><label>Nội dung<textarea required maxLength={4000} value={forumContent} onChange={e=>setForumContent(e.target.value)}/></label><button className="primary">Đăng bài</button></form>{forumFeed()}</section>}
      <div className="disclaimer">Thông tin tiền giảng dạy là dự tính theo phân công; không phải bảng lương chính thức.</div>
    </div><footer className="portal-footer">© {new Date().getFullYear()} UNI PORTAL · Cổng giảng viên</footer></main></div>;
  }
  return <div className={admin ? "app admin-portal" : "app student-portal"}><aside className="sidebar"><div className="logo"><GraduationCap/><span>{admin?"UNI ADMIN":"UNI STUDENT"}<small>{admin?"PHÒNG ĐÀO TẠO":"CỔNG SINH VIÊN"}</small></span></div><div className="side-caption">MENU CHÍNH</div><nav>{pages.filter(p=>(admin?adminPages:studentPages).includes(p.id)).map(({id,label,Icon})=><button key={id} className={page===id?'selected':''} onClick={()=>{setPage(id);setShowForm(false);setEditingScheduleId(null);setError('');setInfo('')}}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-bottom"><div className="profile"><div className="avatar">{account.name.charAt(0)}</div><div><strong>{account.name}</strong><small>{admin?'Quản trị viên':'Sinh viên'}</small></div></div><button className="logout" onClick={logout}><LogOut size={18}/> Đăng xuất</button></div></aside><main className="main"><header className="topbar"><div><span className="eyebrow">{admin?"HỆ THỐNG QUẢN LÝ ĐÀO TẠO":"CỔNG THÔNG TIN SINH VIÊN"}</span><h1>{pages.find(p=>p.id===page)?.label}</h1></div><div className="top-actions"><span className="role">{admin?'ADMIN':'SINH VIÊN'}</span><button className="icon-button" onClick={()=>void refresh()} title="Làm mới"><RefreshCw size={18}/></button></div></header><div className="content">{error&&<div className="alert error">{error}</div>}{info&&<div className="alert success">{info}</div>}{loading&&<div className="muted">Đang tải dữ liệu...</div>}
  {page==='dashboard'&&<><div className="hero"><div><span>HỌC KỲ 2026</span><h2>{admin?"Chào mừng quản trị viên!":`Xin chào, ${account.name}!`}</h2><p>{admin?"Quản lý sinh viên, học phần và dữ liệu đào tạo trên một hệ thống.":"Tra cứu học phần, lịch học, lịch thi, bảng điểm và học phí của bạn."}</p></div><GraduationCap size={96} strokeWidth={1.2}/></div><div className="stats"><div className="stat"><Users/><span>{admin?'Sinh viên':'Học phần đã đăng ký'}</span><strong>{admin?students.length:enrollments.length}</strong></div><div className="stat"><BookOpen/><span>Học phần</span><strong>{courses.length}</strong></div><div className="stat"><CalendarDays/><span>Lịch học {admin?'':'của lớp'}</span><strong>{visibleSchedules.length}</strong></div><div className="stat"><Bell/><span>Thông báo</span><strong>{notices.length}</strong></div></div><div className="panel"><h3>Thông báo mới nhất</h3>{notices.length===0?<p className="muted">Chưa có thông báo.</p>:notices.slice(0,4).map(n=><div className="notice" key={n.id}><b>{n.title}</b><p>{n.content}</p></div>)}</div></>}
  {page==='academics'&&admin&&<AcademicStructurePage faculties={faculties} classes={academicClasses} request={api} onRefresh={refresh}/>}
  {page==='students'&&admin&&<section className="panel"><div className="section-heading"><div><h2>Quản lý hồ sơ sinh viên</h2><p>Mã 6 số và email @donga.edu.vn được hệ thống tự cấp khi thêm mới</p></div><button className="primary compact" onClick={()=>{if(showForm){setShowForm(false);setEditingStudent(null)}else beginCreateStudent()}}><Plus size={16}/>{showForm?'Đóng biểu mẫu':'Thêm sinh viên'}</button></div><input className="search" placeholder="Tìm theo mã, tên, email, lớp..." value={search} onChange={e=>setSearch(e.target.value)}/>{showForm&&<form className="form-grid" onSubmit={submitStudent}><div className="form-note">{editingStudent?`Đang sửa sinh viên ${editingStudent}. Email sẽ cập nhật nếu thay đổi tên.`:'Mã sinh viên gồm 6 chữ số và email được tự động tạo khi lưu. Ví dụ: Huỳnh Trần Bình An → an107445@donga.edu.vn.'}</div><label>Họ và tên<input required value={studentForm.hoTen} onChange={e=>setStudentForm({...studentForm,hoTen:e.target.value})}/></label><label>Khoa<select required value={studentFacultyId} onChange={e=>{setStudentFacultyId(e.target.value);setStudentCohort('');setStudentForm({...studentForm,lop:''});}}><option value="">-- Chọn khoa --</option>{faculties.map(f=><option key={f.id} value={f.id}>{f.code} – {f.name}</option>)}{editingStudent&&studentFacultyId==='__legacy'&&<option value="__legacy">Chưa phân loại (lớp cũ)</option>}</select></label>
    <label>Khóa tuyển sinh<select required={studentFacultyId!=='__legacy'} disabled={!studentFacultyId||studentFacultyId==='__legacy'} value={studentCohort} onChange={e=>{setStudentCohort(e.target.value);setStudentForm({...studentForm,lop:''});}}><option value="">-- Chọn khóa --</option>{Array.from(new Set(academicClasses.filter(c=>c.facultyId===studentFacultyId).map(c=>c.cohort))).sort().map(cohort=><option key={cohort} value={cohort}>{faculties.find(f=>f.id===studentFacultyId)?.code}{cohort} – Khóa {cohort}</option>)}</select></label>
    <label>Lớp<select required value={studentForm.lop} onChange={e=>setStudentForm({...studentForm,lop:e.target.value})}><option value="">-- Chọn lớp đã tạo --</option>{academicClasses.filter(c=>c.facultyId===studentFacultyId&&c.cohort===studentCohort).map(c=><option key={c.id} value={c.code}>{c.code} – Lớp {c.section}</option>)}{editingStudent&&studentForm.lop&&!academicClasses.some(c=>c.code===studentForm.lop)&&<option value={studentForm.lop}>{studentForm.lop} (lớp cũ, chưa phân loại)</option>}</select></label>
    {academicClasses.length===0&&<div className="form-note">Chưa có lớp. Vào mục Khoa & Lớp để tạo IT24A trước khi thêm sinh viên.</div>}
    {editingStudent&&studentFacultyId==='__legacy'&&<div className="form-note">Sinh viên này đang thuộc lớp cũ chưa khai báo. Bạn có thể giữ nguyên hoặc chọn khoa và lớp mới.</div>}<label>Số điện thoại<input value={studentForm.soDienThoai||''} onChange={e=>setStudentForm({...studentForm,soDienThoai:e.target.value})}/></label>{!editingStudent&&<label>Mật khẩu khởi tạo (ít nhất 10 ký tự)<input required type="password" minLength={10} autoComplete="new-password" value={studentForm.password||''} onChange={e=>setStudentForm({...studentForm,password:e.target.value})}/></label>}<button className="primary">{editingStudent?'Lưu thay đổi':'Tạo sinh viên'}</button><button type="button" className="secondary" onClick={()=>{setShowForm(false);setEditingStudent(null)}}>Hủy</button></form>}<div className="table-scroll"><table><thead><tr><th>Mã SV</th><th>Họ tên</th><th>Email</th><th>Khoa</th><th>Khóa</th><th>Lớp</th><th>Số điện thoại</th><th>Thao tác</th></tr></thead><tbody>{visibleStudents.map(s=><tr key={s.maSV}><td><b>{s.maSV}</b></td><td>{s.hoTen}</td><td>{s.email}</td><td>{faculties.find(f=>f.id===academicClasses.find(c=>c.code===s.lop)?.facultyId)?.name||'Chưa phân loại'}</td><td>{academicClasses.find(c=>c.code===s.lop)?.cohort||'—'}</td><td>{s.lop}</td><td>{s.soDienThoai||'—'}</td><td><div className="table-actions"><button className="secondary compact" onClick={()=>beginEditStudent(s)}>Sửa</button><button className="danger" onClick={()=>{if(confirm(`Xóa sinh viên ${s.maSV}?`))void mutate(`/api/students/${encodeURIComponent(s.maSV)}`,'DELETE')}}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{visibleStudents.length===0&&<p className="empty">Không có dữ liệu phù hợp.</p>}</div></section>}
  {!admin&&page==='dashboard'&&myProfile&&<section className="panel student-profile"><div className="section-heading"><div><h2>Thông tin sinh viên</h2><p>Hồ sơ cá nhân</p></div><span className="student-code">{myProfile.maSV}</span></div><div className="profile-grid"><div><small>Họ tên</small><strong>{myProfile.hoTen}</strong></div><div><small>Email trường</small><strong>{myProfile.email}</strong></div><div><small>Lớp</small><strong>{myProfile.lop}</strong></div><div><small>Khoa / Khóa</small><strong>{faculties.find(f=>f.id===academicClasses.find(c=>c.code===myProfile.lop)?.facultyId)?.name||'Chưa phân loại'} · {academicClasses.find(c=>c.code===myProfile.lop)?.cohort||'—'}</strong></div><div><small>Số điện thoại</small><strong>{myProfile.soDienThoai||'Chưa cập nhật'}</strong></div></div></section>}
  {page==='courses'&&<section className="panel"><div className="section-heading"><div><h2>Danh sách học phần</h2><p>Giảng viên được chọn từ danh sách Admin đã tạo</p></div>{admin&&<button className="primary compact" onClick={()=>showForm?setShowForm(false):beginNewCourse()}><Plus size={16}/>{showForm?'Đóng':'Thêm học phần'}</button>}</div>
    {admin&&showForm&&<form className="form-grid" onSubmit={submitCourse}>
      <div className="form-note">{editingCourseId?'Sửa học phần và giảng viên phụ trách':'Hãy tạo giảng viên trước khi thêm học phần.'}</div>
      <label>Mã học phần<input required value={courseForm.code} onChange={e=>setCourseForm({...courseForm,code:e.target.value})}/></label>
      <label>Tên học phần<input required value={courseForm.name} onChange={e=>setCourseForm({...courseForm,name:e.target.value})}/></label>
      <label>Khoa<select required value={courseForm.department} onChange={e=>setCourseForm({...courseForm,department:e.target.value})}><option value="">-- Chọn khoa đã tạo --</option>{faculties.map(f=><option key={f.id} value={f.code}>{f.code} – {f.name}</option>)}</select></label>
      <label>Học kỳ<input required value={courseForm.semester} onChange={e=>setCourseForm({...courseForm,semester:e.target.value})}/></label>
      <label>Số tín chỉ<input type="number" min="1" max="10" required value={courseForm.credits} onChange={e=>setCourseForm({...courseForm,credits:Number(e.target.value)})}/></label>
      <div className="form-note">Quy đổi: {courseForm.credits} tín chỉ = {courseForm.credits*15} tiết = {courseForm.credits*5} buổi (3 tiết/buổi). Xếp lịch theo ngày bắt đầu và số ngày/tuần tại mục Lịch giảng & Công việc.</div>
      <label>Giảng viên phụ trách<select required value={courseForm.lecturerId||''} onChange={e=>setCourseForm({...courseForm,lecturerId:e.target.value})}><option value="">-- Chọn giảng viên có sẵn --</option>{lecturers.map(l=><option key={l.id} value={l.id}>{l.fullName} ({l.code})</option>)}</select></label>
      {lecturers.length===0&&<div className="form-note">Chưa có giảng viên. Vào mục Giảng viên để thêm tài khoản trước.</div>}
      <button className="primary">{editingCourseId?'Lưu thay đổi':'Lưu học phần'}</button><button type="button" className="secondary" onClick={()=>setShowForm(false)}>Hủy</button>
    </form>}
    <div className="table-scroll"><table><thead><tr><th>Mã HP</th><th>Tên học phần</th><th>Tín chỉ</th><th>Tổng tiết / buổi</th><th>Khoa</th><th>Học kỳ</th><th>Giảng viên phụ trách</th>{admin&&<th>Thao tác</th>}</tr></thead><tbody>
      {courses.map(c=><tr key={c.id}><td><b>{c.code}</b></td><td>{c.name}</td><td>{c.credits}</td><td>{c.credits*15} tiết / {c.credits*5} buổi</td><td>{faculties.find(f=>f.code===c.department||f.name===c.department)?.name||c.department}</td><td>{c.semester}</td><td>{lecturers.find(l=>l.id===c.lecturerId)?.fullName || 'Chưa phân công'}</td>{admin&&<td><div className="table-actions"><button className="secondary compact" onClick={()=>beginEditCourse(c)}>Sửa</button><button className="danger" onClick={()=>{if(c.id&&confirm(`Xóa học phần ${c.code}?`))void mutate(`/api/courses/${encodeURIComponent(c.id)}`,'DELETE')}}><Trash2 size={15}/></button></div></td>}</tr>)}
    </tbody></table>{courses.length===0&&<p className="empty">Chưa có học phần.</p>}</div>
  </section>}
  {page==='schedules'&&<section className="panel">
    <div className="section-heading">
      <div><h2>Thời khóa biểu</h2><p>{admin?'Quản lý lịch học cho các lớp':`Thời khóa biểu lớp ${ownStudent?.lop?.trim() || '(chưa có thông tin lớp)'}`}</p></div>
      {admin&&<button className="primary compact" onClick={()=>{if(showForm){cancelScheduleForm();}else{setPage('planner');}}}><Plus size={16}/>{showForm?'Đóng biểu mẫu':'Xếp lịch tự động theo tín chỉ'}</button>}
    </div>
    {admin&&showForm&&<form className="form-grid" onSubmit={submitSchedule}>
      <div className="form-note">Đang chỉnh sửa lịch học cũ. Để tạo đủ số buổi theo tín chỉ và tính ngày kết thúc tự động, hãy sử dụng Lịch giảng & Công việc.</div>
      <button type="button" className="secondary compact" onClick={()=>void refresh()}><RefreshCw size={16}/> Tải lại học phần và giảng viên</button>
      <label>Lớp<select required value={scheduleForm.lop} onChange={e=>setScheduleForm({...scheduleForm,lop:e.target.value})}><option value="">-- Chọn lớp đã tạo --</option>{academicClasses.map(c=><option key={c.id} value={c.code}>{c.code} – {faculties.find(f=>f.id===c.facultyId)?.name||'Khoa'} khóa {c.cohort}, lớp {c.section}</option>)}{editingScheduleId&&scheduleForm.lop&&!academicClasses.some(c=>c.code===scheduleForm.lop)&&<option value={scheduleForm.lop}>{scheduleForm.lop} (lớp cũ)</option>}</select></label>
      <label>Học phần đã có<select required value={scheduleForm.courseId||''} onChange={e=>{const c=courses.find(x=>x.id===e.target.value);const assigned=lecturers.find(x=>x.id===c?.lecturerId);const current=lecturers.find(x=>x.id===scheduleForm.lecturerId);const l=current||assigned;setScheduleForm({...scheduleForm,courseId:c?.id||'',lecturerId:l?.id||'',tenMonHoc:c?.name||'',giangVien:l?.fullName||''});}}><option value="">-- Chọn học phần --</option>{courses.map(c=><option key={c.id} value={c.id}>{c.code} – {c.name} ({c.credits} tín chỉ)</option>)}</select></label>
      <label>Giảng viên giảng dạy<select required value={scheduleForm.lecturerId||''} onChange={e=>{const l=lecturers.find(x=>x.id===e.target.value);setScheduleForm({...scheduleForm,lecturerId:l?.id||'',giangVien:l?.fullName||''});}}><option value="">-- Chọn giảng viên --</option>{lecturers.map(l=><option key={l.id} value={l.id}>{l.fullName} ({l.code})</option>)}</select></label>
      {courses.length===0&&<div className="form-note">Chưa tải được học phần. Kiểm tra mục Học phần hoặc nhấn Tải lại.</div>}
      {lecturers.length===0&&<div className="form-note">Chưa có giảng viên. Vào mục Giảng viên để tạo tài khoản trước.</div>}
      <label>Thứ<select required value={scheduleForm.thu} onChange={e=>setScheduleForm({...scheduleForm,thu:e.target.value})}>{['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'].map(d=><option key={d} value={d}>{d}</option>)}</select></label>
      <label>Ca học<input required list="schedule-shift-options" value={scheduleForm.caHoc} onChange={e=>setScheduleForm({...scheduleForm,caHoc:e.target.value})} placeholder="Ví dụ: Sáng (7:30 - 11:30)"/><datalist id="schedule-shift-options"><option value="Sáng (7:30 - 11:30)"/><option value="Chiều (13:00 - 17:00)"/><option value="Tối (18:00 - 21:00)"/></datalist></label>
      <label>Phòng học<input required value={scheduleForm.phongHoc} onChange={e=>setScheduleForm({...scheduleForm,phongHoc:e.target.value})} placeholder="Ví dụ: A302"/></label>
      <label>Tiết bắt đầu<input type="number" min="1" max="16" step="1" required value={scheduleForm.tietBatDau??''} onChange={e=>setScheduleForm({...scheduleForm,tietBatDau:e.target.value===''?null:Number(e.target.value)})} placeholder="Ví dụ: 1"/></label>
      <label>Số tiết học<input type="number" min="3" max="3" readOnly required value={3}/></label>
      <label>Ngày bắt đầu áp dụng (không bắt buộc)<input type="date" value={scheduleForm.ngayBatDau||''} onChange={e=>setScheduleForm({...scheduleForm,ngayBatDau:e.target.value})}/></label>
      <label>Ngày kết thúc áp dụng (không bắt buộc)<input type="date" value={scheduleForm.ngayKetThuc||''} onChange={e=>setScheduleForm({...scheduleForm,ngayKetThuc:e.target.value})}/></label>
      <div className="form-note">Một buổi học gồm 3 tiết. Lịch tạo tự động có ngày kết thúc tính theo tín chỉ; lịch cũ có thể chỉnh sửa riêng từng thứ.</div>
      <div className="form-note">Đang phân công: {courses.find(c=>c.id===scheduleForm.courseId)?.name || 'Chưa chọn học phần'} – {lecturers.find(l=>l.id===scheduleForm.lecturerId)?.fullName || 'Chưa chọn giảng viên'}</div>
      <button className="primary" type="submit">{editingScheduleId?'Lưu thay đổi':'Lưu lịch học'}</button>
      <button className="secondary" type="button" onClick={cancelScheduleForm}>Hủy</button>
    </form>}
    {admin&&<div className="course-tools"><input className="search" placeholder="Tìm theo lớp, môn học, thứ, phòng..." value={scheduleSearch} onChange={e=>setScheduleSearch(e.target.value)}/><button className="secondary compact" onClick={()=>void refresh()}><RefreshCw size={16}/> Tải lại</button></div>}
    {!admin&&<div className="course-tools"><span className="muted">Lịch học do Admin xếp cho lớp của bạn.</span><button className="secondary compact" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/> Tải lại thời khóa biểu</button></div>}
    {!admin && <StudentCalendar schedules={visibleSchedules} className={ownStudent?.lop?.trim() || ''} onRefresh={()=>void refresh()} loading={loading}/>}
    {admin && <div className="table-scroll"><table><thead><tr><th>Lớp</th><th>Môn học</th><th>Thứ</th><th>Tiết</th><th>Ca học</th><th>Phòng</th><th>Giảng viên</th><th>Bắt đầu</th><th>Kết thúc</th>{admin&&<th>Thao tác</th>}</tr></thead><tbody>
      {visibleSchedules.map((s,i)=><tr key={s.id||i}><td>{s.lop}</td><td><b>{s.tenMonHoc}</b></td><td>{s.thu}</td><td>{s.tietBatDau && s.soTiet ? `Tiết ${s.tietBatDau}–${s.tietBatDau+s.soTiet-1}` : 'Chưa cập nhật'}</td><td>{s.caHoc}</td><td>{s.phongHoc}</td><td>{s.giangVien}</td><td>{s.ngayBatDau||'—'}</td><td>{s.ngayKetThuc||'—'}</td>{admin&&<td><div className="table-actions"><button className="secondary compact" onClick={()=>beginEditSchedule(s)}>Sửa</button><button className="danger" title="Xóa lịch học" onClick={()=>void removeSchedule(s)}><Trash2 size={15}/></button></div></td>}</tr>)}
    </tbody></table>{visibleSchedules.length===0&&<p className="empty">Chưa có lịch học phù hợp. Nhấn “Thêm lịch học” để tạo mới.</p>}</div>}
  </section>}
  {page==='enrollments'&&<section className="panel"><div className="section-heading"><div><h2>Đăng ký học phần</h2><p>{admin?'Theo dõi danh sách đăng ký':'Chọn học phần muốn đăng ký'}</p></div></div>{!admin&&<><div className="course-tools"><input className="search" placeholder="Tìm theo mã, tên học phần, khoa hoặc học kỳ..." value={courseSearch} onChange={e=>setCourseSearch(e.target.value)}/><button className="secondary compact" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/> Tải lại học phần</button></div><p className="muted">Hiển thị {filteredCourses.length}/{courses.length} học phần. Các học phần Admin đã lưu sẽ xuất hiện tại đây.</p>{courses.length===0&&!loading&&<p className="empty">Chưa tải được học phần nào. Hãy nhấn Tải lại học phần; nếu có thông báo lỗi ở trên, gửi lại thông báo đó.</p>}{courses.length>0&&filteredCourses.length===0&&<p className="empty">Không tìm thấy học phần phù hợp. Hãy thử từ khóa khác.</p>}<div className="course-grid">{filteredCourses.map(c=>{const registered=enrollments.some(e=>e.maSV===account.maSV&&e.courseId===c.id);return <div className="course-card" key={c.id}><b>{c.name}</b><small>{c.code} · {c.credits} tín chỉ · {c.credits*15} tiết · {c.credits*5} buổi · {c.semester}</small><div className="course-fee">{creditPrice.configured ? <><span>Học phí dự kiến</span><strong>{vnd(c.credits * creditPrice.pricePerCredit)}</strong><small>{c.credits} × {vnd(creditPrice.pricePerCredit)}</small></> : <span>Admin chưa thiết lập đơn giá tín chỉ</span>}</div><button className="primary compact" disabled={registered||!c.id||!creditPrice.configured} onClick={()=>void mutate('/api/enrollments','POST',{maSV:account.maSV,courseId:c.id})}>{registered?'Đã đăng ký':'Đăng ký'}</button></div>})}</div></>}<h3>Danh sách đã đăng ký</h3><div className="table-scroll"><table><thead><tr>{admin&&<th>Mã sinh viên</th>}<th>Học phần</th><th>Học kỳ</th><th>Học phí (VND)</th><th>Thao tác</th></tr></thead><tbody>{enrollments.filter(e=>admin||e.maSV===account.maSV).map(e=><tr key={e.id}>{admin&&<td>{e.maSV}</td>}<td>{courses.find(c=>c.id===e.courseId)?.name||e.courseId}</td><td>{e.semester}</td><td><b>{vnd(e.tuitionAmount ?? ((courses.find(c=>c.id===e.courseId)?.credits||0)*creditPrice.pricePerCredit))}</b>{e.tuitionAmount==null&&<small className="fee-estimated"> (ước tính)</small>}</td><td><button className="danger" onClick={()=>{if(e.id&&confirm('Hủy đăng ký này?'))void mutate('/api/enrollments/'+encodeURIComponent(e.id),'DELETE')}}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div><p className="muted">Học phí = số tín chỉ × đơn giá do Admin thiết lập. Đơn giá được chốt khi đăng ký; hủy đăng ký sẽ cập nhật tổng học phí. Bản demo chưa kiểm tra sĩ số, môn tiên quyết và trùng lịch.</p></section>}
  {page==='grades'&&<section className="panel"><div className="section-heading"><div><h2>Bảng điểm học phần</h2><p>{admin?'Nhập và quản lý điểm sinh viên':'Xem điểm cá nhân'}</p></div>{admin&&<button className="primary compact" onClick={()=>setShowForm(!showForm)}><Plus size={16}/> Nhập điểm</button>}</div>{admin&&showForm&&<form className="form-grid" onSubmit={e=>{e.preventDefault();void mutate('/api/grades','POST',gradeForm)}}><label>Mã sinh viên<input required value={gradeForm.maSV} onChange={e=>setGradeForm({...gradeForm,maSV:e.target.value})}/></label><label>Học phần<select required value={gradeForm.courseId} onChange={e=>setGradeForm({...gradeForm,courseId:e.target.value})}><option value="">Chọn học phần</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Điểm quá trình<input type="number" min="0" max="10" step=".1" value={gradeForm.processScore} onChange={e=>setGradeForm({...gradeForm,processScore:Number(e.target.value)})}/></label><label>Điểm thi<input type="number" min="0" max="10" step=".1" value={gradeForm.examScore} onChange={e=>setGradeForm({...gradeForm,examScore:Number(e.target.value)})}/></label><button className="primary">Lưu điểm</button></form>}<div className="table-scroll"><table><thead><tr>{admin&&<th>Mã sinh viên</th>}<th>Học phần</th><th>Quá trình</th><th>Thi</th><th>Tổng kết (40/60)</th>{admin&&<th>Xóa</th>}</tr></thead><tbody>{grades.map(g=><tr key={g.id}>{admin&&<td>{g.maSV}</td>}<td>{courses.find(c=>c.id===g.courseId)?.name||g.courseId}</td><td>{g.processScore}</td><td>{g.examScore}</td><td><b>{(g.processScore*.4+g.examScore*.6).toFixed(2)}</b></td>{admin&&<td><button className="danger" onClick={()=>{if(g.id&&confirm('Xóa điểm?'))void mutate('/api/grades/'+encodeURIComponent(g.id),'DELETE')}}><Trash2 size={15}/></button></td>}</tr>)}</tbody></table>{grades.length===0&&<p className="empty">Chưa có điểm.</p>}</div>{!admin&&grades.length>0&&<div className="stat" style={{marginTop:20}}><span>Điểm trung bình hệ 10 (tham khảo, chưa quy đổi GPA hệ 4)</span><strong>{(grades.reduce((total,g)=>total+g.processScore*.4+g.examScore*.6,0)/grades.length).toFixed(2)}</strong></div>}<p className="muted">Công thức 40% quá trình + 60% thi chỉ là quy ước demo, chưa phản ánh quy chế từng học phần.</p></section>}
  {page==='lecturers'&&admin&&<section className="panel"><div className="section-heading"><div><h2>Quản lý tài khoản giảng viên</h2><p>Admin cấp tài khoản đăng nhập và đơn giá tiền giảng dạy riêng cho từng giảng viên</p></div><button className="primary compact" onClick={()=>showForm?setShowForm(false):beginNewLecturer()}><Plus size={16}/>{showForm?'Đóng':'Thêm giảng viên'}</button></div>
    {showForm&&<form className="form-grid" onSubmit={submitLecturer}><div className="form-note">{editingLecturerId?'Để trống mật khẩu nếu không đổi.':'Giảng viên đăng nhập bằng email và mật khẩu bạn cấp.'}</div>
      {(['code','fullName','email'] as const).map(k=><label key={k}>{({code:'Mã giảng viên',fullName:'Họ tên',email:'Email đăng nhập'})[k]}<input required value={lecturerForm[k]} onChange={e=>setLecturerForm({...lecturerForm,[k]:e.target.value})}/></label>)}
      <label>Khoa<select required value={lecturerForm.department} onChange={e=>setLecturerForm({...lecturerForm,department:e.target.value})}><option value="">-- Chọn khoa --</option>{faculties.map(f=><option key={f.id} value={f.code}>{f.code} – {f.name}</option>)}{lecturerForm.department&&!faculties.some(f=>f.code===lecturerForm.department)&&<option value={lecturerForm.department}>{lecturerForm.department} (dữ liệu cũ)</option>}</select></label>
      <label>Mật khẩu {editingLecturerId?'mới (không bắt buộc)':'ban đầu (ít nhất 10 ký tự)'}<input type="password" autoComplete="new-password" minLength={10} required={!editingLecturerId} value={lecturerForm.password||''} onChange={e=>setLecturerForm({...lecturerForm,password:e.target.value})}/></label>
      <label>Đơn giá giảng dạy / tín chỉ / lớp (VND)<input type="number" min="0" max="1000000000" step="1" required value={lecturerForm.payPerCredit??0} onChange={e=>setLecturerForm({...lecturerForm,payPerCredit:Number(e.target.value)})}/></label>
      <button className="primary">{editingLecturerId?'Lưu thay đổi':'Tạo tài khoản'}</button><button type="button" className="secondary" onClick={()=>setShowForm(false)}>Hủy</button>
    </form>}
    <div className="table-scroll"><table><thead><tr><th>Mã GV</th><th>Họ tên</th><th>Email đăng nhập</th><th>Khoa</th><th>Đơn giá/tín chỉ/lớp</th><th>Tài khoản</th><th>Thao tác</th></tr></thead><tbody>
      {lecturers.map(x=><tr key={x.id}><td>{x.code}</td><td>{x.fullName}</td><td>{x.email}</td><td>{x.department}</td><td><b>{vnd(x.payPerCredit||0)}</b></td><td>{x.loginEnabled?'Đã cấp mật khẩu':'Chưa có mật khẩu'}</td><td><div className="table-actions"><button className="secondary compact" onClick={()=>beginEditLecturer(x)}>Sửa / Cấp mật khẩu</button><button className="danger" onClick={()=>{if(x.id&&confirm('Xóa giảng viên?'))void mutate('/api/lecturers/'+encodeURIComponent(x.id),'DELETE')}}><Trash2 size={15}/></button></div></td></tr>)}
    </tbody></table>{lecturers.length===0&&<p className="empty">Chưa có giảng viên.</p>}</div>
  </section>}
  {page==='salary'&&admin&&<section className="panel"><div className="section-heading"><div><h2>Bảng tính tiền giảng dạy</h2><p>Đơn giá × số tín chỉ × số lớp khác nhau đã xếp lịch (không đếm số buổi)</p></div><button className="secondary compact" onClick={()=>void refresh()}><RefreshCw size={16}/> Tải lại</button></div>
    {salaryTable(teachingPayments)}<div className="tuition-total"><span>Tổng tiền giảng dạy dự tính</span><strong>{vnd(teachingPayments.reduce((sum,x)=>sum+x.totalAmount,0))}</strong></div>
    <p className="muted">Đây là số tiền tính theo phân công, chưa phải chứng từ thanh toán. Đơn giá giảng viên độc lập với học phí sinh viên.</p>
  </section>}
  {page==='exams'&&<section className="panel"><div className="section-heading"><div><h2>Lịch thi</h2><p>Lịch thi theo học phần</p></div>{admin&&<button className="primary compact" onClick={()=>setShowForm(!showForm)}><Plus size={16}/> Thêm lịch thi</button>}</div>{admin&&showForm&&<form className="form-grid" onSubmit={e=>{e.preventDefault();void mutate('/api/exams','POST',examForm)}}><label>Học phần<select required value={examForm.courseId} onChange={e=>setExamForm({...examForm,courseId:e.target.value})}><option value="">Chọn học phần</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Ngày thi<input type="date" required value={examForm.date} onChange={e=>setExamForm({...examForm,date:e.target.value})}/></label><label>Giờ bắt đầu<input type="time" required value={examForm.startTime} onChange={e=>setExamForm({...examForm,startTime:e.target.value})}/></label><label>Phòng<input required value={examForm.room} onChange={e=>setExamForm({...examForm,room:e.target.value})}/></label><label>Học kỳ<input required value={examForm.semester} onChange={e=>setExamForm({...examForm,semester:e.target.value})}/></label><button className="primary">Lưu lịch thi</button></form>}<div className="table-scroll"><table><thead><tr><th>Học phần</th><th>Ngày</th><th>Giờ</th><th>Phòng</th><th>Học kỳ</th>{admin&&<th>Xóa</th>}</tr></thead><tbody>{exams.filter(x=>admin||enrollments.some(e=>e.maSV===account.maSV&&e.courseId===x.courseId)).map(x=><tr key={x.id}><td>{courses.find(c=>c.id===x.courseId)?.name||x.courseId}</td><td>{x.date}</td><td>{x.startTime}</td><td>{x.room}</td><td>{x.semester}</td>{admin&&<td><button className="danger" onClick={()=>{if(x.id&&confirm('Xóa lịch thi?'))void mutate('/api/exams/'+encodeURIComponent(x.id),'DELETE')}}><Trash2 size={15}/></button></td>}</tr>)}</tbody></table>{exams.length===0&&<p className="empty">Chưa có lịch thi.</p>}</div></section>}
  {page==='tuition'&&<>
    <section className="panel">
      <div className="section-heading"><div><h2>Đơn giá một tín chỉ</h2><p>{admin?'Chỉ Admin có quyền thiết lập và cập nhật đơn giá':'Đơn giá do Phòng Đào tạo quy định'}</p></div></div>
      <div className="price-display"><span>Đơn giá hiện tại</span><strong>{creditPrice.configured ? vnd(creditPrice.pricePerCredit) : 'Chưa thiết lập'}</strong><small>/ tín chỉ</small></div>
      {admin&&<form className="price-form" onSubmit={saveCreditPrice}><label>Nhập giá tiền một tín chỉ (VND)<input type="number" min="1" max="1000000000" step="1" required value={priceInput} onChange={e=>setPriceInput(e.target.value)} placeholder="Ví dụ: 850000"/></label><button className="primary">Lưu đơn giá</button></form>}
      <p className="muted">Chỉ học phần đăng ký sau khi cập nhật mới sử dụng đơn giá mới. Các khoản đã đăng ký được giữ nguyên giá tại thời điểm đăng ký.</p>
    </section>
    <section className="panel">
      <div className="section-heading"><div><h2>Học phí tính từ đăng ký học phần</h2><p>Tổng học phí theo từng sinh viên và học kỳ, tự cập nhật khi đăng ký hoặc hủy học phần</p></div></div>
      <div className="table-scroll"><table><thead><tr>{admin&&<th>Mã sinh viên</th>}<th>Học kỳ</th><th>Số học phần</th><th>Tổng tín chỉ</th><th>Học phí phải đóng</th><th>Ghi chú</th></tr></thead><tbody>
        {automaticTuition.map(x=><tr key={`${x.maSV}-${x.semester}`}>{admin&&<td>{x.maSV}</td>}<td>{x.semester}</td><td>{x.courseCount}</td><td>{x.totalCredits}</td><td><b>{vnd(x.amount)}</b></td><td>{x.estimated?'Có học phần cũ: số tiền ước tính theo giá hiện tại':'Đã chốt đơn giá khi đăng ký'}</td></tr>)}
      </tbody></table>{automaticTuition.length===0&&<p className="empty">Chưa có học phí từ đăng ký học phần.</p>}</div>
      {!admin&&automaticTuition.length>0&&<div className="tuition-total"><span>Tổng học phí học phần đã đăng ký</span><strong>{vnd(automaticTuition.reduce((sum,x)=>sum+x.amount,0))}</strong></div>}
      <p className="muted">Đây là học phí phát sinh theo học phần, chưa phải xác nhận đã thanh toán. Học phần đăng ký trước khi có chức năng đơn giá chỉ được ước tính theo giá hiện tại.</p>
    </section>
    <section className="panel">
      <div className="section-heading"><div><h2>Khoản thu nhập thủ công (dữ liệu cũ)</h2><p>Hiển thị riêng để tránh cộng trùng với học phí học phần tự động</p></div>{admin&&<button className="secondary compact" onClick={()=>setShowForm(!showForm)}><Plus size={16}/> {showForm?'Đóng':'Thêm khoản thu thủ công'}</button>}</div>
      {admin&&showForm&&<form className="form-grid" onSubmit={e=>{e.preventDefault();void mutate('/api/tuition','POST',tuitionForm)}}><label>Mã sinh viên<input required value={tuitionForm.maSV} onChange={e=>setTuitionForm({...tuitionForm,maSV:e.target.value})}/></label><label>Học kỳ<input required value={tuitionForm.semester} onChange={e=>setTuitionForm({...tuitionForm,semester:e.target.value})}/></label><label>Số tiền phải đóng (VND)<input type="number" min="0" required value={tuitionForm.amount} onChange={e=>setTuitionForm({...tuitionForm,amount:Number(e.target.value)})}/></label><label>Đã đóng (VND)<input type="number" min="0" required value={tuitionForm.paidAmount} onChange={e=>setTuitionForm({...tuitionForm,paidAmount:Number(e.target.value)})}/></label><button className="primary">Lưu khoản thu</button></form>}
      <div className="table-scroll"><table><thead><tr>{admin&&<th>Mã SV</th>}<th>Học kỳ</th><th>Phải đóng</th><th>Đã đóng</th><th>Còn lại</th><th>Trạng thái</th>{admin&&<th>Xóa</th>}</tr></thead><tbody>{tuition.map(x=><tr key={x.id}>{admin&&<td>{x.maSV}</td>}<td>{x.semester}</td><td>{vnd(x.amount)}</td><td>{vnd(x.paidAmount)}</td><td>{vnd(x.amount-x.paidAmount)}</td><td>{x.status}</td>{admin&&<td><button className="danger" onClick={()=>{if(x.id&&confirm('Xóa khoản thu thủ công?'))void mutate('/api/tuition/'+encodeURIComponent(x.id),'DELETE')}}><Trash2 size={15}/></button></td>}</tr>)}</tbody></table>{tuition.length===0&&<p className="empty">Không có khoản thu thủ công.</p>}</div>
    </section>
  </>}
  {page==='planner'&&admin&&<TeachingPlanner role="ADMIN" courses={courses} schedules={schedules} lecturers={lecturers} faculties={faculties} classNames={academicClasses.map(c=>c.code)} request={api} onRefresh={refresh} prefillCourseId={pendingPlanCourseId} onPrefillConsumed={()=>setPendingPlanCourseId('')}/>}
  {page==='graduation'&&<GraduationConditionsPage isAdmin={admin} studentClass={myProfile?.lop} request={api}/>}
  {page==='notifications'&&<section className="panel"><div className="section-heading"><div><h2>Thông báo đào tạo</h2><p>Cập nhật từ Phòng Đào tạo</p></div>{admin&&<button className="primary compact" onClick={()=>setShowForm(!showForm)}><Plus size={16}/> Đăng thông báo</button>}</div>{admin&&showForm&&<form className="notice-form" onSubmit={e=>{e.preventDefault();void mutate('/api/notifications','POST',noticeForm)}}><label>Tiêu đề<input required value={noticeForm.title} onChange={e=>setNoticeForm({...noticeForm,title:e.target.value})}/></label><label>Nội dung<textarea required rows={4} value={noticeForm.content} onChange={e=>setNoticeForm({...noticeForm,content:e.target.value})}/></label><button className="primary">Đăng thông báo</button></form>}{notices.map(n=><div className="notice" key={n.id}><b>{n.title}</b><p>{n.content}</p><small>{n.createdAt?new Date(n.createdAt).toLocaleString('vi-VN'):''}</small></div>)}{notices.length===0&&<p className="empty">Chưa có thông báo.</p>}</section>}
  {page==='school'&&<section className="panel"><div className="section-heading"><div><h2><School size={22}/> Thông tin trường</h2><p>{admin ? 'Chỉnh sửa nội dung hiển thị công khai trên trang đăng nhập' : 'Thông tin do nhà trường cung cấp'}</p></div></div>
    {admin ? <form className="school-edit" onSubmit={saveSchool}><label>Tên trường<input required maxLength={120} value={schoolDraft.name} onChange={e=>setSchoolDraft({...schoolDraft,name:e.target.value})}/></label><label>Khẩu hiệu<input maxLength={180} value={schoolDraft.tagline} onChange={e=>setSchoolDraft({...schoolDraft,tagline:e.target.value})}/></label><label>Giới thiệu<textarea rows={4} maxLength={3000} value={schoolDraft.introduction} onChange={e=>setSchoolDraft({...schoolDraft,introduction:e.target.value})}/></label><label>Thông tin đào tạo<textarea rows={3} maxLength={3000} value={schoolDraft.training} onChange={e=>setSchoolDraft({...schoolDraft,training:e.target.value})}/></label><label>Hỗ trợ sinh viên<textarea rows={3} maxLength={3000} value={schoolDraft.studentSupport} onChange={e=>setSchoolDraft({...schoolDraft,studentSupport:e.target.value})}/></label><div className="school-edit-pair"><label>Địa chỉ<input maxLength={240} value={schoolDraft.address} onChange={e=>setSchoolDraft({...schoolDraft,address:e.target.value})}/></label><label>Email liên hệ<input maxLength={150} value={schoolDraft.email} onChange={e=>setSchoolDraft({...schoolDraft,email:e.target.value})}/></label><label>Điện thoại<input maxLength={60} value={schoolDraft.phone} onChange={e=>setSchoolDraft({...schoolDraft,phone:e.target.value})}/></label><label>Website (https://...)<input maxLength={240} value={schoolDraft.website} onChange={e=>setSchoolDraft({...schoolDraft,website:e.target.value})}/></label></div><button className="primary" type="submit">Lưu thông tin trường</button></form>
    : <div className="school-profile"><h3>{schoolInfo.name}</h3><p>{schoolInfo.tagline}</p><h4>Giới thiệu</h4><p>{schoolInfo.introduction}</p><h4>Đào tạo</h4><p>{schoolInfo.training}</p><h4>Hỗ trợ sinh viên</h4><p>{schoolInfo.studentSupport}</p>{schoolInfo.address&&<p><MapPin size={15}/> {schoolInfo.address}</p>}{schoolInfo.email&&<p><Mail size={15}/> {schoolInfo.email}</p>}{schoolInfo.phone&&<p><Phone size={15}/> {schoolInfo.phone}</p>}</div>}
  </section>}
  {page==='forum'&&<section className="panel"><div className="section-heading"><div><h2><MessageCircle size={22}/> Diễn đàn sinh viên</h2><p>Đặt câu hỏi, chia sẻ kinh nghiệm và trao đổi về học tập</p></div><button className="secondary compact" onClick={()=>void refreshPublic()}><RefreshCw size={16}/> Tải lại</button></div>
    {publicError&&<div className="alert error">{publicError}</div>}
    <form className="forum-new-post" onSubmit={publishPost}><h3>Đăng chủ đề mới</h3><label>Tiêu đề<input required maxLength={120} placeholder="Bạn muốn thảo luận về điều gì?" value={forumTitle} onChange={e=>setForumTitle(e.target.value)}/></label><label>Nội dung<textarea required maxLength={4000} rows={4} placeholder="Viết nội dung bài thảo luận..." value={forumContent} onChange={e=>setForumContent(e.target.value)}/></label><button className="primary" type="submit"><Plus size={16}/> Đăng bài</button></form>
    {forumFeed()}
  </section>}
  {!admin&&<div className="disclaimer">Lưu ý: Tài khoản được xác thực bằng HTTP Basic. Chưa có JWT, chống brute-force hoặc HTTPS. Không dùng với dữ liệu thật.</div>}</div><footer className="portal-footer">© {new Date().getFullYear()} UNI PORTAL · Cổng thông tin đào tạo và diễn đàn sinh viên</footer></main></div>;
}
