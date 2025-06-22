const { sendFarmRequest } = require('./farmRequest');
const CONFIG = require('./config.json');
const { randomDelay } = require('./utils');

function handleMegaFieldTour(page, rid) {
  const setString = CONFIG.megaFieldTour.setSegments.join('|');
  CONFIG.farms.forEach(async farm => {
    console.log(`🚜 Sadzenie Mega-field dla farmy ${farm}`);
    await sendFarmRequest(page, rid, 'megafield_tour', farm, CONFIG.megaFieldTour.position, { set: setString, vid: CONFIG.megaFieldTour.vid });
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  });
}

function handleMegaFieldHarvest(page, rid) {
  const setString = CONFIG.megaFieldTour.setSegments.join('|');
  CONFIG.farms.forEach(async farm => {
    console.log(`🌾 Zbiór Mega-field dla farmy ${farm}`);
    await sendFarmRequest(page, rid, 'megafield_harvest', farm, CONFIG.megaFieldTour.position, { set: setString, vid: CONFIG.megaFieldTour.vid });
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  });
}

function handleMegaFieldAutoplant(page, rid) {
  CONFIG.farms.forEach(async farm => {
    console.log(`🌱 Autoplant Mega-field dla farmy ${farm}`);
    await sendFarmRequest(page, rid, 'megafield_autoplant', farm, CONFIG.megaFieldTour.position, { id: '1', pid: '1' });
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  });
}

module.exports = { handleMegaFieldTour, handleMegaFieldHarvest, handleMegaFieldAutoplant };