import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import About from './pages/About';
import Contact from './pages/Contact';
import Logo from './components/Logo';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <nav className="main-nav">
        <Logo />
        <div className="menu-bar" onClick={() => setSidebarOpen(true)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
        <div className={`sidebar${sidebarOpen ? ' open' : ''}`}> 
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>&times;</button>
          <ul className="sidebar-list">
            <li><Link to="/" onClick={() => setSidebarOpen(false)}>Home</Link></li>
            <li><Link to="/services" onClick={() => setSidebarOpen(false)}>Services</Link></li>
            <li><Link to="/portfolio" onClick={() => setSidebarOpen(false)}>Portfolio</Link></li>
            <li><Link to="/about" onClick={() => setSidebarOpen(false)}>About Us</Link></li>
            <li><Link to="/contact" onClick={() => setSidebarOpen(false)}>Contact</Link></li>
          </ul>
        </div>
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      </nav>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
