import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, UserCheck, FileEdit } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    totalAssessments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        { count: studentsCount },
        { count: attendanceCount },
        { count: assessmentsCount }
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today),
        supabase.from('assessments').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        totalStudents: studentsCount || 0,
        todayAttendance: attendanceCount || 0,
        totalAssessments: assessmentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Murid', value: stats.totalStudents, icon: <Users size={24} color="#3b82f6" />, bg: 'rgba(59, 130, 246, 0.15)' },
    { title: 'Absensi Hari Ini', value: stats.todayAttendance, icon: <UserCheck size={24} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.15)' },
    { title: 'Total Penilaian', value: stats.totalAssessments, icon: <FileEdit size={24} color="#8b5cf6" />, bg: 'rgba(139, 92, 246, 0.15)' },
  ];

  return (
    <div className="dashboard">
      <h1 className="mb-6">Dashboard Utama</h1>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: stat.bg, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{stat.title}</p>
              {loading ? (
                <div style={{ height: '32px', width: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              ) : (
                <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{stat.value}</h2>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <h3 className="mb-4">Informasi Sistem</h3>
        <p className="text-secondary" style={{ lineHeight: '1.6' }}>
          Selamat datang di SIPENA (Sistem Penilaian & Absensi). Aplikasi ini dibuat untuk memudahkan guru dalam melakukan pencatatan data murid, absensi harian, serta penilaian tugas, kuis, dan ujian secara terintegrasi.<br/><br/>
          <strong>Penting:</strong> Pastikan Anda telah mengonfigurasi <code>URL Supabase</code> dan <code>Anon Key</code> pada file environment variables sebelum menggunakan fitur-fitur data.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
