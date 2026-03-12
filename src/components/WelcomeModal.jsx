import { Modal, Button } from 'react-bootstrap'

export default function WelcomeModal({ show, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>Welcome to Draft Analyzer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <strong>Draft Analyzer</strong> helps you evaluate your 2025 fantasy football
          roster by comparing each player's <em>projected</em> stats against their
          <em> actual</em> season performance.
        </p>
        <p className="mb-1">Here's how it works:</p>
        <ol>
          <li><strong>Format Your Roster</strong> — choose how many QBs, RBs, WRs, TEs, and FLEX spots you want.</li>
          <li><strong>Search &amp; Draft Players</strong> — find and assign NFL players to each slot.</li>
          <li><strong>See Your Grade</strong> — get a color-coded team score showing how much your roster over- or under-performed expectations in the 2025 season.</li>
        </ol>
        <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
          All stats are sourced from the SportsDataIO Football API for the 2025 NFL season.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={onClose}>Get Started</Button>
      </Modal.Footer>
    </Modal>
  )
}
