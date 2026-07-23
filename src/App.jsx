import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Assessments from './pages/Assessments';
import Reports from './pages/Reports';
import Recap from './pages/Recap';
import AttendanceRecap from './pages/AttendanceRecap';
import Login from './pages/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = (status) => {
    setIsLoggedIn(status);
    if (status) {
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      localStorage.removeItem('isLoggedIn');
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="recap" element={<Recap />} />
          <Route path="attendance-recap" element={<AttendanceRecap />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
