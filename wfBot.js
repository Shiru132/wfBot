// wfBot.js


const puppeteer = require('puppeteer');

// przenieść CONFIG do JSON
const CONFIG = {
  login:    '',
  password: '',
  serverId: '',
  farms:    [1,2,3,4,5,6,7,8,9,10],
  positionsPerFarm: 6,
  defaultSeedId:    '1',
  animal: {
    collectMode: 'inner_crop',
    initMode:    'inner_init',
    feedMode:    'inner_feed',
    feedParams:  { pid:'3', c:'3_1|', amount:'1', guildjob:'0' }
  },
  factory: {
    collectMode:   'harvestproduction',
    collectParams: {},
    workMode:      'start',
    workParams:    {}
  },
  factories: {
    8:  { collectMode:'harvestproduction', collectParams:{id:1,slot:1}, workMode:'start', workParams:{slot:1,item:2} },
    9:  { collectMode:'harvestproduction', collectParams:{id:1,slot:1}, workMode:'start', workParams:{slot:1,item:2} },
    16: { collectMode:'harvestproduction', collectParams:{id:1,slot:1}, workMode:'start', workParams:{slot:1,item:2} },
    18: { collectMode:'harvestproduction', collectParams:{id:1,slot:3}, workMode:'start', workParams:{slot:1,item:3} }
  },

  megaFieldTour: {
    position: 1,
    // wszystkie sety dla megafield_tour 9 na 11
    setSegments: Array.from({length:9}, (_, i) =>
      Array.from({length:8}, (_, k) => `${i+1 + k*11}`).join(',|') + ',|'
    ),
    vid: 6
  },
  baseUrl:          'https://s13.wolnifarmerzy.pl',
  farmEndpoint:     '/ajax/farm.php',
  forestryEndpoint: '/ajax/forestry.php',
  loopInterval:     10 * 60 * 1000, // 10 min
  delays: {
    harvestMin:   1600, harvestMax:   3200,
    initMin:      2400, initMax:      4800,
    plantMin:     2000, plantMax:     4000,
    farmPauseMin: 6000, farmPauseMax: 12000
  },
  startDelay: 30 * 1000 // 30 s pauzy po logowaniu
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomDelay = (min, max) => sleep(Math.floor(Math.random() * (max - min + 1)) + min);

// 1) logowanie
async function performLogin(page) {
  console.log(`🔑 Próba logowania jako ${CONFIG.login}@${CONFIG.serverId}`);
  await page.goto(`${CONFIG.baseUrl}/main.php?ref=gomffpl`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="text"]', { timeout:15000 });
  await page.type('input[type="text"]', CONFIG.login,  { delay:100 });
  await page.type('input[type="password"]', CONFIG.password, { delay:100 });
  await page.select('select[name="server"]', CONFIG.serverId);
  await page.click('#loginbutton');
  await page.waitForFunction(
    () => typeof window.rid === 'string' && window.rid.length>0,
    { timeout:15000 }
  );
  console.log('✅ Zalogowano na serwerze', CONFIG.serverId);
}

// 2) pobranie rid
async function fetchRid(page) {
  const rid = await page.evaluate(() => window.rid);
  if (!rid) throw new Error('RID nieznaleziony');
  console.log('🔑 RID pobrane:', rid);
  return rid;
}

// 3) uniwersalny AJAX 
async function sendFarmRequest(page, rid, mode, farm, pos, extra={}) {
  const params = new URLSearchParams({ mode, farm, position: pos, rid, ...extra }).toString();
  const url = CONFIG.baseUrl + CONFIG.farmEndpoint + '?' + params;
  try {
    const text = await page.evaluate(async u => (await fetch(u)).text(), url);
    return JSON.parse(text);
  } catch (e) {
    console.warn('‼️ Błąd zapytania:', e.message);
    return null;
  }
}

// 4) Uniwersalny AJAX dla el drzewado
async function sendForestryRequest(page, rid, action, extra={}) {
  const params = new URLSearchParams({ action, rid, ...extra }).toString();
  const url = CONFIG.baseUrl + CONFIG.forestryEndpoint + '?' + params;
  try {
    const text = await page.evaluate(async u => (await fetch(u)).text(), url);
    return JSON.parse(text);
  } catch (e) {
    console.warn('‼️ Błąd forestry:', e.message);
    return null;
  }
}

// 5) Mega-field tour – sadzenie
async function handleMegaFieldTour(page, rid) {
  const setString = CONFIG.megaFieldTour.setSegments.join('|');
  for (const farm of CONFIG.farms) {
    console.log(`🚜 Mega-field tour (sadzenie) dla farmy ${farm}`);
    await sendFarmRequest(
      page, rid,
      'megafield_tour',
      farm,
      CONFIG.megaFieldTour.position,
      { set: setString, vid: CONFIG.megaFieldTour.vid }
    );
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  }
}

// 5b) mega-field harvest – zbiór
async function handleMegaFieldHarvest(page, rid) {
  const setString = CONFIG.megaFieldTour.setSegments.join('|');
  for (const farm of CONFIG.farms) {
    console.log(`🌾 Mega-field harvest (zbiór) dla farmy ${farm}`);
    await sendFarmRequest(
      page, rid,
      'megafield_harvest', // 
      farm,
      CONFIG.megaFieldTour.position,
      { set: setString, vid: CONFIG.megaFieldTour.vid }
    );
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  }
}

// 5c) Mega-field autoplant – nawożenie/siew
async function handleMegaFieldAutoplant(page, rid) {
  for (const farm of CONFIG.farms) {
    console.log(`🌱 Mega-field autoplant dla farmy ${farm}`);
    await sendFarmRequest(
      page, rid,
      'megafield_autoplant',
      farm,
      CONFIG.megaFieldTour.position,
      { id: '1', pid: '1' }
    );
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  }
}

// 6) Wykrycie typu pola 
async function detectType(page, rid, farm, pos) {
  console.group(`detectType [F${farm},P${pos}]`);
  const info = await sendFarmRequest(page, rid, 'innerinfos', farm, pos);
  console.log(' raw innerinfos:', info);
  if (info?.datablock?.[0] === 1 && info.datablock[1]) {
    const d = info.datablock[1];
    if (d.buildingid) {
      console.log(' → wykryto FACTORY', d.buildingid);
      console.groupEnd();
      return { type:'factory', buildingid: Number(d.buildingid) };
    }
    if (d.animals) {
      console.log(' → wykryto STABLE');
      console.groupEnd();
      return { type:'stable' };
    }
  }
  const initG = await sendFarmRequest(page, rid, 'gardeninit', farm, pos);
  console.log(' gardeninit:', initG);
  if (initG?.datablock?.[0] === 1 && initG.datablock[1]?.plantinfo!==undefined) {
    console.log(' → wykryto GARDEN');
    console.groupEnd();
    return { type:'garden' };
  }
  console.log(' → fallback = garden');
  console.groupEnd();
  return { type:'garden' };
}

// 7) Garden: podlewanie, zbiór, sadzenie
async function handleGarden(page, rid, farm, pos) {
  const w = await sendFarmRequest(page, rid, 'watergarden', farm, pos);
  console.log(
    w?.datablock?.[0] === 1
      ? `💧 [F${farm},P${pos}] Podlano farmę`
      : `— [F${farm},P${pos}] Podlewanie niepotrzebn lub nieudane`
  );
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  const h = await sendFarmRequest(page, rid, 'cropgarden', farm, pos);
  let seed = CONFIG.defaultSeedId;
  if (h?.datablock?.[0]===1 && Array.isArray(h.datablock[1])) {
    seed = String(h.datablock[1][0].i);
    console.log(`✅ [F${farm},P${pos}] Zebrano ID=${seed}`);
  } else {
    console.log(`— [F${farm},P${pos}] Nic do zebrania, posadzę ID=${seed}`);
  }
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  const init = await sendFarmRequest(page, rid, 'gardeninit', farm, pos);
  if (init?.datablock?.[0]===1) {
    console.log(`🔨 [F${farm},P${pos}] Pole zainicjowane`);
    await randomDelay(CONFIG.delays.initMin, CONFIG.delays.initMax);
    const p = await sendFarmRequest(page, rid, 'autoplant', farm, pos, { id:seed, product:seed });
    if (p?.datablock?.[0]===1) {
      console.log(`🌱 [F${farm},P${pos}] Posadzono ID=${seed}`);
    } else {
      console.log(`⚠️ [F${farm},P${pos}] Sadzenie nieudane — ${p.datablock[1]}`);
    }
    await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantMax);
  }
}

