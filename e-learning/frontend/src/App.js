import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './screens/HomeScreen';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Courses from './pages/Courses';
// import CourseDetail from './pages/CourseDetail';
// import Dashboard from './pages/Dashboard';
import Navbar from './components/Nav';
import "./styles/style.css"

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
