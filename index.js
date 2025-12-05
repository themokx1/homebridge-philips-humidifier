const { HumiAccessory } = require("./src/humi");

module.exports = (api) => {
  api.registerAccessory(
    "homebridge-philips-humi",
    "PhilipsHumi",
    HumiAccessory
  );
};

