import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './deviceMap.css';
import L from 'leaflet';

const DeviceMap = ({ devices, weatherStationIcon, plcIcon, waterSensorIcon, pumpIcon, waterKlepIcon, waterBasinIcon }) => {
  const validDevices = devices.filter(device => Number(device.x) !== null && Number(device.y) !== null);

  return (
    <MapContainer center={[52.0167, 4.7083]} zoom={13} className="map-container">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {validDevices.map((device) => {
        const icon =
          device.deviceType === 'Weerstation' ? weatherStationIcon :
          device.deviceType === 'PLC' ? plcIcon :
          device.deviceType === 'WaterSensor' ? waterSensorIcon :
          device.deviceType === 'Pomp' ? pumpIcon :
          device.deviceType === 'Waterklep' ? waterKlepIcon :
          device.deviceType === 'WaterBasin' ? waterBasinIcon :
          weatherStationIcon;

        return (
          <Marker 
            key={device.id} 
            position={[ Number(device.x), Number(device.y)]} 
            icon={icon}
          >
            <Popup>
              <div>
                <h4>{device.naam || 'Onbekend apparaat'}</h4>
                <p><strong>Adres ID:</strong> {device.adresID}</p>
                <p><strong>Device Type:</strong> {device.deviceType}</p>
                <p><strong>Straatnaam:</strong> {device.straatnaam || 'N/A'}</p>
                <p><strong>Woonplaats:</strong> {device.woonplaats || 'N/A'}</p>
                <p><strong>Postcode:</strong> {device.postcode || 'N/A'}</p>
                <p><strong>Laatste Tijdstip:</strong> {device.latestTimestamp || 'N/A'}</p>
                {device.deviceType !== 'Weerstation' && device.deviceType !== 'Waterklep' && device.deviceType !== 'Pomp' && (
                  <>
                    <p><strong>Laatste Waterhoogte:</strong> {device.latestWaterHeight || 'N/A'}</p>
                    <p><strong>Waterhoogte:</strong> {device.waterHeight || 'N/A'}</p>
                    <p><strong>Waterpeilmeter Naam:</strong> {device.tubeName || 'N/A'}</p>
                    <p><strong>Waterpeilmeter Nummer:</strong> {device.tubeNumber || 'N/A'}</p>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DeviceMap;
