import React, { Component } from 'react';
import { Collapse, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import './NavMenu.css';
import Logo from './watermanagement.png';

class NavMenu extends Component {
  constructor(props) {
    super(props);
    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.state = {
      collapsed: true,
    };
  }

  toggleNavbar() {
    this.setState({ collapsed: !this.state.collapsed });
  }

  handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  }

  render() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const location = this.props.location;

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
      <header>
        <Navbar className="navbar navbar-expand-lg modern-navbar bg-white shadow-sm" container>
          <NavbarBrand tag={Link} to="/">
            <img src={Logo} alt="Gemeente Gouda Logo" className="home-logo" />
          </NavbarBrand>
          <NavbarToggler onClick={this.toggleNavbar} />
          <Collapse className={`navbar-collapse ${!this.state.collapsed ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto">
              <NavItem>
                <NavLink
                  tag={Link}
                  className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
                  to="/home"
                >
                  Home
                </NavLink>
              </NavItem>
              {token && role === 'Admin' && (
                <>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      className={`nav-link ${location.pathname === '/apparaatbeheer' ? 'active' : ''}`}
                      to="/apparaatbeheer"
                    >
                      ApparaatBeheer
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      className={`nav-link ${location.pathname === '/apparaatbediening' ? 'active' : ''}`}
                      to="/apparaatbediening"
                    >
                      Apparaatbediening
                    </NavLink>
                  </NavItem>
                </>
              )}
              {!token ? (
                <>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                      to="/login"
                    >
                      Login
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      tag={Link}
                      className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                      to="/register"
                    >
                      Registreer
                    </NavLink>
                  </NavItem>
                </>
              ) : (
                <NavItem>
                  <button onClick={this.handleLogout} className="nav-link btn-logout">
                    Log uit
                  </button>
                </NavItem>
              )}
            </ul>
          </Collapse>
        </Navbar>
      </header>
    );
  }
}

export default function NavMenuWithLocation() {
  const location = useLocation();
  return <NavMenu location={location} />;
}
