import React, { Component } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import TubeService from './TubeService';
import DeviceMapContainer from './Map';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './home.css';

import config from '../config';

export class Home extends Component {
  state = {
    forecast: null,
    currentWaterLevel: null,
    lastMeasurementDate: null,
    devices: [],
    permissionData: null,
  };

  componentDidMount() {
    this.fetchWeatherForecast();
    this.fetchDevices();
    this.fetchPermission();
  }

  async fetchWeatherForecast() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/weather/getForecastForTomorrow`);
      if (!response.ok) throw new Error('Fout bij het ophalen van weersvoorspelling');
      const forecast = await response.json();
      this.setState({
        forecast: {
          description: forecast.description,
          temperature: `${forecast.minTemp}°C / ${forecast.maxTemp}°C`,
          rain: forecast.rainChance,
        },
      });
    } catch (error) {
      console.error('Fout bij het ophalen van weersvoorspelling:', error);
    }
  }

  async fetchDevices() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/devices/all`);
      if (!response.ok) throw new Error('Error fetching devices');
      const devices = await response.json();
      this.setState({ devices });
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  }

  async fetchPermission() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/RijnlandCheck/check`);
      if (!response.ok) throw new Error('Fout bij het ophalen van toestemming');
      const data = await response.json();
      this.setState({ permissionData: data });
    } catch (error) {
      console.error('Fout bij het ophalen van toestemming:', error);
      this.setState({ permissionData: { Allowed: false, Waterpeil: null, Chloride: null } });
    }
  }

  handleWaterLevelChange = ({ currentWaterLevel, lastMeasurementDate }) => {
    this.setState({ currentWaterLevel, lastMeasurementDate });
  };

  render() {
    const { forecast, currentWaterLevel, lastMeasurementDate, devices, permissionData } = this.state;

    let allowed = null;
    let waterpeilStyle = {};
    let chlorideStyle = {};

    if (permissionData !== null) {
      allowed = permissionData.Allowed;
      waterpeilStyle = { color: (permissionData.waterpeil > -0.75) ? 'green' : 'red' };
      chlorideStyle = { color: (permissionData.chloride < 250) ? 'green' : 'red' };
    }

    return (
      <Container fluid className="home-container">
        <Row>
          <Col md={12}>
            <TubeService onWaterLevelChange={this.handleWaterLevelChange} />
          </Col>
        </Row>
        <Row className="card-wrapper">
          <Col md={4} className="forecast-container mb-3">
            <Card className="shadow-sm forecast-card stylish-card">
              <Card.Body>
                <Card.Title className="text-center stylish-title">
                  Weersvoorspelling voor Morgen
                </Card.Title>
                {forecast ? (
                  <div className="text-center">
                    <p className="mb-2">
                      Verwachting: <strong>{forecast.description}</strong>
                    </p>
                    <p className="mb-1">
                      Temperatuur: <strong>{forecast.temperature}</strong>
                    </p>
                    <p>Neerslagkans: <strong>{forecast.rain}%</strong></p>
                  </div>
                ) : (
                  <div className="d-flex justify-content-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="water-level-container mb-3">
            <Card className="shadow-sm water-level-card stylish-card">
              <Card.Body>
                <Card.Title className="text-center stylish-title">
                  Huidige Waterstand
                </Card.Title>
                {currentWaterLevel !== null ? (
                  (() => {
                    const currentWaterLevelFixed = currentWaterLevel.toFixed(2);
                    return (
                      <p className="text-center">
                        De huidige waterstand is <strong>{currentWaterLevelFixed} meter</strong>.<br />
                        Laatste meting op <strong>{lastMeasurementDate}</strong>.
                      </p>
                    );
                  })()
                ) : (
                  <p className="text-center">Geen gegevens beschikbaar.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="permission-container mb-3">
          <Card className="shadow-sm permission-card stylish-card">
              <Card.Body>
                <Card.Title className="text-center stylish-title">Toestemming</Card.Title>
                {permissionData === null ? (
                  <div className="d-flex justify-content-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <>
                    <p className="text-center" style={waterpeilStyle}>
                      Waterpeil: {permissionData.waterpeil} NAP (moet &gt; -0.75 NAP)
                    </p>
                    <p className="text-center" style={chlorideStyle}>
                      Chloride: {permissionData.chloride} mg/l (moet &lt; 250mg/l)
                    </p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col md={12}>
            <DeviceMapContainer devices={devices} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Home;
