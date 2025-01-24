import React from 'react';
import { Card, ListGroup, Image } from 'react-bootstrap';
import './deviceLegenda.css';

const DeviceLegenda = () => (
  <Card className="shadow-sm">
    <Card.Body>
      <Card.Title>Legenda</Card.Title>
      <ListGroup variant="flush">
        {legendItems.map(({ src, alt, label }) => (
          <ListGroup.Item key={label} className="legend-item">
            <Image src={src} alt={alt} width={36} height={36} rounded className="legend-icon" />
            <span>{label}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card.Body>
  </Card>
);

const legendItems = [
  { src: '/weatherstation.png', alt: 'Weerstationpictogram', label: 'Weerstation' },
  { src: '/plc.png', alt: 'PLC-pictogram', label: 'PLC' },
  { src: '/watersensor.png', alt: 'Water Sensor-pictogram', label: 'Water Sensor' },
  { src: '/pump.png', alt: 'Pomp-pictogram', label: 'Pomp' },
  { src: '/waterklep.png', alt: 'Waterklep-pictogram', label: 'Waterklep' },
  { src: '/waterbasin.png', alt: 'Waterbasin-pictogram', label: 'Waterbasin' },
];

export default DeviceLegenda;
