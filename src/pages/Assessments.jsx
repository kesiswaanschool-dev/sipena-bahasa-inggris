import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Assessments = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const assessmentTypes = ['Tugas', 'Quiz', 'UH1', 'UH2', 'UH3', 'UH4', 'UTS', 'UAS', 'Praktik', 'Proyek'];
  
  const [formData, setFormData] = useState({
    schoolFilter: '',
    classFilter: '',
    student_id: '',
    assessment_type: 'Tugas',
    learning_material: '',
    score: '',
    assessment_date: new Date().toISOString().split('T')[0],
    subject: '',
    semester: 'Ganjil'
  });

  useEffect(() => {
    fetchStudents();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let query = supabase
        .from('assessments')
        .select(`
          *,
          students (name, class, teacher_name, school_name, education_level)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
        
      const { data, error } = await query;
      if (error) throw error;
      if (data) setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error) throw error;
      if (data) setAllStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) return alert('Pilih murid terlebih dahulu');
    
    try {
      const dataToInsert = {
        student_id: formData.student_id,
        assessment_type: formData.assessment_type,
        learning_material: formData.learning_material,
        score: formData.score,
        assessment_date: formData.assessment_date,
        subject: formData.subject,
        semester: formData.semester
      };
      
      const { error } = await supabase.from('assessments').insert([dataToInsert]);
      if (error) throw error;
      alert('Data penilaian berhasil disimpan!');
      fetchHistory(); // Refresh history
      
      // Reset form but keep some defaults
      setFormData(prev => ({
        ...prev,
        score: '',
        learning_material: '',
        student_id: ''
      }));
    } catch (err) {
      console.error('Error saving assessment:', err);
      alert('Gagal menyimpan nilai, pastikan koneksi Supabase benar.');
    }
  };

  // Derive filter options
  const uniqueSchools = [...new Set(allStudents.map(s => s.school_name).filter(Boolean))].sort();
  
  const availableClasses = [...new Set(
    allStudents
      .filter(s => !formData.schoolFilter || s.school_name === formData.schoolFilter)
      .map(s => s.class)
      .filter(Boolean)
  )].sort();

  const availableStudents = allStudents.filter(s => 
    (!formData.schoolFilter || s.school_name === formData.schoolFilter) &&
    (!formData.classFilter || s.class === formData.classFilter)
  ).sort((a,b) => a.name.localeCompare(b.name));

  const selectedStudent = allStudents.find(s => s.id === formData.student_id);

  return (
    <div className="assessments-page">
      <h1 className="mb-6">Input Penilaian</h1>

      <div className="glass-card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Pilih Sekolah</label>
              <select className="glass-input glass-select" value={formData.schoolFilter} onChange={e => setFormData({...formData, schoolFilter: e.target.value, classFilter: '', student_id: ''})}>
                <option value="">Semua Sekolah</option>
                {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="input-group">
              <label>Pilih Kelas</label>
              <select className="glass-input glass-select" value={formData.classFilter} onChange={e => setFormData({...formData, classFilter: e.target.value, student_id: ''})}>
                <option value="">Semua Kelas</option>
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Pilih Murid (Nama)</label>
              <select required className="glass-input glass-select" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
                <option value="">-- Pilih Murid --</option>
                {availableStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Guru</label>
              <input type="text" className="glass-input" value={selectedStudent ? (selectedStudent.teacher_name || '-') : ''} disabled style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
            </div>
            
            <div className="input-group">
              <label>Jenjang</label>
              <input type="text" className="glass-input" value={selectedStudent ? (selectedStudent.education_level || '-') : ''} disabled style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Tanggal Penilaian</label>
              <input required type="date" className="glass-input" value={formData.assessment_date} onChange={e => setFormData({...formData, assessment_date: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Jenis Penilaian</label>
              <select required className="glass-input glass-select" value={formData.assessment_type} onChange={e => setFormData({...formData, assessment_type: e.target.value})}>
                {assessmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Semester</label>
              <select required className="glass-input glass-select" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
             <div className="input-group">
              <label>Mata Pelajaran</label>
              <input required type="text" className="glass-input" placeholder="Contoh: Matematika" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>

            <div className="input-group">
              <label>Nilai (0-100)</label>
              <input required type="number" min="0" max="100" className="glass-input" placeholder="0" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} />
            </div>
          </div>

          <div className="input-group">
            <label>Materi Pembelajaran</label>
            <textarea 
              required
              className="glass-input" 
              placeholder="Tuliskan ringkasan materi di sini..." 
              rows="3"
              value={formData.learning_material} 
              onChange={e => setFormData({...formData, learning_material: e.target.value})}
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Simpan Penilaian</button>
          </div>
        </form>
      </div>

      <div className="glass-card mt-6" style={{ marginTop: '2rem' }}>
        <h3 className="mb-4">Riwayat Penilaian Terakhir</h3>
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Murid</th>
                <th>Kelas</th>
                <th>Jenjang</th>
                <th>Sekolah</th>
                <th>Guru</th>
                <th>Jenis</th>
                <th>Mata Pelajaran</th>
                <th>Materi</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan="10" className="text-center">Memuat riwayat...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="10" className="text-center text-secondary">Belum ada riwayat penilaian.</td></tr>
              ) : history.map(record => (
                <tr key={record.id}>
                  <td>{record.assessment_date}</td>
                  <td style={{ fontWeight: 500 }}>{record.students?.name}</td>
                  <td><span className="badge badge-neutral">{record.students?.class}</span></td>
                  <td>{record.students?.education_level || '-'}</td>
                  <td>{record.students?.school_name || '-'}</td>
                  <td>{record.students?.teacher_name || '-'}</td>
                  <td><span className="badge badge-info">{record.assessment_type}</span></td>
                  <td>{record.subject}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.learning_material}>
                    {record.learning_material || '-'}
                  </td>
                  <td><strong>{record.score}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Assessments;