// 8)  zbiór mleka, inicj obory, karmienie
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
      if (f?.datablock?.[0]===1) {
        console.log(`🐄 [F${farm},A${pos}] Nakarmiono`);
      } else {
        console.log(`⚠️ [F${farm},A${pos}] Karmienie nieudane — ${f.datablock[1]}`);
      }
      await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantMax);
    }
  } else {
    console.log(`— [F${farm},A${pos}] Brak mleka`);
  }
}

// 9) factory: zbiór produktu, restart produkcji
async function handleFactory(page, rid, farm, pos) {
  const info = await sendFarmRequest(page, rid, 'innerinfos', farm, pos);
  const bId = info?.datablock?.[1]?.buildingid;
  const cfg = CONFIG.factories[bId] || CONFIG.factory;

  const c = await sendFarmRequest(page, rid, cfg.collectMode, farm, pos, cfg.collectParams);
  console.log(
    c?.datablock?.[0]===1
      ? `⚙️ [F${farm},X${pos}] Zebrano produkt slocie=${cfg.collectParams.slot}`
      : `— [F${farm},X${pos}] Nic do zebrania w slocoie ${cfg.collectParams.slot}`
  );
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  const w = await sendFarmRequest(page, rid, cfg.workMode, farm, pos, cfg.workParams);
  console.log(
    w?.datablock?.[0]===1
      ? `🔧 [F${farm},X${pos}] Produkcja uruchomiona (slot=${cfg.workParams.slot}, item=${cfg.workParams.item})`
      : `⚠️ [F${farm},X${pos}] Produkcja nieudana — ${w.datablock[1]}`
  );
  await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantPauseMax);
}

