import React, { Component } from 'react';
import styles from './ManageDevicesAndAPIs.module.css';
import config from '../config';

export class ManageDevicesAndAPIs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      devices: [],
      selectedDeviceType: '',
      sensorType: '', 
      apiUrl: '',
      newAdres: {
        straatnaam: '',
        huisnummer: '',
        postcode: '',
        woonplaats: '',
        x: '',
        y: '',
        naam: '',
        tubeNumber: '', 
        tubeName: ''
      },
      loading: true,
      editDevice: null, 
      showModal: false, 
      validationErrors: {},
    };
  }

  componentDidMount() {
    this.fetchDevices();
  }

  async fetchDevices() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/devices/all`);
      if (!response.ok) throw new Error(`Fout bij ophalen apparaten: ${response.statusText}`);
      const deviceData = await response.json();
      this.setState({ devices: Array.isArray(deviceData) ? deviceData : [], loading: false });
    } catch (error) {
      console.error("Fout bij ophalen apparaten:", error);
      this.setState({ devices: [], loading: false });
    }
  }

  handleDeviceInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      newAdres: { ...prevState.newAdres, [name]: value }
    }));
  };

  handleDeviceTypeChange = (e) => {
    this.setState({
      selectedDeviceType: e.target.value,
      sensorType: ''
    });
  };

  handleSensorTypeChange = (e) => {
    this.setState({
      sensorType: e.target.value,
      apiUrl: '',
      newAdres: { ...this.state.newAdres, tubeNumber: '', tubeName: '' }
    });
  };

  handleApiInputChange = (e) => {
    this.setState({ apiUrl: e.target.value });
  };

  handleTubeNameInputChange = (e) => {
    this.setState({ newAdres: { ...this.state.newAdres, tubeName: e.target.value } });
  };

  validateFormData = (deviceData) => {
    const errors = {};
    if (deviceData.huisnummer && isNaN(parseInt(deviceData.huisnummer))) {
      errors.huisnummer = "Huisnummer moet een geldig getal zijn.";
    }
    if (deviceData.x && isNaN(parseFloat(deviceData.x))) {
      errors.x = "X moet een geldig decimaal coördinaat zijn.";
    }
    if (deviceData.y && isNaN(parseFloat(deviceData.y))) {
      errors.y = "Y moet een geldig decimaal coördinaat zijn.";
    }

    this.setState({ validationErrors: errors });
    return Object.keys(errors).length === 0;
  };

  async addDevice() {
    const { newAdres, selectedDeviceType, apiUrl, sensorType } = this.state;

    const newDevice = {
      deviceType: selectedDeviceType,
      naam: newAdres.naam || "",
      straatnaam: newAdres.straatnaam || "",
      huisnummer: newAdres.huisnummer ? String(newAdres.huisnummer) : null,
      postcode: newAdres.postcode || "",
      woonplaats: newAdres.woonplaats || "",
      x: newAdres.x ? parseFloat(newAdres.x) : null,
      y: newAdres.y ? parseFloat(newAdres.y) : null,
      apiUrl: selectedDeviceType === 'PLC' ? apiUrl : (sensorType === 'Custom' ? apiUrl : ""),
      tubeName: sensorType === 'Acaciadata' ? newAdres.tubeName : "",
      sensorType,
      waterHeight: selectedDeviceType === 'PLC' ? parseFloat(newAdres.waterHeight) || 0 : null,
    };

    if (!this.validateFormData(newAdres)) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/devices/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Fout bij toevoegen apparaat: ${error.message || error}`);
      }

      this.fetchDevices();
    } catch (error) {
      console.error("Fout bij toevoegen apparaat:", error);
    }
  }

  handleEditDevice = (device) => {
    this.setState({ editDevice: device, showModal: true });
  };

  handleEditChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      editDevice: { ...prevState.editDevice, [name]: value }
    }));
  };

  async saveEditedDevice() {
    const { editDevice } = this.state;

    if (!this.validateFormData(editDevice)) return;

    const payload = {
      ...editDevice,
      straatnaam: editDevice.straatnaam || "",
      huisnummer: editDevice.huisnummer || "",
      postcode: editDevice.postcode || "",
      woonplaats: editDevice.woonplaats || "",
      tubeName: editDevice.tubeName || "",
      sensorType: editDevice.sensorType || "",
      apiUrl: editDevice.apiUrl || "",
    };
    try {
      const response = await fetch(`${config.apiBaseUrl}/devices/${editDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Fout bij opslaan apparaat: ${error.message || 'Onbekende fout'}`);
      }

      this.setState({ showModal: false, editDevice: null });
      this.fetchDevices();
    } catch (error) {
      console.error("Fout bij opslaan apparaat:", error);
    }
  }

  async handleRemoveDevice(device) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/devices/delete/${device.id}?deviceType=${device.deviceType}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Verwijderen mislukt');

      this.fetchDevices();
    } catch (error) {
      console.error('Fout bij verwijderen apparaat:', error);
    }
  }

  renderDeviceForm() {
    const { validationErrors, sensorType, selectedDeviceType, newAdres, apiUrl } = this.state;

    return (
      <div>
        <h3>Apparaat Toevoegen</h3>
        <div className={styles.deviceAddressRow}>
          <select
            className={styles.inputHalf}
            value={selectedDeviceType}
            onChange={this.handleDeviceTypeChange}
          >
            <option value="">Selecteer apparaat type</option>
            <option value="WaterSensor">Water Sensor</option>
            <option value="Pomp">Pomp</option>
            <option value="Waterklep">Waterklep</option>
            <option value="WaterBasin">Water Basin</option>
            <option value="Weerstation">Weerstation</option>
            <option value="PLC">PLC</option> 
          </select>
        </div>

        {selectedDeviceType === 'WaterSensor' && (
          <div className={styles.deviceAddressRow}>
            <select
              className={styles.inputHalf}
              value={sensorType}
              onChange={this.handleSensorTypeChange}
            >
              <option value="">Selecteer sensor type</option>
              <option value="Acaciadata">Acaciadata</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        )}

        {sensorType === 'Custom' && (
          <div className={styles.deviceAddressRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="API URL"
              value={apiUrl}
              onChange={this.handleApiInputChange}
            />
          </div>
        )}

        {sensorType === 'Acaciadata' && (
          <div className={styles.deviceAddressRow}>
            <input
              className={styles.inputHalf}
              type="text"
              name="tubeName"
              placeholder="Waterpeilmeter Naam"
              onChange={this.handleTubeNameInputChange}
            />
          </div>
        )}
        {selectedDeviceType === 'PLC' && (
          <>
            <div className={styles.deviceAddressRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="API URL"
                value={apiUrl}
                onChange={this.handleApiInputChange}
              />
            </div>
            <div className={styles.deviceAddressRow}>
              <input
                className={styles.inputHalf}
                type="number"
                name="waterHeight"
                placeholder="Water Height"
                value={newAdres.waterHeight || ''}
                onChange={(e) => this.setState({ newAdres: { ...newAdres, waterHeight: e.target.value } })}
              />
            </div>
          </>
        )}

        <div className={styles.deviceAddressRow}>
          <input
            className={styles.inputHalf}
            type="text"
            name="naam"
            placeholder="Naam"
            onChange={this.handleDeviceInputChange}
          />
        </div>

        <h4>Apparaatadres</h4>
        <div className={styles.deviceAddressRow}>
          <input
            className={styles.inputHalf}
            type="text"
            name="straatnaam"
            placeholder="Straatnaam"
            onChange={this.handleDeviceInputChange}
          />
          <input
            className={styles.inputHalf}
            type="text"
            name="huisnummer"
            placeholder="Huisnummer"
            onChange={this.handleDeviceInputChange}
          />
          {validationErrors.huisnummer && <p className={styles.error}>{validationErrors.huisnummer}</p>}
        </div>
        <div className={styles.deviceAddressRow}>
          <input
            className={styles.inputHalf}
            type="text"
            name="woonplaats"
            placeholder="Woonplaats"
            onChange={this.handleDeviceInputChange}
          />
          <input
            className={styles.inputHalf}
            type="text"
            name="postcode"
            placeholder="Postcode"
            onChange={this.handleDeviceInputChange}
          />
        </div>
        <div className={styles.deviceAddressRow}>
          <input
            className={styles.inputHalf}
            type="text"
            name="x"
            placeholder="X Coördinaat"
            onChange={this.handleDeviceInputChange}
          />
          {validationErrors.x && <p className={styles.error}>{validationErrors.x}</p>}
          <input
            className={styles.inputHalf}
            type="text"
            name="y"
            placeholder="Y Coördinaat"
            onChange={this.handleDeviceInputChange}
          />
          {validationErrors.y && <p className={styles.error}>{validationErrors.y}</p>}
        </div>

        <button className={styles.button} onClick={() => this.addDevice()}>Apparaat Toevoegen</button>
      </div>
    );
  }

  renderEditModal() {
    const { editDevice, validationErrors } = this.state;
    if (!editDevice) return null;

    return (
      <>
        <div className={styles.modalOverlay} onClick={() => this.setState({ showModal: false })}></div>
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Bewerk Apparaat</h3>

            <div className={styles.deviceAddressRow}>
              <input
                className={styles.inputHalf}
                type="text"
                name="naam"
                placeholder="Naam"
                value={editDevice.naam || ''}
                onChange={this.handleEditChange}
              />
            </div>

            <div className={styles.deviceAddressRow}>
              <input
                className={styles.inputHalf}
                type="text"
                name="straatnaam"
                placeholder="Straatnaam"
                value={editDevice.straatnaam || ''}
                onChange={this.handleEditChange}
              />
              <input
                className={styles.inputHalf}
                type="text"
                name="huisnummer"
                placeholder="Huisnummer"
                value={editDevice.huisnummer || ''}
                onChange={this.handleEditChange}
              />
              {validationErrors.huisnummer && <p className={styles.error}>{validationErrors.huisnummer}</p>}
            </div>

            <div className={styles.deviceAddressRow}>
              <input
                className={styles.inputHalf}
                type="text"
                name="woonplaats"
                placeholder="Woonplaats"
                value={editDevice.woonplaats || ''}
                onChange={this.handleEditChange}
              />
              <input
                className={styles.inputHalf}
                type="text"
                name="postcode"
                placeholder="Postcode"
                value={editDevice.postcode || ''}
                onChange={this.handleEditChange}
              />
            </div>

            <div className={styles.deviceAddressRow}>
              <input
                className={styles.inputHalf}
                type="text"
                name="x"
                placeholder="X Coördinaat"
                value={editDevice.x || ''}
                onChange={this.handleEditChange}
              />
              {validationErrors.x && <p className={styles.error}>{validationErrors.x}</p>}
              <input
                className={styles.inputHalf}
                type="text"
                name="y"
                placeholder="Y Coördinaat"
                value={editDevice.y || ''}
                onChange={this.handleEditChange}
              />
              {validationErrors.y && <p className={styles.error}>{validationErrors.y}</p>}
            </div>

            <button className={styles.button} onClick={() => this.saveEditedDevice()}>Wijzigingen Opslaan</button>
            <button className={styles.button} onClick={() => this.setState({ showModal: false, editDevice: null })}>Annuleer</button>
          </div>
        </div>
      </>
    );
  }

  renderDeviceList() {
    return (
      <div>
        <h2 class="bestaandeApparatenHeading">Bestaande Apparaten</h2>
        <ul className={styles.deviceList}>
          {this.state.devices.map((device, index) => (
            <li key={`${device.deviceType}-${device.id || index}`} className={styles.deviceItem}>
              {device.naam}({device.deviceType}) - {device.straatnaam}, {device.huisnummer}, {device.postcode}, {device.woonplaats}, ({device.x}, {device.y})
              <div className={styles.deviceActions}>
                <button className={styles.button} onClick={() => this.handleEditDevice(device)}>Bewerk</button>
                <button className={styles.buttonRemove} onClick={() => this.handleRemoveDevice(device)}>Verwijder</button>
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
        <h1>Beheer Apparaten</h1>
        {this.renderDeviceForm()}
        <br/>
        {this.state.loading ? <p>Apparaten Laden...</p> : this.renderDeviceList()}
        {this.state.showModal && this.renderEditModal()}
      </div>
    );
  }
}

export default ManageDevicesAndAPIs;
