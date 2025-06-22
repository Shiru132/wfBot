const CONFIG = require('./config.json');
const { sendFarmRequest } = require('./farmRequest');
const detectType = require('./detection');

const handleForestry = require('./forestryHandler');
const { handleMegaFieldTour, handleMegaFieldHarvest, handleMegaFieldAutoplant } = require('./megaFieldHandlers');
const { handleGarden, handleStable, handleFactory } = require('./farmHandlers');

const { randomDelay } = require('./utils');
const fetchRid = require('./rid');

async function unifiedCycle(page, initialRid) {
  console.log('\n=== Start unified cycle ===');
  let rid = initialRid;

  await handleForestry(page, rid);
  handleMegaFieldTour(page, rid);
  handleMegaFieldHarvest(page, rid);
  handleMegaFieldAutoplant(page, rid);

  if (CONFIG.farms.includes(9)) {
    console.log('🛠 Specjalny wyjątek dla farmy 9');
    Array.from({ length: CONFIG.positionsPerFarm }, (_, i) => i+1).forEach(async pos => {
      await sendFarmRequest(page, rid, 'harvestproduction', 9, pos, { id:2, slot:1 });
      await randomDelay(300, 600);
      await sendFarmRequest(page, rid, 'harvestproduction', 9, pos, { id:2, slot:2 });
      await randomDelay(300, 600);
    });
    console.log('🛠 Specjalny wyjątek dla farmy 9 skończone');
  }

  CONFIG.farms.forEach(async farm => {
    console.log(`🚜 Start farmy ${farm}`);
    Array.from({ length: CONFIG.positionsPerFarm }, (_, i) => i+1).forEach(async pos => {
      const det = await detectType(page, rid, farm, pos);
      if (det.type === 'garden')  await handleGarden(page, rid, farm, pos);
      if (det.type === 'stable')  await handleStable(page, rid, farm, pos);
      if (det.type === 'factory') await handleFactory(page, rid, farm, pos);
    });
    console.log(`🔄 Koniec farmy ${farm}, odświeżam…`);
    await page.reload({ waitUntil: 'networkidle2' });
    rid = await fetchRid(page);
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  });

  console.log('=== Koniec unified cycle ===\n');
  return rid;
}

module.exports = unifiedCycle;