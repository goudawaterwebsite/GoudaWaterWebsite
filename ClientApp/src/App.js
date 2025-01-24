import React, { Component } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { Layout } from './components/Layout';
import './custom.css';

export default class App extends Component {
  static displayName = App.name;

  render() {
    return (
      <Layout>
        <Routes>
          {AppRoutes.map((route, index) => {
            const { element, path, index: isIndex } = route;

            if (path === '/' && localStorage.getItem('token')) {
              return <Route key={index} path="/" element={<Navigate to="/home" replace />} />;
            }

            return isIndex ? (
              <Route key={index} index element={element} />
            ) : (
              <Route key={index} path={path} element={element} />
            );
          })}
        </Routes>
      </Layout>
    );
  }
}
