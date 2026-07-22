import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [filter, setFilter] = useState({
    type: 'monthly',
    month: new Date().getMonth() + 1,
    semester: 'Ganjil',
    school: '',
    class: '',
    assessmentType: ''
  });

  const [allStudents, setAllStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Absensi'); // 'Absensi' | 'Penilaian'

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

  const assessmentTypes = ['Tugas', 'Quiz', 'UH1', 'UH2', 'UH3', 'UH4', 'UTS', 'UAS', 'Praktik', 'Proyek'];
  const uniqueSchools = [...new Set(allStudents.map(s => s.school_name).filter(Boolean))].sort();
  const availableClasses = [...new Set(
    allStudents
      .filter(s => !filter.school || s.school_name === filter.school)
      .map(s => s.class)
      .filter(Boolean)
  )].sort();

  const generateReport = async () => {
    if (!filter.class) return alert('Silakan pilih kelas terlebih dahulu');
    setLoading(true);
    try {
      const { data: studentsData } = await supabase.from('students').select('id, name, class, teacher_name, education_level, school_name').eq('class', filter.class);
      if (!studentsData || studentsData.length === 0) {
        setAttendanceHistory([]);
        setAssessmentHistory([]);
        return;
      }
      
      const studentIds = studentsData.map(s => s.id);
      
      let attQuery = supabase.from('attendance').select('*, students(name, class, teacher_name, education_level, school_name)').in('student_id', studentIds);
      let assQuery = supabase.from('assessments').select('*, students(name, class, teacher_name, education_level, school_name)').in('student_id', studentIds);
      
      if (filter.type === 'semester') {
        attQuery = attQuery.eq('semester', filter.semester);
        assQuery = assQuery.eq('semester', filter.semester);
      }

      if (filter.assessmentType) {
        assQuery = assQuery.eq('assessment_type', filter.assessmentType);
      }
      
      const [attRes, assRes] = await Promise.all([
        attQuery.order('date', { ascending: false }),
        assQuery.order('assessment_date', { ascending: false })
      ]);

      let finalAttData = attRes.data || [];
      let finalAssData = assRes.data || [];

      if (filter.type === 'monthly') {
         const monthStr = `-${filter.month.toString().padStart(2, '0')}-`;
         finalAttData = finalAttData.filter(r => r.date && r.date.includes(monthStr));
         finalAssData = finalAssData.filter(r => r.assessment_date && r.assessment_date.includes(monthStr));
      }
      
      if (finalAttData.length > 0) {
        const mappedAtt = finalAttData.map(r => ({
          id: r.id,
          tanggal: r.date,
          nama_murid: r.students?.name,
          kelas: r.students?.class,
          guru: r.students?.teacher_name || '-',
          sekolah: r.students?.school_name || '-',
          jenjang: r.students?.education_level || '-',
          status: r.status,
          keterangan: r.description || '-'
        }));
        setAttendanceHistory(mappedAtt);
      } else {
        setAttendanceHistory([]);
      }
      
      if (finalAssData.length > 0) {
        const mappedAss = finalAssData.map(r => ({
          id: r.id,
          tanggal: r.assessment_date,
          nama_murid: r.students?.name,
          kelas: r.students?.class,
          guru: r.students?.teacher_name || '-',
          sekolah: r.students?.school_name || '-',
          jenjang: r.students?.education_level || '-',
          jenis: r.assessment_type,
          mata_pelajaran: r.subject,
          materi: r.learning_material,
          nilai: r.score
        }));
        setAssessmentHistory(mappedAss);
      } else {
        setAssessmentHistory([]);
      }
      
    } catch (err) {
      console.error('Error generating report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      let dataToDownload = [];
      let filename = '';

      if (activeTab === 'Absensi') {
        if (!attendanceHistory || attendanceHistory.length === 0) {
          alert('Tidak ada data absensi untuk diunduh. Silakan klik "Generate Laporan" terlebih dahulu.');
          return;
        }
        dataToDownload = attendanceHistory.map((item, index) => ({
          'No': index + 1,
          'Tanggal': item.tanggal || '',
          'Nama Murid': item.nama_murid || '',
          'Kelas': item.kelas || '',
          'Guru': item.guru || '',
          'Sekolah': item.sekolah || '',
          'Jenjang': item.jenjang || '',
          'Status': item.status || '',
          'Keterangan': item.keterangan || ''
        }));
        filename = `Laporan_Absensi_Kelas_${filter.class || 'Semua'}_${filter.type}.xlsx`;
      } else {
        if (!assessmentHistory || assessmentHistory.length === 0) {
          alert('Tidak ada data penilaian untuk diunduh. Silakan klik "Generate Laporan" terlebih dahulu.');
          return;
        }
        dataToDownload = assessmentHistory.map((item, index) => ({
          'No': index + 1,
          'Tanggal': item.tanggal || '',
          'Nama Murid': item.nama_murid || '',
          'Kelas': item.kelas || '',
          'Guru': item.guru || '',
          'Sekolah': item.sekolah || '',
          'Jenjang': item.jenjang || '',
          'Jenis': item.jenis || '',
          'Mata Pelajaran': item.mata_pelajaran || '',
          'Materi': item.materi || '',
          'Nilai': item.nilai ?? ''
        }));
        filename = `Laporan_Penilaian_Kelas_${filter.class || 'Semua'}_${filter.type}.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(dataToDownload);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab);
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading excel:', err);
      alert('Gagal mengunduh file: ' + err.message);
    }
  };

  return (
    <div className="reports-page">
      <div className="flex justify-between items-center mb-6">
        <h1>Laporan & Analitik</h1>
      </div>

      <div className="glass-card mb-6">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
            <label>Tipe Laporan</label>
            <select className="glass-input glass-select" value={filter.type} onChange={e => setFilter({...filter, type: e.target.value})}>
              <option value="monthly">Per Bulan</option>
              <option value="semester">Per Semester</option>
            </select>
          </div>
          
          {filter.type === 'monthly' && (
            <div className="input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
              <label>Bulan</label>
              <select className="glass-input glass-select" value={filter.month} onChange={e => setFilter({...filter, month: e.target.value})}>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
          )}

          {filter.type === 'semester' && (
            <div className="input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
              <label>Semester</label>
              <select className="glass-input glass-select" value={filter.semester} onChange={e => setFilter({...filter, semester: e.target.value})}>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          )}

          <div className="input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
            <label>Sekolah</label>
            <select className="glass-input glass-select" value={filter.school} onChange={e => setFilter({...filter, school: e.target.value, class: ''})}>
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
            <label>Kelas</label>
            <select className="glass-input glass-select" value={filter.class} onChange={e => setFilter({...filter, class: e.target.value})}>
              <option value="">Pilih Kelas</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
            <label>Jenis Penilaian (Opsional)</label>
            <select className="glass-input glass-select" value={filter.assessmentType} onChange={e => setFilter({...filter, assessmentType: e.target.value})}>
              <option value="">Semua Jenis</option>
              {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={generateReport}>Generate Laporan</button>
        </div>
      </div>

      <div className="glass-card mt-6" style={{ marginTop: '2rem' }}>
        <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div className="flex gap-4">
            <button 
              className={`btn ${activeTab === 'Absensi' ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => setActiveTab('Absensi')}
            >
              Laporan Absensi
            </button>
            <button 
              className={`btn ${activeTab === 'Penilaian' ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => setActiveTab('Penilaian')}
            >
              Laporan Nilai
            </button>
          </div>
          <button className="btn btn-outline" onClick={handleDownloadExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> {activeTab === 'Absensi' ? 'Unduh Data Absensi (.xls)' : 'Unduh Data Laporan (.xls)'}
          </button>
        </div>

        <div className="table-container">
          <table className="glass-table">
            <thead>
              {activeTab === 'Absensi' ? (
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Murid</th>
                  <th>Kelas</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                </tr>
              ) : (
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Murid</th>
                  <th>Kelas</th>
                  <th>Jenis</th>
                  <th>Mata Pelajaran</th>
                  <th>Materi</th>
                  <th>Nilai</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">Memuat riwayat...</td></tr>
              ) : activeTab === 'Absensi' ? (
                attendanceHistory.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-secondary">Tidak ada data absensi untuk filter tersebut.</td></tr>
                ) : attendanceHistory.map(record => (
                  <tr key={record.id}>
                    <td>{record.tanggal}</td>
                    <td style={{ fontWeight: 500 }}>{record.nama_murid}</td>
                    <td><span className="badge badge-neutral">{record.kelas}</span></td>
                    <td>
                      <span className={`badge ${
                        record.status === 'Hadir' ? 'badge-success' : 
                        record.status === 'Sakit' ? 'badge-info' : 
                        record.status === 'Izin' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.keterangan}</td>
                  </tr>
                ))
              ) : (
                assessmentHistory.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-secondary">Tidak ada data penilaian untuk filter tersebut.</td></tr>
                ) : assessmentHistory.map(record => (
                  <tr key={record.id}>
                    <td>{record.tanggal}</td>
                    <td style={{ fontWeight: 500 }}>{record.nama_murid}</td>
                    <td><span className="badge badge-neutral">{record.kelas}</span></td>
                    <td><span className="badge badge-info">{record.jenis}</span></td>
                    <td>{record.mata_pelajaran}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.materi}>{record.materi}</td>
                    <td><strong>{record.nilai}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
