import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

const Attendance = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    semester: 'Ganjil',
    schoolFilter: '',
    classFilter: ''
  });

  const [attendanceData, setAttendanceData] = useState({});
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchHistory();
  }, []);

  useEffect(() => {
    // Re-filter when school or class filter changes
    let filtered = allStudents;
    if (formData.schoolFilter) {
      filtered = filtered.filter(s => s.school_name === formData.schoolFilter);
    }
    if (formData.classFilter) {
      filtered = filtered.filter(s => s.class === formData.classFilter);
    }
    setFilteredStudents(filtered);

    // Re-initialize attendance state for the visible students
    const initialAttendance = {};
    filtered.forEach(s => {
      initialAttendance[s.id] = { status: 'Hadir', description: '' };
    });
    setAttendanceData(initialAttendance);
  }, [allStudents, formData.schoolFilter, formData.classFilter]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students (name, class)
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
      if (data) {
        setAllStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleDescriptionChange = (studentId, desc) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], description: desc }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.semester) {
      alert('Tanggal dan Semester harus diisi!');
      return;
    }

    try {
      const recordsToInsert = filteredStudents.map(student => ({
        student_id: student.id,
        date: formData.date,
        semester: formData.semester,
        status: attendanceData[student.id]?.status || 'Hadir',
        description: attendanceData[student.id]?.description || ''
      }));

      const { error } = await supabase.from('attendance').insert(recordsToInsert);
      if (error) throw error;
      
      alert('Data absensi berhasil disimpan!');
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Gagal menyimpan absensi, pastikan koneksi Supabase benar.');
    }
  };

  // Unique schools and classes for filter
  const uniqueSchools = [...new Set(allStudents.map(s => s.school_name).filter(Boolean))].sort();
  const availableClasses = [...new Set(
    allStudents
      .filter(s => !formData.schoolFilter || s.school_name === formData.schoolFilter)
      .map(s => s.class)
      .filter(Boolean)
  )].sort();

  return (
    <div className="attendance-page">
      <h1 className="mb-6">Absensi Murid</h1>

      <div className="glass-card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="input-group">
            <label>Tanggal</label>
            <input type="date" className="glass-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Semester</label>
            <select className="glass-input glass-select" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <div className="input-group">
            <label>Filter Sekolah</label>
            <select className="glass-input glass-select" value={formData.schoolFilter} onChange={e => setFormData({...formData, schoolFilter: e.target.value, classFilter: ''})}>
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Filter Kelas</label>
            <select className="glass-input glass-select" value={formData.classFilter} onChange={e => setFormData({...formData, classFilter: e.target.value})}>
              <option value="">Semua Kelas</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h3>Daftar Kehadiran</h3>
          <button className="btn btn-primary" onClick={handleSubmit}>Simpan Absensi</button>
        </div>

        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Nama Murid</th>
                <th>Kelas</th>
                <th style={{ width: '350px' }}>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center">Memuat data...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-secondary">Pilih sekolah atau kelas untuk menampilkan daftar murid.</td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: 500 }}>{student.name}</td>
                  <td><span className="badge badge-neutral">{student.class}</span></td>
                  <td>
                    <div className="flex gap-2">
                      {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(status => (
                        <button 
                          key={status}
                          onClick={() => handleStatusChange(student.id, status)}
                          className={`btn ${attendanceData[student.id]?.status === status ? 'btn-primary' : 'btn-outline'}`}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flex: 1 }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="glass-input" 
                      style={{ padding: '0.4rem 0.75rem', width: '100%' }}
                      placeholder="Keterangan..."
                      value={attendanceData[student.id]?.description || ''}
                      onChange={e => handleDescriptionChange(student.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card mt-6" style={{ marginTop: '1.5rem' }}>
        <h3 className="mb-4">Riwayat Absensi Terakhir</h3>
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Murid</th>
                <th>Kelas</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan="5" className="text-center">Memuat riwayat...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-secondary">Belum ada riwayat absensi.</td></tr>
              ) : history.map(record => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td style={{ fontWeight: 500 }}>{record.students?.name}</td>
                  <td><span className="badge badge-neutral">{record.students?.class}</span></td>
                  <td>
                    <span className={`badge ${
                      record.status === 'Hadir' ? 'badge-success' : 
                      record.status === 'Sakit' ? 'badge-info' : 
                      record.status === 'Izin' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
