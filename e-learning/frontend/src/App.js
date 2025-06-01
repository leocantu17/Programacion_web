import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './screens/HomeScreen';
import Login from './screens/login';
import Register from './screens/Register';
import CourseDetail from './screens/CourseDetail';
import Dashboard from './screens/Dashboard';
import Navbar from './components/Nav';
import VerifyCode from './screens/VerifyCode';
import "./styles/style.css"

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify" element={<VerifyCode />} />
      </Routes>
    </Router>
  );
}

export default App;
