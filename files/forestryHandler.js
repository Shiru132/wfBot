const { sendForestryRequest } = require('./forestryRequest');
const CONFIG = require('./config.json');
const { randomDelay } = require('./utils');

async function handleForestry(page, rid) {
  const steps = [
    { action: 'initforestry', params: {}, log: 'initforestry', delay: CONFIG.delays.initMin },
    { action: 'water',       params: {}, log: 'water',       delay: CONFIG.delays.harvestMin },
    { action: 'cropall',     params: {}, log: 'cropall',     delay: CONFIG.delays.harvestMin },
    { action: 'cropproduction', params: { position:1, slot:1 }, log: 'cropproduction slot1', delay: CONFIG.delays.harvestMin },
    { action: 'cropproduction', params: { position:1, slot:2 }, log: 'cropproduction slot2', delay: CONFIG.delays.harvestMin },
    { action: 'autoplant',     params: { productid:1 }, log: 'autoplant', delay: CONFIG.delays.plantMin },
    { action: 'startproduction', params: { position:1, productid:51, slot:1 }, log: 'startproduction slot1', delay: CONFIG.delays.plantMin },
    { action: 'startproduction', params: { position:1, productid:51, slot:2 }, log: 'startproduction slot2', delay: CONFIG.delays.plantMin }
  ];

  for (const step of steps) {
    console.log(`🌲 Forestry: ${step.log}`);
    await sendForestryRequest(page, rid, step.action, step.params);
    await randomDelay(step.delay, step.delay * 2);
  }
}

module.exports = handleForestry;