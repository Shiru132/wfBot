const { sendFarmRequest } = require('./farmRequest');
const CONFIG = require('./config.json');
const { randomDelay } = require('./utils');

async function handleGarden(page, rid, farm, pos) {
  const actions = [
    { fn: () => sendFarmRequest(page, rid, 'watergarden', farm, pos),
      log: () => console.log(`💧 [F${farm},P${pos}] Podlano farmę`),
      delay: CONFIG.delays.harvestMin
    },
    { fn: () => sendFarmRequest(page, rid, 'cropgarden', farm, pos),
      log: (res) => console.log(res?.datablock?.[0]===1
        ? `✅ [F${farm},P${pos}] Zebrano`
        : `— [F${farm},P${pos}] Nic do zebrania`),
      delay: CONFIG.delays.harvestMax
    }
  ];
  for (const action of actions) {
    const res = await action.fn(); action.log(res);
    await randomDelay(action.delay, action.delay * 2);
  }
  const init = await sendFarmRequest(page, rid, 'gardeninit', farm, pos);
  if (init?.datablock?.[0]===1) {
    console.log(`🔨 [F${farm},P${pos}] Pole zainicjowane`);
    await randomDelay(CONFIG.delays.initMin, CONFIG.delays.initMax);
    const seed = CONFIG.defaultSeedId;
    const p = await sendFarmRequest(page, rid, 'autoplant', farm, pos, { id:seed, product:seed });
    console.log(p?.datablock?.[0]===1
      ? `🌱 [F${farm},P${pos}] Posadzono ID=${seed}`
      : `⚠️ [F${farm},P${pos}] Sadzenie nieudane`);
    await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantMax);
  }
}

async function handleStable(page, rid, farm, pos) {
  const milk = await sendFarmRequest(page, rid, CONFIG.animal.collectMode, farm, pos);
  if (milk?.datablock?.[0]===1) {
    console.log(`🥛 [F${farm},A${pos}] Odebrano mleko`);
    await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);
    const init = await sendFarmRequest(page, rid, CONFIG.animal.initMode, farm, pos);
    if (init?.datablock?.[0]===1) {
      console.log(`🔨 [F${farm},A${pos}] Obora zainicjowana`);
      await randomDelay(CONFIG.delays.initMin, CONFIG.delays.initMax);
      const f = await sendFarmRequest(page, rid, CONFIG.animal.feedMode, farm, pos, CONFIG.animal.feedParams);
      console.log(f?.datablock?.[0]===1
        ? `🐄 [F${farm},A${pos}] Nakarmiono`
        : `⚠️ [F${farm},A${pos}] Karmienie nieudane`);
      await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantMax);
    }
  } else console.log(`— [F${farm},A${pos}] Brak mleka`);
}

async function handleFactory(page, rid, farm, pos) {
  const info = await sendFarmRequest(page, rid, 'innerinfos', farm, pos);
  const bId = info?.datablock?.[1]?.buildingid;
  const cfg = CONFIG.factories[bId] || CONFIG.factory;
  const tasks = [
    { fn: () => sendFarmRequest(page, rid, cfg.collectMode, farm, pos, cfg.collectParams),
      log: () => console.log(`⚙️ [F${farm},X${pos}] Zebrano produkt`),
      delay: CONFIG.delays.harvestMin
    },
    { fn: () => sendFarmRequest(page, rid, cfg.workMode, farm, pos, cfg.workParams),
      log: () => console.log(`🔧 [F${farm},X${pos}] Produkcja uruchomiona`),
      delay: CONFIG.delays.plantMin
    }
  ];
  for (const task of tasks) {
    await task.fn(); task.log();
    await randomDelay(task.delay, task.delay * 2);
  }
}

module.exports = { handleGarden, handleStable, handleFactory };