import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ChatInterface from './pages/ChatInterface';
import SymptomChecker from './pages/SymptomChecker';
import ReportViewer from './pages/ReportViewer';
import { ModelProvider } from './contexts/ModelContext';
import './App.css';

function App() {
  return (
    <ModelProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/report/:reportId" element={<ReportViewer />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ModelProvider>
  );
}

export default App;
