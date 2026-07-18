import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Trash2, Search, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', class: '', nisn: '', teacher_name: '', education_level: '', school_name: '' 
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('class', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback data for preview if Supabase is not connected
      if (students.length === 0) {
         setStudents([
           { id: '1', name: 'Budi Santoso', class: '10A', nisn: '0012345678' },
           { id: '2', name: 'Siti Aminah', class: '10A', nisn: '0012345679' }
         ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const parsedData = results.data.filter(row => row.Nama || row.name || row.Name);
          const formattedData = parsedData.map(row => ({
            name: row.Nama || row.name || row.Name || '',
            class: row.Kelas || row.class || row.Class || '',
            nisn: row.NISN || row.nisn || '',
            teacher_name: row['Nama Guru'] || row.teacher_name || '',
            education_level: row.Jenjang || row.education_level || '',
            school_name: row['Nama Sekolah'] || row.school_name || ''
          }));
          
          if (formattedData.length > 0) {
            try {
              const { error } = await supabase.from('students').insert(formattedData);
              if (error) throw error;
              alert('Data berhasil diimpor!');
              fetchStudents();
            } catch (err) {
              console.error('Error importing:', err);
              alert('Gagal impor, pastikan tabel Supabase siap.');
            }
          }
        },
        error: (err) => alert(`Error parsing file: ${err.message}`)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('students').update(formData).eq('id', editingId);
        if (error) throw error;
        alert('Data berhasil diperbarui!');
      } else {
        const { error } = await supabase.from('students').insert([formData]);
        if (error) throw error;
      }
      setFormData({ name: '', class: '', nisn: '', teacher_name: '', education_level: '', school_name: '' });
      setEditingId(null);
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Gagal menyimpan data siswa, pastikan tabel Supabase siap.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        fetchStudents();
      } catch (err) {
        console.error('Error deleting student:', err);
      }
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nama,Kelas,NISN,Nama Guru,Jenjang,Nama Sekolah\nBudi Santoso,10A,0012345678,Pak Budi,SMA,SMAN 1\nSiti Aminah,10A,0012345679,Pak Budi,SMA,SMAN 1";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_murid.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name || '',
      class: student.class || '',
      nisn: student.nisn || '',
      teacher_name: student.teacher_name || '',
      education_level: student.education_level || '',
      school_name: student.school_name || ''
    });
    setEditingId(student.id);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => {
    setFormData({ name: '', class: '', nisn: '', teacher_name: '', education_level: '', school_name: '' });
    setEditingId(null);
    setShowForm(!showForm);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.nisn?.includes(searchTerm);
    const matchesClass = filterClass ? s.class === filterClass : true;
    const matchesSchool = filterSchool ? s.school_name === filterSchool : true;
    const matchesLevel = filterLevel ? s.education_level === filterLevel : true;
    
    return matchesSearch && matchesClass && matchesSchool && matchesLevel;
  });

  const uniqueClasses = [...new Set(students.map(s => s.class).filter(Boolean))].sort();
  const uniqueSchools = [...new Set(students.map(s => s.school_name).filter(Boolean))].sort();
  const uniqueLevels = [...new Set(students.map(s => s.education_level).filter(Boolean))].sort();

  return (
    <div className="students-page">
      <div className="flex justify-between items-center mb-6">
        <h1>Data Murid</h1>
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={handleDownloadTemplate} title="Unduh Template CSV">
            Template
          </button>
          <label className="btn btn-outline">
            <Upload size={18} /> Import CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={18} /> Tambah Murid
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card mb-6 animate-fade-in">
          <h3 className="mb-4">{editingId ? 'Edit Data Murid' : 'Form Tambah Murid'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Nama Lengkap</label>
              <input required type="text" className="glass-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Masukkan nama..." />
            </div>
            <div className="input-group">
              <label>Kelas</label>
              <input required type="text" className="glass-input" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} placeholder="Contoh: 10A" />
            </div>
            <div className="input-group">
              <label>NISN</label>
              <input type="text" className="glass-input" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} placeholder="Nomor Induk Siswa..." />
            </div>
            <div className="input-group">
              <label>Nama Guru</label>
              <input type="text" className="glass-input" value={formData.teacher_name} onChange={e => setFormData({...formData, teacher_name: e.target.value})} placeholder="Nama Wali Kelas/Guru..." />
            </div>
            <div className="input-group">
              <label>Jenjang</label>
              <input type="text" className="glass-input" value={formData.education_level} onChange={e => setFormData({...formData, education_level: e.target.value})} placeholder="Contoh: SMA/SMK/SMP" />
            </div>
            <div className="input-group">
              <label>Nama Sekolah</label>
              <input type="text" className="glass-input" value={formData.school_name} onChange={e => setFormData({...formData, school_name: e.target.value})} placeholder="Contoh: SMAN 1 Jakarta" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem', gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary w-full">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <h3>Daftar Murid</h3>
          <div className="flex gap-2 flex-wrap">
            <select className="glass-input glass-select" style={{ padding: '0.5rem', width: 'auto' }} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">Semua Kelas</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="glass-input glass-select" style={{ padding: '0.5rem', width: 'auto' }} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Semua Jenjang</option>
              {uniqueLevels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="glass-input glass-select" style={{ padding: '0.5rem', width: 'auto' }} value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="relative">
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Cari murid..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '200px' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Nama Murid</th>
                <th>Kelas</th>
                <th>Guru</th>
                <th>Sekolah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && students.length === 0 ? (
                <tr><td colSpan="5" className="text-center">Memuat data...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-secondary">Data murid tidak ditemukan.</td></tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.nisn || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td><span className="badge badge-info">{student.class}</span></td>
                    <td>{student.teacher_name || '-'}</td>
                    <td>{student.school_name || '-'}</td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => handleEdit(student)} title="Edit Data" style={{ color: 'var(--primary)' }}>
                        <Edit2 size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(student.id)} title="Hapus" style={{ color: '#ef4444' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
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

export default Students;
