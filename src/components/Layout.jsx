import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Selamat Datang, Admin!</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="badge badge-success">Sistem Aktif</span>
          </div>
        </div>
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
