import React, { Component } from 'react';
import { Container, Row, Col, Form, Card, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import config from '../config';
import './TubeService.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  ChartLegend,
  Filler,
  zoomPlugin
);

class TubeService extends Component {
  state = {
    waterLevelData: [],
    rainfallData: [],
    tubes: [],
    selectedTube: '',
    currentWaterLevel: null,
    lastMeasurementDate: null,
    loadingData: false,
  };

  componentDidMount() {
    this.fetchTubes();
  }

  async fetchTubes() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/waterpeil/getTubes`);
      if (!response.ok) throw new Error('Fout bij het ophalen van tubes');
      const tubes = await response.json();
      this.setState({ tubes });
    } catch (error) {
      console.error('Fout bij het ophalen van tubes:', error);
    }
  }

  handleTubeSelect = async (event) => {
    const selectedTube = event.target.value;
    this.setState({ selectedTube, loadingData: true });

    if (selectedTube) {
      try {
        const startDate = this.calculateStartDate();
        const endDate = this.getCurrentDate();

        const waterResponse = await fetch(
          `${config.apiBaseUrl}/waterpeil/getWaterpeilByTube/${selectedTube}?startDate=${startDate}&endDate=${endDate}`
        );
        if (!waterResponse.ok) throw new Error('Fout bij het ophalen van waterdata');
        const waterData = await waterResponse.json();

        const formattedWaterData = waterData.map((item) => ({
          date: item.datum,
          level: item.waterpeil,
        }));

        const weatherResponse = await fetch(`${config.apiBaseUrl}/Weather/getWeatherHistory`);
        if (!weatherResponse.ok) throw new Error('Fout bij het ophalen van regenvaldata');
        const rainfallData = await weatherResponse.json();

        const formattedRainfallData = rainfallData.map((item) => ({
          date: item.datum,
          amount: item.totaalRegen,
        }));

        const lastIndex = formattedWaterData.length - 1;
        const lastMeasurementDate = formattedWaterData[lastIndex]?.date || null;
        const currentWaterLevel = formattedWaterData[lastIndex]?.level || null;

        this.setState({
          waterLevelData: formattedWaterData,
          rainfallData: formattedRainfallData,
          currentWaterLevel,
          lastMeasurementDate,
          loadingData: false,
        });

        if (this.props.onWaterLevelChange) {
          this.props.onWaterLevelChange({ currentWaterLevel, lastMeasurementDate });
        }
      } catch (error) {
        console.error('Fout bij het ophalen van gegevens:', error);
        this.setState({ loadingData: false });
      }
    } else {
      this.setState({
        waterLevelData: [],
        rainfallData: [],
        currentWaterLevel: null,
        lastMeasurementDate: null,
        loadingData: false,
      });

      if (this.props.onWaterLevelChange) {
        this.props.onWaterLevelChange({ currentWaterLevel: null, lastMeasurementDate: null });
      }
    }
  };

  calculateStartDate() {
    const today = new Date();
    const threeMonthsAgo = new Date(today.setMonth(today.getMonth() - 3));
    return threeMonthsAgo.toISOString().split('T')[0];
  }

  getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  render() {
    const { waterLevelData, rainfallData, tubes, selectedTube, loadingData } = this.state;

    const chartData = {
      labels: waterLevelData.map((data) => data.date),
      datasets: [
        {
          label: 'Waterpeil (m)',
          data: waterLevelData.map((data) => data.level),
          borderColor: 'red',
          fill: false,
          tension: 0.4,
          yAxisID: 'y-axis-water',
        },
        {
          label: 'Regenval (mm)',
          data: rainfallData.map((data) => data.amount),
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y-axis-rainfall',
        },
      ],
    };

    const chartOptions = {
      scales: {
        'y-axis-water': {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Waterpeil (m)',
          },
        },
        'y-axis-rainfall': {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Regenval (mm)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          title: {
            display: true,
            text: 'Datum',
          },
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: 'x',
          },
        },
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    return (
      <Container>
        <Row>
          <Col md={4}>
            <Form.Group controlId="selectTube">
              <Form.Label>Selecteer een waterpeilmeter</Form.Label>
              <Form.Control as="select" value={selectedTube} onChange={this.handleTubeSelect}>
                <option value="">-- Selecteer een waterpeilmeter --</option>
                {tubes.map((tube) => (
                  <option key={tube.tubeNumber} value={tube.tubeNumber}>
                    {tube.tubeName} ({tube.tubeNumber})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Card className="shadow-sm large-chart-card">
              <Card.Body>
                <Card.Title className="text-center">Waterpeil en Regenval Overzicht</Card.Title>
                {loadingData ? (
                  <div className="spinner">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : waterLevelData.length > 0 || rainfallData.length > 0 ? (
                  <div className="chart-container">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <p className="text-center mt-4">Selecteer een waterpeilmeter om de gegevens weer te geven.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default TubeService;
