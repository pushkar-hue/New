import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>MedDiagnosis AI</h1>
        </Link>
        
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          <ul>
            <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
            <li><Link to="/symptom-checker" onClick={() => setMenuOpen(false)}>Symptom Checker</Link></li>
            <li><Link to="/chat" onClick={() => setMenuOpen(false)}>Chat with AI</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;