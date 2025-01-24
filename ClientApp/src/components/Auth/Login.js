import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import './Login.css';
import Logo from './GemeenteLogo.jpg'; 
import config from '../../config';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.apiBaseUrl}/auth/login`, { username, password });
      const { token, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      navigate('/home'); 
    } catch (error) {
      setErrorMessage(error.response?.data || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Container className="login-container">
      <div className="login-header">
        <h2>Welkom bij Gemeente Gouda Watermanagement</h2>
      </div>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleLogin} className="login-form">
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
          Inloggen
        </Button>
      </Form>
    </Container>
  );
}
