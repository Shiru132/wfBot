// unifiedCycle.js
const CONFIG = require('./config.json');
const { sendFarmRequest } = require('./farmRequest');
const detectType          = require('./detection');
const { randomDelay }     = require('./utils');
const {
  handleMegaFieldTour,
  handleMegaFieldHarvest,
  handleMegaFieldAutoplant
} = require('./megaFieldHandlers');

module.exports = async function unifiedCycle(page, rid) {
  // 1) Standardowe pola, zwierzęta, fabryki
  for (const farm of CONFIG.farms) {
    for (let pos = 1; pos <= CONFIG.positionsPerFarm; pos++) {
     
      const { type } = await detectType(page, rid, farm, pos);

      switch (type) {
        case 'garden':
          console.log(`💧 [F${farm},P${pos}] watergarden`);
          await sendFarmRequest(page, rid, 'watergarden', farm, pos);
          break;
        case 'stable':
          console.log(`🐄 [F${farm},P${pos}] inner_crop`);
          await sendFarmRequest(page, rid, CONFIG.animal.collectMode, farm, pos, CONFIG.animal.feedParams);
          break;
        case 'factory':
          console.log(`🏭 [F${farm},P${pos}] harvestproduction`);
         
          await sendFarmRequest(page, rid, CONFIG.factory.collectMode, farm, pos, CONFIG.factory.collectParams);
          break;
        default:
      
          break;
      }

      
      await randomDelay(
        CONFIG.delays.farmPauseMin,
        CONFIG.delays.farmPauseMax
      );
    }
  }

  // 2) Mega‐Field: tour, harvest, autoplant
  await handleMegaFieldTour(page, rid);
  await handleMegaFieldHarvest(page, rid);
  await handleMegaFieldAutoplant(page, rid);

  return rid;
};
        
