import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

const Recap = () => {
  const [filter, setFilter] = useState({
    semester: 'Ganjil',
    school: '',
    class: ''
  });

  const [allStudents, setAllStudents] = useState([]);
  const [headerInfo, setHeaderInfo] = useState({
    teacher_name: '',
    school_name: '',
    education_level: ''
  });
  
  const [recapData, setRecapData] = useState([]);
  const [loading, setLoading] = useState(false);

  const assessmentColumns = ['Tugas', 'Quiz', 'UH1', 'UH2', 'UH3', 'UH4', 'UTS', 'UAS', 'Praktik', 'Proyek'];

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

  const generateRecap = async () => {
    if (!filter.class) return alert('Silakan pilih kelas terlebih dahulu');
    setLoading(true);
    
    try {
      // Fetch students for the class to get teacher/school info and base for recap
      const { data: studentsData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('class', filter.class)
        .order('name', { ascending: true });
        
      if (studentError) throw studentError;
      
      if (!studentsData || studentsData.length === 0) {
        setRecapData([]);
        setHeaderInfo({ teacher_name: '', school_name: '', education_level: '' });
        return;
      }
      
      // Get header info from the first student in the class
      const firstStudent = studentsData[0];
      setHeaderInfo({
        teacher_name: firstStudent.teacher_name || '',
        school_name: firstStudent.school_name || '',
        education_level: firstStudent.education_level || ''
      });
      
      const studentIds = studentsData.map(s => s.id);
      
      // Fetch all assessments for these students in this semester
      const { data: assessmentsData, error: assessError } = await supabase
        .from('assessments')
        .select('*')
        .in('student_id', studentIds)
        .eq('semester', filter.semester)
        .order('assessment_date', { ascending: false }); // get latest
        
      if (assessError) throw assessError;
      
      // Group assessments by student
      const recap = studentsData.map(student => {
        const studentAssessments = assessmentsData?.filter(a => a.student_id === student.id) || [];
        
        // Pivot data: for each type, get the most recent score
        const scores = {};
        assessmentColumns.forEach(col => {
           const typeMatch = studentAssessments.find(a => a.assessment_type.toLowerCase() === col.toLowerCase());
           scores[col] = typeMatch ? typeMatch.score : '';
        });
        
        // Get the most recent date from any of their assessments
        let tgl = '';
        if (studentAssessments.length > 0) {
          tgl = studentAssessments[0].assessment_date;
        }
        
        return {
          id: student.id,
          tgl,
          name: student.name,
          class: student.class,
          scores
        };
      });
      
      setRecapData(recap);
      
    } catch (err) {
      console.error('Error generating recap:', err);
      alert('Terjadi kesalahan saat memuat data rekapitulasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (recapData.length === 0) return alert('Tidak ada data rekap untuk diunduh');
    
    const dataToDownload = recapData.map((row, index) => {
      const formattedRow = {
        'No': index + 1,
        'TGL': row.tgl,
        'Nama': row.name,
        'Kelas': row.class
      };
      
      assessmentColumns.forEach(col => {
        formattedRow[col.toUpperCase()] = row.scores[col] || '';
      });
      
      return formattedRow;
    });

    const ws = XLSX.utils.json_to_sheet(dataToDownload);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi');
    XLSX.writeFile(wb, `Rekap_Nilai_Kelas_${filter.class}_${filter.semester}.xls`, { bookType: 'biff8' });
  };

  return (
    <div className="recap-page">
      <h1 className="mb-6">Rekapitulasi Nilai</h1>

      <div className="glass-card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Sekolah</label>
            <select className="glass-input glass-select" value={filter.school} onChange={e => setFilter({...filter, school: e.target.value, class: ''})}>
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Kelas</label>
            <select className="glass-input glass-select" value={filter.class} onChange={e => setFilter({...filter, class: e.target.value})}>
              <option value="">Pilih Kelas</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Semester</label>
            <select className="glass-input glass-select" value={filter.semester} onChange={e => setFilter({...filter, semester: e.target.value})}>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
             <button className="btn btn-primary w-full" onClick={generateRecap}>Generate Rekap</button>
          </div>
        </div>
      </div>

      <div className="glass-card">
        {/* Header Section */}
        <div className="mb-6 flex justify-between items-start" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
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
          </div>
          
          <button className="btn btn-outline" onClick={handleDownloadExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Export Excel (.xls)
          </button>
        </div>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="glass-table" style={{ minWidth: '1200px' }}>
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                <th style={{ width: '120px' }}>TGL</th>
                <th style={{ minWidth: '200px' }}>Nama</th>
                <th>Kelas</th>
                {assessmentColumns.map(col => (
                  <th key={col} style={{ textAlign: 'center' }}>{col.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={4 + assessmentColumns.length} className="text-center">Memuat data rekapitulasi...</td></tr>
              ) : recapData.length === 0 ? (
                 <tr><td colSpan={4 + assessmentColumns.length} className="text-center text-secondary">Klik "Generate Rekap" untuk melihat data rekapitulasi nilai.</td></tr>
              ) : (
                recapData.map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>{row.tgl || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td><span className="badge badge-neutral">{row.class}</span></td>
                    {assessmentColumns.map(col => (
                      <td key={col} style={{ textAlign: 'center' }}>{row.scores[col] || '-'}</td>
                    ))}
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

export default Recap;
