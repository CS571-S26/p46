import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Navbar, Nav, Container, Button, Spinner, Alert } from 'react-bootstrap'
import '../App.css'
import WelcomeModal from './WelcomeModal.jsx'
import { loadAllData } from '../services/nflApi.js'

const SEEN_KEY = 'welcomeSeen'

export default function Layout() {
  const [showModal, setShowModal] = useState(() => {
    return !sessionStorage.getItem(SEEN_KEY)
  })
  const [dataStatus, setDataStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    loadAllData()
      .then(() => setDataStatus('ready'))
      .catch(() => setDataStatus('error'))
  }, [])

  function handleClose() {
    sessionStorage.setItem(SEEN_KEY, '1')
    setShowModal(false)
  }

  return (
    <div>
      <Navbar bg="success" variant="dark" expand="sm" className="px-3 shadow-sm">
        <Navbar.Brand className="fw-bold text-white">
          🏈 Draft Analyzer
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>Format Roster</Nav.Link>
            <Nav.Link as={NavLink} to="/build">Build Team</Nav.Link>
            <Nav.Link as={NavLink} to="/analyze">Analyze</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {dataStatus === 'loading' && (
              <Spinner animation="border" variant="light" size="sm" title="Loading player data…" />
            )}
            {dataStatus === 'error' && (
              <span className="text-warning fw-semibold" style={{ fontSize: '0.8rem' }}>⚠ Data unavailable</span>
            )}
            <Button
              variant="outline-light"
              size="sm"
              className="rounded-circle"
              style={{ width: '2rem', height: '2rem', padding: 0, fontWeight: 'bold' }}
              aria-label="Help"
              onClick={() => setShowModal(true)}
            >?</Button>
          </div>
        </Navbar.Collapse>
      </Navbar>

      {dataStatus === 'error' && (
        <Container className="mt-3">
          <Alert variant="danger">
            Could not load NFL player data. Check your connection and refresh the page.
          </Alert>
        </Container>
      )}

      <main>
        <Outlet />
      </main>

      <WelcomeModal show={showModal} onClose={handleClose} />
    </div>
  )
}