// 10) el drzewado: initforestry, water, cropall, cropproduction, autoplant, startproduction
async function handleForestry(page, rid) {
  console.log('🌲 Forestry: initforestry');
  await sendForestryRequest(page, rid, 'initforestry');
  await randomDelay(CONFIG.delays.initMin, CONFIG.delays.initMax);

  console.log('🌲 Forestry: water');
  await sendForestryRequest(page, rid, 'water');
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  console.log('🌲 Forestry: cropall');
  await sendForestryRequest(page, rid, 'cropall');
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  console.log('🌲 Forestry: cropproduction slot1');  
  await sendForestryRequest(page, rid, 'cropproduction', { position:1, slot:1 });
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  console.log('🌲 Forestry: cropproduction slot2');
  await sendForestryRequest(page, rid, 'cropproduction', { position:1, slot:2 });
  await randomDelay(CONFIG.delays.harvestMin, CONFIG.delays.harvestMax);

  console.log('🌲 Forestry: autoplant');
  await sendForestryRequest(page, rid, 'autoplant', { productid:1 });
  await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantPauseMax);

  console.log('🌲 Forestry: startproduction slot1');
  await sendForestryRequest(page, rid, 'startproduction', { position:1, productid:51, slot:1 });
  await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantPauseMax);

  console.log('🌲 Forestry: startproduction slot2');
  await sendForestryRequest(page, rid, 'startproduction', { position:1, productid:51, slot:2 });
  await randomDelay(CONFIG.delays.plantMin, CONFIG.delays.plantPauseMax);
}

// 11) Unified cycle – Forestry → Tour → Harvest → Autoplant → Special farm 9 → Farms
async function unifiedCycle(page, initialRid) {
  console.log('\n=== Start unified cycle ===');
  let rid = initialRid;

  // a) el drzewado
  await handleForestry(page, rid);

  // b) mega-field tour (sadzenie)
  await handleMegaFieldTour(page, rid);

  // c) mega-field harvest (zbiór)
  await handleMegaFieldHarvest(page, rid);

  // d) mega-field autoplant
  await handleMegaFieldAutoplant(page, rid);

  // e) specjalny wyjątek dla farmy 9
  if (CONFIG.farms.includes(9)) {
    console.log('🛠 Specjalny wyjątek dla farmy 9');
    for (let pos=1; pos<=CONFIG.positionsPerFarm; pos++) {
      await sendFarmRequest(page, rid, 'harvestproduction', 9, pos, { id:2, slot:1 });
      await randomDelay(300,600);
      await sendFarmRequest(page, rid, 'harvestproduction', 9, pos, { id:2, slot:2 });
      await randomDelay(300,600);
    }
    for (let pos=1; pos<=3; pos++) {
      await sendFarmRequest(page, rid, 'start', 9, pos, { item:1, slot:1 });
      await randomDelay(300,600);
      await sendFarmRequest(page, rid, 'start', 9, pos, { item:1, slot:2 });
      await randomDelay(300,600);
    }
    for (let pos=4; pos<=6; pos++) {
      await sendFarmRequest(page, rid, 'start', 9, pos, { item:10, slot:1 });
      await randomDelay(300,600);
      await sendFarmRequest(page, rid, 'start', 9, pos, { item:10, slot:2 });
      await randomDelay(300,600);
    }
    console.log('🛠 Specjalny wyjątek dla farmy 9 skończone');
  }  

  // f) standardowy cykl farm
  for (const farm of CONFIG.farms) {
    for (let pos=1; pos<=CONFIG.positionsPerFarm; pos++) {
      const det = await detectType(page, rid, farm, pos);
      if (det.type==='garden')  await handleGarden(page, rid, farm, pos);
      if (det.type==='stable')  await handleStable(page, rid, farm, pos);
      if (det.type==='factory') await handleFactory(page, rid, farm, pos);
    }
    console.log(`🔄 Koniec farmy ${farm}, odświeżam…`);
    await page.reload({ waitUntil:'networkidle2' });
    rid = await fetchRid(page);
    await randomDelay(CONFIG.delays.farmPauseMin, CONFIG.delays.farmPauseMax);
  }

  console.log('=== Koniec unified cycle ===\n');
  return rid;
}

// START
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  const page = await browser.newPage();

  try {
    await performLogin(page);
    console.log(`⏱ Pauza ${CONFIG.startDelay/1000}s przed startem bota…`);
    await sleep(CONFIG.startDelay);

    let rid = await fetchRid(page);
    rid = await unifiedCycle(page, rid);

    setInterval(async () => {
      const nrid = await fetchRid(page);
      await unifiedCycle(page, nrid);
    }, CONFIG.loopInterval);

    console.log(`🤖 Bot pracuje cyklicznie co ${CONFIG.loopInterval/60000} min`);
  } catch (err) {
    console.error('❌ KRYTYCZNY BŁĄD:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
