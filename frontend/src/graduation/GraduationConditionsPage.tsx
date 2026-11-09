import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpenCheck, CheckCircle2, CircleOff, GraduationCap, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import './graduation.css';

export type GraduationCondition = {
  id: string;
  cohort: string;
  requiredCredits: number | null;
  minGpa: number | null;
  maximumFailedCourses?: number | null;
  foreignLanguageRequired?: boolean;
  itCertificateRequired?: boolean;
  conductRequired?: boolean;
  foreignLanguageStandard?: string;
  itStandard?: string;
  conductStandard?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ConditionInput = {
  cohort: string;
  minimumCredits: number;
  minimumGpa: number;
  maximumFailedCourses: number;
  foreignLanguageRequired: boolean;
  itCertificateRequired: boolean;
  conductRequired: boolean;
  foreignLanguageStandard: string;
  itStandard: string;
  conductStandard: string;
};
type Request = <T,>(path: string, options?: RequestInit) => Promise<T>;
type Props = { isAdmin: boolean; studentClass?: string; request: Request };
const emptyForm: ConditionInput = {
  cohort: 'K24', minimumCredits: 120, minimumGpa: 2, maximumFailedCourses: 0,
  foreignLanguageRequired: true, itCertificateRequired: true, conductRequired: true,
  foreignLanguageStandard: '', itStandard: '', conductStandard: ''
};
const cohortFromClass = (className?: string) => {
  const found = (className || '').toUpperCase().match(/(?:^|[A-Z])(\d{2})(?:[A-Z]|$)/);
  return found ? `K${found[1]}` : '';
};
const active = (c: GraduationCondition) => c.isActive !== false;
const yesNo = (required?: boolean) => required ? 'Bắt buộc' : 'Không bắt buộc';
const fromExisting = (c: GraduationCondition): ConditionInput => ({
  cohort: c.cohort, minimumCredits: c.requiredCredits ?? 0, minimumGpa: c.minGpa ?? 0,
  maximumFailedCourses: c.maximumFailedCourses ?? 0,
  foreignLanguageRequired: c.foreignLanguageRequired ?? !!c.foreignLanguageStandard,
  itCertificateRequired: c.itCertificateRequired ?? !!c.itStandard,
  conductRequired: c.conductRequired ?? !!c.conductStandard,
  foreignLanguageStandard: c.foreignLanguageStandard || '', itStandard: c.itStandard || '',
  conductStandard: c.conductStandard || ''
});

export default function GraduationConditionsPage({ isAdmin, studentClass, request }: Props) {
  const studentCohort = useMemo(() => cohortFromClass(studentClass), [studentClass]);
  const [conditions, setConditions] = useState<GraduationCondition[]>([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<ConditionInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const rows = await request<GraduationCondition[]>('/api/graduation-conditions');
      setConditions(rows);
    } catch (e) { setError('Không tải được điều kiện tốt nghiệp: ' + (e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [isAdmin, request]);
  useEffect(() => { if (studentCohort) setSelectedCohort(studentCohort); }, [studentCohort]);

  function startCreate() { setForm({ ...emptyForm, cohort: studentCohort || 'K24' }); setEditingId(null); setShowForm(true); setError(''); setMessage(''); }
  function startEdit(c: GraduationCondition) { setForm(fromExisting(c)); setEditingId(c.id); setShowForm(true); setError(''); setMessage(''); }
  function closeForm() { setShowForm(false); setEditingId(null); }
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const path = editingId ? `/api/graduation-conditions/${encodeURIComponent(editingId)}` : '/api/graduation-conditions';
      await request<GraduationCondition>(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
      closeForm(); await load(); setMessage(editingId ? 'Đã cập nhật điều kiện tốt nghiệp.' : 'Đã thêm điều kiện tốt nghiệp.');
    } catch (e) { setError('Không lưu được: ' + (e as Error).message); }
    finally { setSaving(false); }
  }
  async function toggle(c: GraduationCondition) {
    setError(''); setMessage('');
    try {
      await request(`/api/graduation-conditions/${encodeURIComponent(c.id)}/toggle-status`, { method: 'PATCH' });
      await load(); setMessage('Đã thay đổi trạng thái hiệu lực.');
    } catch (e) { setError('Không thể đổi trạng thái: ' + (e as Error).message); }
  }
  async function remove(c: GraduationCondition) {
    if (!window.confirm(`Xóa mềm bộ điều kiện ${c.cohort}? Dữ liệu vẫn được giữ trong MongoDB.`)) return;
    setError(''); setMessage('');
    try {
      await request(`/api/graduation-conditions/${encodeURIComponent(c.id)}`, { method: 'DELETE' });
      await load(); setMessage('Đã xóa mềm điều kiện tốt nghiệp.');
    } catch (e) { setError('Không xóa được: ' + (e as Error).message); }
  }
  const displayed = conditions.filter(c => c.cohort.toLowerCase().includes(filter.trim().toLowerCase()));
  const chosen = conditions.find(c => c.cohort === selectedCohort && active(c));
  const visibleStudentConditions = selectedCohort ? (chosen ? [chosen] : []) : conditions.filter(active);

  return <div className="grad-module">
    <section className="panel grad-intro">
      <div className="section-heading">
        <div><h2><GraduationCap size={23}/> Điều kiện xét tốt nghiệp</h2>
          <p>{isAdmin ? 'Thiết lập bộ tiêu chí xét tốt nghiệp cho từng khóa sinh viên' : 'Tra cứu quy định tốt nghiệp do Phòng Đào tạo công bố'}</p></div>
        <div className="grad-actions"><button type="button" className="secondary compact" onClick={() => void load()}><RefreshCw size={16}/> Tải lại</button>
          {isAdmin && <button type="button" className="primary compact" onClick={startCreate}><Plus size={16}/> Thêm bộ điều kiện</button>}</div>
      </div>
      {studentCohort && !isAdmin && <p className="grad-cohort-hint">Lớp của bạn: <b>{studentClass}</b> · Khóa dự kiến: <b>{studentCohort}</b>. Bạn có thể chọn khóa khác để tra cứu.</p>}
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      {loading && <p className="muted">Đang tải điều kiện tốt nghiệp...</p>}
    </section>

    {isAdmin && <>
      {showForm && <section className="panel grad-form-panel">
        <div className="section-heading"><div><h2>{editingId ? 'Chỉnh sửa bộ điều kiện' : 'Thiết lập điều kiện tốt nghiệp'}</h2><p>Các tiêu chí áp dụng cho toàn bộ sinh viên của khóa được chọn</p></div><button type="button" className="secondary compact" onClick={closeForm}><X size={16}/> Đóng</button></div>
        <form className="grad-form" onSubmit={save}>
          <label>Khóa sinh viên (K21, K22, K24...)<input required pattern="[Kk][0-9]{2,4}" maxLength={5} value={form.cohort} onChange={e => setForm({ ...form, cohort: e.target.value.toUpperCase() })}/></label>
          <label>Tổng tín chỉ tối thiểu<input type="number" required min={0} max={400} value={form.minimumCredits} onChange={e => setForm({ ...form, minimumCredits: Number(e.target.value) })}/></label>
          <label>GPA tối thiểu (thang 4)<input type="number" required min={0} max={4} step="0.01" value={form.minimumGpa} onChange={e => setForm({ ...form, minimumGpa: Number(e.target.value) })}/></label>
          <label>Số học phần chưa đạt tối đa<input type="number" required min={0} max={100} value={form.maximumFailedCourses} onChange={e => setForm({ ...form, maximumFailedCourses: Number(e.target.value) })}/></label>
          <div className="grad-requirements">
            <label className="grad-check"><input type="checkbox" checked={form.foreignLanguageRequired} onChange={e => setForm({ ...form, foreignLanguageRequired: e.target.checked })}/> Yêu cầu ngoại ngữ</label>
            <label>Chuẩn ngoại ngữ (mô tả)<input maxLength={250} placeholder="Ví dụ: đạt chuẩn ngoại ngữ theo quy định" value={form.foreignLanguageStandard} onChange={e => setForm({ ...form, foreignLanguageStandard: e.target.value })}/></label>
            <label className="grad-check"><input type="checkbox" checked={form.itCertificateRequired} onChange={e => setForm({ ...form, itCertificateRequired: e.target.checked })}/> Yêu cầu tin học</label>
            <label>Chuẩn tin học (mô tả)<input maxLength={250} placeholder="Ví dụ: chứng chỉ tin học theo quy định" value={form.itStandard} onChange={e => setForm({ ...form, itStandard: e.target.value })}/></label>
            <label className="grad-check"><input type="checkbox" checked={form.conductRequired} onChange={e => setForm({ ...form, conductRequired: e.target.checked })}/> Yêu cầu rèn luyện</label>
            <label>Chuẩn rèn luyện (mô tả)<input maxLength={250} placeholder="Ví dụ: kết quả rèn luyện đạt yêu cầu" value={form.conductStandard} onChange={e => setForm({ ...form, conductStandard: e.target.value })}/></label>
          </div>
          <div className="grad-form-buttons"><button className="primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo bộ điều kiện'}</button><button className="secondary" type="button" onClick={closeForm}>Hủy</button></div>
        </form>
      </section>}
      <section className="panel">
        <div className="section-heading"><div><h2>Danh sách bộ điều kiện</h2><p>Quản lý các khóa, bật/tắt hiệu lực hoặc xóa mềm</p></div><label className="grad-search"><Search size={17}/><input placeholder="Tìm khóa K24..." value={filter} onChange={e => setFilter(e.target.value)}/></label></div>
        <div className="table-scroll"><table><thead><tr><th>Khóa</th><th>Tín chỉ</th><th>GPA</th><th>HP chưa đạt tối đa</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
          {displayed.map(c => <tr key={c.id}><td><strong>{c.cohort}</strong></td><td>{c.requiredCredits ?? '—'}</td><td>{c.minGpa ?? '—'}</td><td>{c.maximumFailedCourses ?? 'Chưa cấu hình'}</td><td><span className={active(c) ? 'grad-status grad-status-active' : 'grad-status grad-status-off'}>{active(c) ? 'Đang áp dụng' : 'Tạm ngừng'}</span></td><td><div className="grad-row-actions"><button className="secondary compact" onClick={() => startEdit(c)}><Pencil size={14}/> Sửa</button><button className="secondary compact" onClick={() => void toggle(c)}>{active(c) ? <CircleOff size={14}/> : <CheckCircle2 size={14}/>} {active(c) ? 'Tắt' : 'Bật'}</button><button className="danger" title="Xóa mềm" onClick={() => void remove(c)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table>{!loading && displayed.length === 0 && <p className="empty">Chưa có bộ điều kiện nào. Nhấn “Thêm bộ điều kiện” để bắt đầu.</p>}</div>
      </section>
    </>}

    {!isAdmin && <section className="panel">
      <div className="section-heading"><div><h2>Điều kiện tốt nghiệp theo khóa</h2><p>Thông tin để sinh viên chủ động theo dõi yêu cầu của chương trình</p></div>
        <label className="grad-select-label">Chọn khóa
          <select value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)}><option value="">Tất cả khóa đang áp dụng</option>{Array.from(new Set([...(studentCohort ? [studentCohort] : []), ...conditions.filter(active).map(c => c.cohort)])).sort().map(c => <option key={c} value={c}>{c}</option>)}</select>
        </label>
      </div>
      {visibleStudentConditions.map(c => <article className="grad-card" key={c.id}>
        <div className="grad-card-head"><div><span className="grad-eyebrow">BỘ TIÊU CHÍ ÁP DỤNG</span><h3>Khóa {c.cohort}</h3></div><span className="grad-status grad-status-active"><CheckCircle2 size={15}/> Đang áp dụng</span></div>
        <div className="grad-metrics"><div><span>Tín chỉ tối thiểu</span><strong>{c.requiredCredits ?? '—'}</strong></div><div><span>GPA tối thiểu</span><strong>{c.minGpa ?? '—'} <small>/ 4.0</small></strong></div><div><span>Học phần chưa đạt tối đa</span><strong>{c.maximumFailedCourses ?? 'Chưa cấu hình'}</strong></div></div>
        <div className="grad-criteria"><div><BookOpenCheck size={19}/><div><b>Chuẩn ngoại ngữ: {yesNo(c.foreignLanguageRequired)}</b><p>{c.foreignLanguageStandard || 'Chưa có mô tả chi tiết'}</p></div></div><div><BookOpenCheck size={19}/><div><b>Chuẩn tin học: {yesNo(c.itCertificateRequired)}</b><p>{c.itStandard || 'Chưa có mô tả chi tiết'}</p></div></div><div><BookOpenCheck size={19}/><div><b>Chuẩn rèn luyện: {yesNo(c.conductRequired)}</b><p>{c.conductStandard || 'Chưa có mô tả chi tiết'}</p></div></div></div>
      </article>)}
      {!loading && visibleStudentConditions.length === 0 && <p className="empty">{selectedCohort ? `Chưa có bộ điều kiện đang áp dụng cho khóa ${selectedCohort}. Hãy liên hệ Phòng Đào tạo.` : 'Phòng Đào tạo chưa công bố bộ điều kiện tốt nghiệp.'}</p>}
      <p className="grad-note">Đây là quy định xét tốt nghiệp, không phải kết quả xác nhận bạn đã đủ điều kiện tốt nghiệp. Kết quả xét thực tế cần thêm dữ liệu điểm, tín chỉ và hồ sơ của từng sinh viên.</p>
    </section>}
  </div>;
}
