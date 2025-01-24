import React from 'react';
import Home from './components/Home';
import Apparaatbeheer from './components/Apparaatbeheer';
import Apparaatbediening from './components/apparaatbediening';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

const AppRoutes = [
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/apparaatbeheer',
    element: (
      <ProtectedRoute requiredRole="Admin">
        <Apparaatbeheer />
      </ProtectedRoute>
    ),
  },
  {
    path: '/apparaatbediening',
    element: (
      <ProtectedRoute requiredRole="Admin">
        <Apparaatbediening />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/login" replace /> },
];

export default AppRoutes;
