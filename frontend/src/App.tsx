import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import LecturePage from './pages/LecturePage';
import UploadPage from './pages/UploadPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses/:courseCode" element={<CoursePage />} />
          <Route path="/courses/:courseCode/upload" element={<UploadPage />} />
          <Route path="/courses/:courseCode/lectures/:lectureNumber" element={<LecturePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

