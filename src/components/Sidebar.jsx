import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, FileEdit, FileBarChart, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Data Murid', icon: <Users size={20} />, path: '/students' },
    { name: 'Absensi', icon: <UserCheck size={20} />, path: '/attendance' },
    { name: 'Penilaian', icon: <FileEdit size={20} />, path: '/assessments' },
    { name: 'Laporan', icon: <FileBarChart size={20} />, path: '/reports' },
    { name: 'Rekapitulasi', icon: <FileBarChart size={20} />, path: '/recap' },
  ];

  return (
    <aside className="glass-panel sidebar">
      <div className="sidebar-header">
        <h2 className="text-gradient">SIPENA</h2>
        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Sistem Penilaian & Absensi</p>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
        <button 
          onClick={() => {
            localStorage.removeItem('isLoggedIn');
            window.location.reload();
          }}
          className="sidebar-link"
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#ef4444', marginTop: '1rem', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
