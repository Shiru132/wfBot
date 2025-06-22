const puppeteer    = require('puppeteer');         // do sterowania przeglądarką
const CONFIG       = require('./config.json');      // ustawienia (opóźnienia, interwały itp.)
const performLogin = require('./login');            // logowanie na stronę
const detectType   = require('./detection');        // rozpoznawanie typu pola (ogród / fabryka / stajnia)
const fetchRid     = require('./rid');              // pobranie rid ze strony
const unifiedCycle = require('./unifiedCycle');     // cała logika akcji (sadzenie, podlewanie, zbiór)
const {sleep}        = require('./utils');            // delay 


(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
  const page = await browser.newPage();

  try {
    await performLogin(page);
    console.log(`⏱ Pauza ${CONFIG.startDelay/1000}s po logowaniu…`);
    await sleep(CONFIG.startDelay);

    let rid = await fetchRid(page);
    rid = await unifiedCycle(page, rid);

    setInterval(async () => {
      const nrid = await fetchRid(page);
      await unifiedCycle(page, nrid);
    }, CONFIG.loopInterval);

    console.log(`🤖 Bot pracuje cyklicznie co ${CONFIG.loopInterval/60000} min`);
  } catch (err) {
    console.error('❌ KRYTYCZNY BŁĄDs:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
