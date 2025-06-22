// megaFieldHandlers.js
const { sendFarmRequest } = require('./farmRequest');
const CONFIG = require('./config.json');
const { randomDelay } = require('./utils');

async function handleMegaFieldTour(page, rid) {
  const pos       = CONFIG.megaFieldTour.position;
  const setString = CONFIG.megaFieldTour.setSegments.join('|');

  for (const farm of CONFIG.farms) {
    console.log(`🚜 Sadzenie Mega-field dla farmy ${farm}`);
    await sendFarmRequest(
      page, rid,
      'megafield_tour',
      farm, pos,
      { set: setString, vid: CONFIG.megaFieldTour.vid }
    );
    
    await randomDelay(
      CONFIG.delays.farmPauseMin,
      CONFIG.delays.farmPauseMax
    );
  }
}

async function handleMegaFieldHarvest(page, rid) {
  const pos       = CONFIG.megaFieldTour.position;
  const setString = CONFIG.megaFieldTour.setSegments.join('|');

  for (const farm of CONFIG.farms) {
    console.log(`🌾 Zbiór Mega-field dla farmy ${farm}`);
    await sendFarmRequest(
      page, rid,
      'megafield_harvest',
      farm, pos,
      { set: setString, vid: CONFIG.megaFieldTour.vid }
    );
    await randomDelay(
      CONFIG.delays.farmPauseMin,
      CONFIG.delays.farmPauseMax
    );
  }
}

async function handleMegaFieldAutoplant(page, rid) {
  const pos    = CONFIG.megaFieldTour.position;
  const seedId = Number(CONFIG.defaultSeedId);

  for (const farm of CONFIG.farms) {
    console.log(`🌱 Autoplant Mega-field dla farmy ${farm}`);
    
    const info = await sendFarmRequest(page, rid, 'innerinfos', farm, pos);
    console.log('   ▶️ raw mega-innerinfos:', JSON.stringify(info, null, 2));

   
    if (info.datablock?.[1]?.autoplantenabled) {
      
      await sendFarmRequest(
        page, rid,
        'megafield_autoplant',
        farm, pos,
        { id: seedId, pid: seedId }
      );
      console.log(`🌱 Autoplant wykonany na F${farm},P${pos}`);
    } else {
      console.log(`🚫 Brak premium na F${farm},P${pos}, pomijam`);
    }

    await randomDelay(
      CONFIG.delays.farmPauseMin,
      CONFIG.delays.farmPauseMax
    );
  }
}

module.exports = {
  handleMegaFieldTour,
  handleMegaFieldHarvest,
  handleMegaFieldAutoplant
};
