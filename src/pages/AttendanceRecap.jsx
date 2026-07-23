import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Download, Search, Eye, X, CalendarCheck, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

const AttendanceRecap = () => {
  const [filter, setFilter] = useState({
    school: '',
    class: '',
    searchName: '',
    month: '',
    semester: 'Ganjil'
  });

  const [allStudents, setAllStudents] = useState([]);
  const [headerInfo, setHeaderInfo] = useState({
    teacher_name: '',
    school_name: '',
    education_level: ''
  });
  
  const [recapData, setRecapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const monthsList = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      if (data) {
        setAllStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students', err);
    }
  };

  const uniqueSchools = [...new Set(allStudents.map(s => s.school_name).filter(Boolean))].sort();
  const availableClasses = [...new Set(
    allStudents
      .filter(s => !filter.school || s.school_name === filter.school)
      .map(s => s.class)
      .filter(Boolean)
  )].sort();

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const generateRecap = async () => {
    if (!filter.class) return alert('Silakan pilih kelas terlebih dahulu');
    setLoading(true);
    
    try {
      // Fetch students for the class
      let studentQuery = supabase
        .from('students')
        .select('*')
        .eq('class', filter.class)
        .order('name', { ascending: true });
        
      const { data: studentsData, error: studentError } = await studentQuery;
        
      if (studentError) throw studentError;
      
      if (!studentsData || studentsData.length === 0) {
        setRecapData([]);
        setHeaderInfo({ teacher_name: '', school_name: '', education_level: '' });
        return;
      }
      
      // Get header info from first student
      const firstStudent = studentsData[0];
      setHeaderInfo({
        teacher_name: firstStudent.teacher_name || '',
        school_name: firstStudent.school_name || '',
        education_level: firstStudent.education_level || ''
      });
      
      const studentIds = studentsData.map(s => s.id);
      
      // Fetch all attendance records for these students
      let attQuery = supabase
        .from('attendance')
        .select('*')
        .in('student_id', studentIds);

      if (filter.semester) {
        attQuery = attQuery.eq('semester', filter.semester);
      }
        
      const { data: attData, error: attError } = await attQuery.order('date', { ascending: true });
      if (attError) throw attError;

      let filteredAttData = attData || [];
      
      if (filter.month) {
        const monthStr = `-${filter.month.toString().padStart(2, '0')}-`;
        filteredAttData = filteredAttData.filter(a => a.date && a.date.includes(monthStr));
      }

      // Group attendance records by student
      const recap = studentsData.map(student => {
        const studentRecords = filteredAttData.filter(a => a.student_id === student.id);
        
        const hadirRecords = studentRecords.filter(a => a.status === 'Hadir');
        const sakitRecords = studentRecords.filter(a => a.status === 'Sakit');
        const izinRecords = studentRecords.filter(a => a.status === 'Izin');
        const alphaRecords = studentRecords.filter(a => a.status === 'Alpha');

        const totalRecorded = studentRecords.length;
        const percentage = totalRecorded > 0 ? Math.round((hadirRecords.length / totalRecorded) * 100) : 0;

        return {
          id: student.id,
          name: student.name,
          class: student.class,
          nisn: student.nisn || '-',
          totalRecorded,
          percentage,
          hadir: {
            count: hadirRecords.length,
            records: hadirRecords,
            datesFormatted: hadirRecords.map(r => formatDateDisplay(r.date)).join(', ')
          },
          sakit: {
            count: sakitRecords.length,
            records: sakitRecords,
            datesFormatted: sakitRecords.map(r => `${formatDateDisplay(r.date)}${r.description ? ` (${r.description})` : ''}`).join(', ')
          },
          izin: {
            count: izinRecords.length,
            records: izinRecords,
            datesFormatted: izinRecords.map(r => `${formatDateDisplay(r.date)}${r.description ? ` (${r.description})` : ''}`).join(', ')
          },
          alpha: {
            count: alphaRecords.length,
            records: alphaRecords,
            datesFormatted: alphaRecords.map(r => `${formatDateDisplay(r.date)}${r.description ? ` (${r.description})` : ''}`).join(', ')
          },
          allRecords: studentRecords
        };
      });
      
      setRecapData(recap);
      
    } catch (err) {
      console.error('Error generating attendance recap:', err);
      alert('Terjadi kesalahan saat memuat data rekapitulasi absensi.');
    } finally {
      setLoading(false);
    }
  };

  // Filter recap data by student name search if user enters search query
  const displayedRecapData = recapData.filter(row => {
    if (!filter.searchName) return true;
    return row.name.toLowerCase().includes(filter.searchName.toLowerCase());
  });

  // Calculate summary stats
  const totalStudents = displayedRecapData.length;
  const totalHadirCount = displayedRecapData.reduce((acc, row) => acc + row.hadir.count, 0);
  const totalSakitCount = displayedRecapData.reduce((acc, row) => acc + row.sakit.count, 0);
  const totalIzinCount = displayedRecapData.reduce((acc, row) => acc + row.izin.count, 0);
  const totalAlphaCount = displayedRecapData.reduce((acc, row) => acc + row.alpha.count, 0);
  const avgAttendancePercent = totalStudents > 0 
    ? Math.round(displayedRecapData.reduce((acc, row) => acc + row.percentage, 0) / totalStudents)
    : 0;

  const handleDownloadExcel = () => {
    try {
      if (!displayedRecapData || displayedRecapData.length === 0) {
        alert('Tidak ada data rekap untuk diunduh. Silakan klik "Generate Rekap" terlebih dahulu.');
        return;
      }
      
      const dataToDownload = displayedRecapData.map((row, index) => ({
        'No': index + 1,
        'Nama Murid': row.name || '',
        'Kelas': row.class || '',
        'NISN': row.nisn || '',
        'Hadir (Jumlah)': `${row.hadir.count}x`,
        'Tanggal Hadir': row.hadir.datesFormatted || '-',
        'Sakit (Jumlah)': `${row.sakit.count}x`,
        'Tanggal Sakit': row.sakit.datesFormatted || '-',
        'Izin (Jumlah)': `${row.izin.count}x`,
        'Tanggal Izin': row.izin.datesFormatted || '-',
        'Alpha (Jumlah)': `${row.alpha.count}x`,
        'Tanggal Alpha': row.alpha.datesFormatted || '-',
        'Persentase Kehadiran': `${row.percentage}%`
      }));

      const ws = XLSX.utils.json_to_sheet(dataToDownload);
      
      // Set custom column widths for readability
      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 10 }, // Kelas
        { wch: 15 }, // NISN
        { wch: 15 }, // Hadir Count
        { wch: 30 }, // Tanggal Hadir
        { wch: 15 }, // Sakit Count
        { wch: 30 }, // Tanggal Sakit
        { wch: 15 }, // Izin Count
        { wch: 30 }, // Tanggal Izin
        { wch: 15 }, // Alpha Count
        { wch: 30 }, // Tanggal Alpha
        { wch: 20 }  // % Kehadiran
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const monthLabel = filter.month ? monthsList.find(m => m.value === filter.month)?.label : 'SemuaBulan';
      a.download = `Rekap_Absensi_Kelas_${filter.class || 'Semua'}_${monthLabel}_${filter.semester}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading attendance recap excel:', err);
      alert('Gagal mengunduh file rekap absensi: ' + err.message);
    }
  };

  return (
    <div className="recap-attendance-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarCheck className="text-primary" size={32} />
            Rekapitulasi Absensi Murid
          </h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>
            Rekapan presensi hadir, sakit, izin, dan alpha per anak disertakan rincian tanggal kejadian.
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="glass-card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Sekolah</label>
            <select className="glass-input glass-select" value={filter.school} onChange={e => setFilter({...filter, school: e.target.value, class: ''})}>
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Kelas <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="glass-input glass-select" value={filter.class} onChange={e => setFilter({...filter, class: e.target.value})}>
              <option value="">Pilih Kelas</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Cari Nama Murid</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Ketik nama murid..." 
                value={filter.searchName}
                onChange={e => setFilter({...filter, searchName: e.target.value})}
                style={{ paddingRight: '2.25rem' }}
              />
              <Search size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Bulan</label>
            <select className="glass-input glass-select" value={filter.month} onChange={e => setFilter({...filter, month: e.target.value})}>
              <option value="">Semua Bulan</option>
              {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Semester</label>
            <select className="glass-input glass-select" value={filter.semester} onChange={e => setFilter({...filter, semester: e.target.value})}>
              <option value="">Semua Semester</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
             <button className="btn btn-primary w-full" onClick={generateRecap}>
               Generate Rekap
             </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Section */}
      {recapData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Total Murid</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{totalStudents}</h3>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
            <span className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} className="text-success" /> Total Hadir
            </span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: '#10b981' }}>{totalHadirCount}x</h3>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #3b82f6' }}>
            <span className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} style={{ color: '#3b82f6' }} /> Total Sakit
            </span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: '#3b82f6' }}>{totalSakitCount}x</h3>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <span className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={14} style={{ color: '#f59e0b' }} /> Total Izin
            </span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: '#f59e0b' }}>{totalIzinCount}x</h3>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #ef4444' }}>
            <span className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <XCircle size={14} style={{ color: '#ef4444' }} /> Total Alpha
            </span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: '#ef4444' }}>{totalAlphaCount}x</h3>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Rata-rata Kehadiran</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{avgAttendancePercent}%</h3>
          </div>
        </div>
      )}

      <div className="glass-card">
        {/* Header Metadata Section */}
        <div className="mb-6 flex justify-between items-start flex-wrap gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <div style={{ minWidth: '120px', color: 'var(--text-secondary)' }}>Jenjang</div>
              <div style={{ fontWeight: 600 }}>: {headerInfo.education_level || '-'}</div>
            </div>
            <div className="flex gap-4">
              <div style={{ minWidth: '120px', color: 'var(--text-secondary)' }}>Nama Sekolah</div>
              <div style={{ fontWeight: 600 }}>: {headerInfo.school_name || '-'}</div>
            </div>
            <div className="flex gap-4">
              <div style={{ minWidth: '120px', color: 'var(--text-secondary)' }}>Nama Guru</div>
              <div style={{ fontWeight: 600 }}>: {headerInfo.teacher_name || '-'}</div>
            </div>
            <div className="flex gap-4">
              <div style={{ minWidth: '120px', color: 'var(--text-secondary)' }}>Bulan & Semester</div>
              <div style={{ fontWeight: 600 }}>
                : {filter.month ? monthsList.find(m => m.value === filter.month)?.label : 'Semua Bulan'} ({filter.semester || 'Semua Semester'})
              </div>
            </div>
          </div>
          
          <button className="btn btn-outline" onClick={handleDownloadExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Export Excel (.xlsx)
          </button>
        </div>

        {/* Table Section */}
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="glass-table" style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                <th style={{ minWidth: '180px' }}>Nama Murid</th>
                <th style={{ width: '90px' }}>Kelas</th>
                <th style={{ minWidth: '180px' }}>Hadir</th>
                <th style={{ minWidth: '180px' }}>Sakit</th>
                <th style={{ minWidth: '180px' }}>Izin</th>
                <th style={{ minWidth: '180px' }}>Alpha</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Kehadiran</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={9} className="text-center">Memuat data rekapitulasi absensi...</td></tr>
              ) : displayedRecapData.length === 0 ? (
                 <tr><td colSpan={9} className="text-center text-secondary">
                   {recapData.length === 0 ? 'Pilih kelas dan klik "Generate Rekap" untuk melihat rekapan absensi murid.' : 'Tidak ada nama murid yang cocok dengan kata kunci pencarian.'}
                 </td></tr>
              ) : (
                displayedRecapData.map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td><span className="badge badge-neutral">{row.class}</span></td>
                    
                    {/* Hadir Column */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-success" style={{ width: 'fit-content' }}>
                          {row.hadir.count}x Hadir
                        </span>
                        {row.hadir.datesFormatted ? (
                          <span style={{ fontSize: '0.75rem', opacity: 0.8, color: '#a7f3d0' }}>
                            Tgl: {row.hadir.datesFormatted}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>-</span>
                        )}
                      </div>
                    </td>

                    {/* Sakit Column */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-info" style={{ width: 'fit-content' }}>
                          {row.sakit.count}x Sakit
                        </span>
                        {row.sakit.datesFormatted ? (
                          <span style={{ fontSize: '0.75rem', opacity: 0.8, color: '#93c5fd' }}>
                            Tgl: {row.sakit.datesFormatted}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>-</span>
                        )}
                      </div>
                    </td>

                    {/* Izin Column */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-warning" style={{ width: 'fit-content' }}>
                          {row.izin.count}x Izin
                        </span>
                        {row.izin.datesFormatted ? (
                          <span style={{ fontSize: '0.75rem', opacity: 0.8, color: '#fde047' }}>
                            Tgl: {row.izin.datesFormatted}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>-</span>
                        )}
                      </div>
                    </td>

                    {/* Alpha Column */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-danger" style={{ width: 'fit-content' }}>
                          {row.alpha.count}x Alpha
                        </span>
                        {row.alpha.datesFormatted ? (
                          <span style={{ fontSize: '0.75rem', opacity: 0.8, color: '#fca5a5' }}>
                            Tgl: {row.alpha.datesFormatted}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>-</span>
                        )}
                      </div>
                    </td>

                    {/* Kehadiran (%) */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 700,
                        color: row.percentage >= 80 ? '#10b981' : row.percentage >= 60 ? '#f59e0b' : '#ef4444' 
                      }}>
                        {row.percentage}%
                      </span>
                    </td>

                    {/* Action button to open detail modal */}
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                        title="Lihat Log Detail Absensi"
                        onClick={() => setSelectedStudentDetail(row)}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudentDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="flex justify-between items-center mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Detail Log Absensi: {selectedStudentDetail.name}</h3>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  Kelas {selectedStudentDetail.class} • NISN: {selectedStudentDetail.nisn}
                </span>
              </div>
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Attendance breakdown summary badges in modal */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="badge badge-success">{selectedStudentDetail.hadir.count}x Hadir</span>
              <span className="badge badge-info">{selectedStudentDetail.sakit.count}x Sakit</span>
              <span className="badge badge-warning">{selectedStudentDetail.izin.count}x Izin</span>
              <span className="badge badge-danger">{selectedStudentDetail.alpha.count}x Alpha</span>
              <span className="badge badge-neutral">Tingkat Kehadiran: {selectedStudentDetail.percentage}%</span>
            </div>

            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentDetail.allRecords.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-secondary">Belum ada riwayat absensi tercatat.</td></tr>
                  ) : (
                    selectedStudentDetail.allRecords.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.date}</td>
                        <td>{rec.semester}</td>
                        <td>
                          <span className={`badge ${
                            rec.status === 'Hadir' ? 'badge-success' :
                            rec.status === 'Sakit' ? 'badge-info' :
                            rec.status === 'Izin' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td>{rec.description || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn btn-outline" onClick={() => setSelectedStudentDetail(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceRecap;
