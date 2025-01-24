import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import './Login.css'; 
import Logo from './GemeenteLogo.jpg';
import config from '../../config';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${config.apiBaseUrl}/auth/register`, { username, password });
      alert('Registratie succesvol! U kunt nu inloggen.');
      navigate('/login');
    } catch (error) {
      setErrorMessage(error.response?.data || 'Registratie mislukt. Probeer het opnieuw.');
    }
  };

  return (
    <Container className="login-container">
      <div className="login-header">
        <img src={Logo} alt="Gemeente Gouda Logo" className="login-logo" />
        <h2>Registreren bij Gemeente Gouda</h2>
      </div>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleRegister} className="login-form">
        <Form.Group controlId="username" className="mb-3">
          <Form.Label>Gebruikersnaam</Form.Label>
          <Form.Control
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Vul uw gebruikersnaam in"
            required
          />
        </Form.Group>
        <Form.Group controlId="password" className="mb-3">
          <Form.Label>Wachtwoord</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Vul uw wachtwoord in"
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100 mb-2">
          Registreren
        </Button>
        <Button variant="link" className="w-100" onClick={() => navigate('/login')}>
          Terug naar Inloggen
        </Button>
      </Form>
    </Container>
  );
}
