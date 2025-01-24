import React, { Component } from 'react';
import styles from './ManageDevicesAndAPIs.module.css';
import config from '../config';

export class ToggleDevices extends Component {
  state = {
    devices: [],
    loading: true,
    waterHeight: {},
    waterHeightBasin: {},
  };

  componentDidMount() {
    this.fetchDevices();
  }

  async fetchDevices() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/devices/all`);
      if (!response.ok) throw new Error(`Fout bij ophalen apparaten: ${response.statusText}`);
      const devices = await response.json();
      this.setState({ devices, loading: false });
    } catch {
      this.setState({ devices: [], loading: false });
    }
  }

  async toggleDevice(deviceId, action) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/toggledevice/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DeviceId: deviceId, Action: action }),
      });
      if (!response.ok) throw new Error('Fout bij schakelen apparaat');
      alert(`Apparaat ${deviceId} is ${action === 'on' ? 'aangezet' : 'uitgezet'}`);
    } catch {
      alert('Fout bij schakelen apparaat');
    }
  }

  async setWaterHeight(deviceId) {
    const waterHeight = parseFloat(this.state.waterHeight[deviceId]);
    if (isNaN(waterHeight)) {
      alert('Vul een geldige waterhoogte in');
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/toggledevice/setWaterHeight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DeviceId: deviceId, WaterHeight: waterHeight }),
      });
      if (!response.ok) throw new Error('Fout bij instellen waterhoogte');
      alert(`Waterhoogte ingesteld voor apparaat ${deviceId}`);
    } catch {
      alert('Fout bij instellen waterhoogte');
    }
  }

  async setWaterHeightBasin(deviceId) {
    const value = parseFloat(this.state.waterHeightBasin[deviceId]);
    if (isNaN(value)) {
      alert('Vul een geldige waterhoogte voor het bassin in');
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/toggledevice/setWaterHeightBasin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DeviceId: deviceId, WaterHeightBasin: value }),
      });
      if (!response.ok) throw new Error('Fout bij instellen waterhoogte bassin');
      alert(`Waterhoogte bassin ingesteld voor apparaat ${deviceId}`);
    } catch {
      alert('Fout bij instellen waterhoogte bassin');
    }
  }
  async setToestemmingBoezem(deviceId, isActive) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/toggledevice/toestemmingBoezem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DeviceId: deviceId, ToestemmingBoezem: isActive }),
      });
      if (!response.ok) throw new Error('Fout bij instellen toestemming boezem');
      alert(`Toestemming boezem is nu ${isActive ? 'geactiveerd' : 'gedeactiveerd'} voor apparaat ${deviceId}`);
    } catch {
      alert('Fout bij instellen toestemming boezem');
    }
  }

  async setNoodStop(deviceId, isActive) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/toggledevice/noodStop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DeviceId: deviceId, NoodStop: isActive }),
      });
      if (!response.ok) throw new Error('Fout bij instellen noodstop');
      alert(`Noodstop is nu ${isActive ? 'geactiveerd' : 'gedeactiveerd'} voor apparaat ${deviceId}`);
    } catch {
      alert('Fout bij instellen noodstop');
    }
  }

  handleWaterHeightChange = (deviceId, value) => {
    this.setState((prevState) => ({
      waterHeight: {
        ...prevState.waterHeight,
        [deviceId]: value,
      },
    }));
  };

  handleWaterHeightBasinChange = (deviceId, value) => {
    this.setState((prevState) => ({
      waterHeightBasin: {
        ...prevState.waterHeightBasin,
        [deviceId]: value,
      },
    }));
  };

  renderDeviceList() {
    return (
      <div>
        <ul className={styles.deviceList}>
          {this.state.devices.map((device) => (
            <li key={device.id} className={styles.deviceItem}>
              <p>
                <strong>{device.naam}</strong> ({device.deviceType})
              </p>

              <div className={styles.deviceActions}>
                {device.deviceType === 'Pomp' && (
                  <>
                    <button
                      className={styles.button}
                      onClick={() => this.toggleDevice(device.id, 'on')}
                    >
                      Pomp Aanzetten
                    </button>
                    <button
                      className={styles.buttonRemove}
                      onClick={() => this.toggleDevice(device.id, 'off')}
                    >
                      Pomp Uitzetten
                    </button>
                  </>
                )}
                {device.deviceType === 'Waterklep' && (
                  <>
                    <button
                      className={styles.button}
                      onClick={() => this.toggleDevice(device.id, 'on')}
                    >
                      Klep Openen
                    </button>
                    <button
                      className={styles.buttonRemove}
                      onClick={() => this.toggleDevice(device.id, 'off')}
                    >
                      Klep Sluiten
                    </button>
                  </>
                )}
                {device.deviceType === 'WaterBasin' && (
                  <div className={styles.plcDetails}>
                    <p>
                      Huidige Waterstand: <strong>{device.latestWaterHeight ?? 'N/A'}</strong>
                    </p>
                    <div className={styles.actionRow}>
                      <input
                        type="number"
                        placeholder="Stel waterhoogte in"
                        value={this.state.waterHeight[device.id] || ''}
                        onChange={(e) =>
                          this.handleWaterHeightChange(device.id, e.target.value)
                        }
                        className={styles.waterHeightInput}
                      />
                      <button
                        className={styles.button}
                        onClick={() => this.setWaterHeight(device.id)}
                      >
                        Instellen
                      </button>
                    </div>
                  </div>
                )}
                {device.deviceType === 'PLC' && (
                  <div className={styles.plcDetails}>
                    <p>Waterhoogte (laatste meting): <strong>{device.latestWaterHeight ?? 'N/A'} m</strong></p>
                    
                    <div className={styles.actionRow}>
                      <input
                        type="number"
                        placeholder="Gewenste waterhoogte"
                        value={this.state.waterHeight[device.id] || ''}
                        onChange={(e) =>
                          this.handleWaterHeightChange(device.id, e.target.value)
                        }
                        className={styles.waterHeightInput}
                      />
                      <button
                        className={styles.button}
                        onClick={() => this.setWaterHeight(device.id)}
                      >
                        Instellen waterpeil
                      </button>
                    </div>

                    <div className={styles.actionRow}>
                      <input
                        type="number"
                        placeholder="Waterhoogte basin"
                        value={this.state.waterHeightBasin[device.id] || ''}
                        onChange={(e) =>
                          this.handleWaterHeightBasinChange(device.id, e.target.value)
                        }
                        className={styles.waterHeightInput}
                      />
                      <button
                        className={styles.button}
                        onClick={() => this.setWaterHeightBasin(device.id)}
                      >
                        Instellen basin
                      </button>
                    </div>
                    <div className={styles.deviceActions}>
                      <button
                        className={styles.button}
                        onClick={() => this.setToestemmingBoezem(device.id, true)}
                      >
                        Toestemming Boezem Activeren
                      </button>
                      <button
                        className={styles.buttonRemove}
                        onClick={() => this.setToestemmingBoezem(device.id, false)}
                      >
                        Toestemming Boezem Deactiveren
                      </button>
                    </div>
                    <div className={styles.deviceActions}>
                      <button
                        className={styles.button}
                        onClick={() => this.setNoodStop(device.id, true)}
                      >
                        NoodStop Activeren
                      </button>
                      <button
                        className={styles.buttonRemove}
                        onClick={() => this.setNoodStop(device.id, false)}
                      >
                        NoodStop Deactiveren
                      </button>
                    </div>
                  </div>
                )}
                {device.deviceType === 'Weerstation' && (
                  <p>
                    Geen bediening nodig voor Weerstation
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        <h1>Apparaatbediening</h1>
        {this.state.loading ? (
          <p>Apparaten worden geladen...</p>
        ) : (
          this.renderDeviceList()
        )}
      </div>
    );
  }
}

export default ToggleDevices;
