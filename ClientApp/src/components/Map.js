import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import DeviceMap from "./DeviceMap"; 
import DeviceLegenda from "./DeviceLegenda";
import L from "leaflet";
const DeviceMapContainer = ({ devices }) => {
  const devicesWithCoordinates = devices.filter(
    (device) => Number(device.x) && Number(device.y)
  );

  const weatherStationIcon = L.icon({
    iconUrl: "/weatherstation.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const plcIcon = L.icon({
    iconUrl: "/plc.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const waterSensorIcon = L.icon({
    iconUrl: "/watersensor.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const pumpIcon = L.icon({
    iconUrl: "/pump.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const waterKlepIcon = L.icon({
    iconUrl: "/waterklep.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const waterBasinIcon = L.icon({
    iconUrl: "/waterbasin.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <Row className="mt-5">
      <Col md={8} className="mb-4">
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title className="text-center">Kaart van Apparaten</Card.Title>
            <div className="device-map-container">
              <DeviceMap
                devices={devicesWithCoordinates}
                weatherStationIcon={weatherStationIcon}
                plcIcon={plcIcon}
                waterSensorIcon={waterSensorIcon}
                pumpIcon={pumpIcon}
                waterKlepIcon={waterKlepIcon}
                waterBasinIcon={waterBasinIcon}
              />
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <DeviceLegenda />
      </Col>
    </Row>
  );
};

export default DeviceMapContainer;
