const { exec } = require("child_process");

class HumiAccessory {
  constructor(log, config, api) {
    this.log = log;
    this.api = api;

    this.name = config.name || "Humi";
    this.host = config.host;
    this.port = config.port || 5683;

    const Service = api.hap.Service;
    const Characteristic = api.hap.Characteristic;

    this.service = new Service.HumidifierDehumidifier(this.name);

    //
    // --- Current Humidity ---
    //
    this.service
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .onGet(async () => {
        const st = await this.getStatus();
        return st?.D03125 || 40;
      });

    //
    // --- Target Humidity ---
    //
    this.service
      .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
      .onGet(async () => {
        const st = await this.getStatus();
        return st?.D03128 || 50;
      })
      .onSet(async (value) => {
        await this.run(
          `aioairctrl --host ${this.host} --port ${this.port} --rhset ${value}`
        );
        return value;
      });

    //
    // --- Active (On/Off) ---
    //
    this.service
      .getCharacteristic(Characteristic.Active)
      .onGet(async () => {
        const st = await this.getStatus();
        return st?.D03102 === 1 ? 1 : 0;
      })
      .onSet(async (value) => {
        await this.run(
          `aioairctrl --host ${this.host} --port ${this.port} --pwr ${
            value ? 1 : 0
          }`
        );
      });

    //
    // Required characteristics for HomeKit compliance
    //
    this.service
      .setCharacteristic(Characteristic.CurrentHumidifierDehumidifierState,
        Characteristic.CurrentHumidifierDehumidifierState.INACTIVE
      );
    this.service
      .setCharacteristic(
        Characteristic.TargetHumidifierDehumidifierState,
        Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER
      );
  }

  //
  // Wrapper for executing aioairctrl
  //
  run(cmd) {
    return new Promise((resolve) => {
      exec(cmd, (err, stdout) => {
        if (err) {
          this.log("Command error:", err);
          return resolve(null);
        }
        try {
          return resolve(JSON.parse(stdout));
        } catch {
          return resolve(null);
        }
      });
    });
  }

  async getStatus() {
    const cmd = `aioairctrl --host ${this.host} --port ${this.port} status --json`;
    return await this.run(cmd);
  }

  getServices() {
    return [this.service];
  }
}

module.exports = { HumiAccessory };

