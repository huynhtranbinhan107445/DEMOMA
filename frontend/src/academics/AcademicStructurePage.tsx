import { useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Building2, Check, GraduationCap, Plus, RefreshCw, Trash2 } from 'lucide-react';
import './academic-structure.css';

export type Faculty = { id?: string; code: string; name: string };
export type AcademicClass = { id?: string; code: string; facultyId: string; cohort: string; section: string };

type Props = {
  faculties: Faculty[];
  classes: AcademicClass[];
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  onRefresh: () => Promise<void>;
};

export default function AcademicStructurePage({ faculties, classes, request, onRefresh }: Props) {
  const [facultyForm, setFacultyForm] = useState({ code: '', name: '' });
  const [editingFaculty, setEditingFaculty] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({ facultyId: '', cohort: '24', section: 'A' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const selectedFaculty = faculties.find(f => f.id === classForm.facultyId);
  const preview = `${selectedFaculty?.code || 'IT'}${classForm.cohort}${classForm.section.toUpperCase()}`;
  const visibleClasses = useMemo(() => classes.filter(c => {
    const f = faculties.find(x => x.id === c.facultyId);
    return [c.code, c.cohort, c.section, f?.code || '', f?.name || ''].some(x => x.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  }), [classes, faculties, search]);
  const cohorts = Array.from(new Set(classes.map(c => `${faculties.find(f => f.id === c.facultyId)?.code || ''}${c.cohort}`)));

  async function saveFaculty(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await request(editingFaculty ? `/api/faculties/${encodeURIComponent(editingFaculty)}` : '/api/faculties', {
        method: editingFaculty ? 'PUT' : 'POST',
        body: JSON.stringify({ code: facultyForm.code.toUpperCase(), name: facultyForm.name.trim() }),
      });
      setMessage(editingFaculty ? 'Đã cập nhật tên khoa.' : 'Đã tạo khoa mới.');
      setEditingFaculty(null); setFacultyForm({ code: '', name: '' }); await onRefresh();
    } catch (e) { setError('Không lưu được khoa: ' + (e as Error).message); }
    finally { setBusy(false); }
  }
  async function saveClass(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await request('/api/academic-classes', { method: 'POST', body: JSON.stringify({
        facultyId: classForm.facultyId, cohort: classForm.cohort, section: classForm.section.toUpperCase(),
      }) });
      setMessage(`Đã tạo lớp ${preview}. Sinh viên mới có thể chọn lớp này.`);
      setClassForm(f => ({ ...f, section: '' })); await onRefresh();
    } catch (e) { setError('Không tạo được lớp: ' + (e as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(path: string, label: string) {
    if (!window.confirm(`Bạn muốn xóa ${label}? Chỉ xóa được khi chưa có dữ liệu liên quan.`)) return;
    setBusy(true); setError(''); setMessage('');
    try { await request(path, { method: 'DELETE' }); await onRefresh(); setMessage(`Đã xóa ${label}.`); }
    catch (e) { setError(`Không thể xóa ${label}: ${(e as Error).message}`); }
    finally { setBusy(false); }
  }
  return <div className="as-page">
    <div className="as-intro"><div><span>QUẢN LÝ CƠ CẤU ĐÀO TẠO</span><h2>Khoa, khóa tuyển sinh & lớp</h2><p>Quy tắc mã lớp: <strong>IT</strong> (khoa) + <strong>24</strong> (khóa) + <strong>A</strong> (lớp) = <strong>IT24A</strong>.</p></div><GraduationCap size={62}/></div>
    <div className="as-stats"><div><Building2 size={19}/><span>Khoa</span><strong>{faculties.length}</strong></div><div><BookOpen size={19}/><span>Khóa</span><strong>{cohorts.length}</strong></div><div><GraduationCap size={19}/><span>Lớp</span><strong>{classes.length}</strong></div></div>
    {error && <div className="as-alert as-error" role="alert">{error}</div>}
    {message && <div className="as-alert as-ok" role="status"><Check size={16}/>{message}</div>}
    <div className="as-grid">
      <section className="panel"><div className="section-heading"><div><h2>1. Thiết lập khoa</h2><p>Mỗi khoa có mã viết tắt duy nhất, ví dụ IT</p></div></div>
        <form className="as-form" onSubmit={saveFaculty}>
          <label>Mã khoa<input required pattern="[A-Za-z]{2,8}" maxLength={8} placeholder="IT" disabled={!!editingFaculty} value={facultyForm.code} onChange={e => setFacultyForm({ ...facultyForm, code: e.target.value.toUpperCase() })}/></label>
          <label>Tên khoa<input required maxLength={120} placeholder="Công nghệ thông tin" value={facultyForm.name} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })}/></label>
          <div className="as-actions"><button className="primary" disabled={busy}><Plus size={16}/>{editingFaculty ? 'Lưu tên khoa' : 'Thêm khoa'}</button>{editingFaculty && <button type="button" className="secondary" onClick={() => { setEditingFaculty(null); setFacultyForm({ code: '', name: '' }); }}>Hủy</button>}</div>
        </form>
        <div className="as-entries">{faculties.map(f => <div className="as-entry" key={f.id}><span className="as-code">{f.code}</span><div><b>{f.name}</b><small>Mã khoa: {f.code}</small></div><button type="button" className="secondary compact" onClick={() => { setEditingFaculty(f.id || null); setFacultyForm({ code: f.code, name: f.name }); }}>Sửa</button><button type="button" className="danger" title="Xóa khoa" disabled={busy} onClick={() => void remove(`/api/faculties/${encodeURIComponent(f.id || '')}`, `khoa ${f.code}`)}><Trash2 size={15}/></button></div>)}{faculties.length === 0 && <p className="muted">Chưa có khoa. Hãy tạo khoa trước.</p>}</div>
      </section>
      <section className="panel"><div className="section-heading"><div><h2>2. Tạo lớp theo khoa và khóa</h2><p>Mã lớp tự ghép từ mã khoa + khóa + chữ cái lớp</p></div></div>
        <form className="as-form" onSubmit={saveClass}>
          <label>Khoa<select required value={classForm.facultyId} onChange={e => setClassForm({ ...classForm, facultyId: e.target.value })}><option value="">-- Chọn khoa --</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.code} – {f.name}</option>)}</select></label>
          <div className="as-form-pair"><label>Khóa tuyển sinh (2 số)<input required inputMode="numeric" pattern="[0-9]{2}" maxLength={2} placeholder="24" value={classForm.cohort} onChange={e => setClassForm({ ...classForm, cohort: e.target.value })}/></label><label>Lớp (chữ cái)<input required pattern="[A-Za-z]{1,2}" maxLength={2} placeholder="A" value={classForm.section} onChange={e => setClassForm({ ...classForm, section: e.target.value.toUpperCase() })}/></label></div>
          <div className="as-preview"><small>Mã khóa</small><strong>{selectedFaculty?.code || 'IT'}{classForm.cohort || '24'}</strong><span>→</span><small>Mã lớp</small><strong>{preview}</strong></div>
          <button className="primary" disabled={busy || !faculties.length}><Plus size={16}/>Tạo lớp</button>
        </form>
        <div className="as-tip">Ví dụ: <b>IT24A</b> = Công nghệ thông tin, khóa 24, lớp A. Mã lớp không đổi sau khi tạo để bảo toàn lịch học và hồ sơ sinh viên.</div>
      </section>
    </div>
    <section className="panel"><div className="section-heading"><div><h2>3. Danh sách lớp đã tạo</h2><p>Chỉ các lớp ở đây mới được chọn khi tạo sinh viên và xếp thời khóa biểu mới.</p></div><button type="button" className="secondary compact" disabled={busy} onClick={() => void onRefresh()}><RefreshCw size={16}/> Tải lại</button></div>
      <input className="search" placeholder="Tìm mã lớp, khóa, tên khoa..." value={search} onChange={e => setSearch(e.target.value)}/>
      <div className="table-scroll"><table><thead><tr><th>Mã lớp</th><th>Khoa</th><th>Khóa</th><th>Lớp</th><th>Diễn giải</th><th>Thao tác</th></tr></thead><tbody>{visibleClasses.map(c => { const f = faculties.find(x => x.id === c.facultyId); return <tr key={c.id}><td><b>{c.code}</b></td><td>{f ? `${f.code} – ${f.name}` : 'Khoa đã bị xóa'}</td><td>{f?.code || ''}{c.cohort}</td><td>{c.section}</td><td>{f?.name || 'Khoa'} khóa {c.cohort}, lớp {c.section}</td><td><button type="button" className="danger" title="Xóa lớp" disabled={busy} onClick={() => void remove(`/api/academic-classes/${encodeURIComponent(c.id || '')}`, `lớp ${c.code}`)}><Trash2 size={15}/></button></td></tr>; })}</tbody></table>{visibleClasses.length === 0 && <p className="empty">Chưa có lớp phù hợp.</p>}</div>
    </section>
  </div>;
}
