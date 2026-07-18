import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Hardcoded credentials
    const validUsers = [
      { id: 'Darwin', pass: 'Alsada123#' },
      { id: 'Soufia', pass: 'Alsada123#' }
    ];

    const isValid = validUsers.some(u => u.id === userId && u.pass === password);

    if (isValid) {
      setError('');
      onLogin(true);
    } else {
      setError('User ID atau Password salah!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at top right, #1a1b26 0%, #0f172a 100%)',
      color: '#fff'
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '3rem 2rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)'
        }}>
          <Lock size={32} color="#fff" />
        </div>

        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Selamat Datang</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Silakan login untuk mengakses SIPENA</p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem' }}>User ID</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                required
                className="glass-input" 
                placeholder="Masukkan User ID..." 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%' }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                required
                className="glass-input" 
                placeholder="Masukkan Password..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              marginTop: '1rem', 
              padding: '0.875rem', 
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            Masuk Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
