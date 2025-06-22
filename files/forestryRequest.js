const CONFIG = require('./config.json');

async function sendForestryRequest(page, rid, action, extra = {}) {
  const params = new URLSearchParams({ action, rid, ...extra }).toString();
  const url = `${CONFIG.baseUrl}${CONFIG.forestryEndpoint}?${params}`;

  console.log(`🌲 [forestryRequest] action=${action}`);


  let text;
  try {
    text = await page.evaluate(u => fetch(u).then(r => r.text()), url);
  } catch (fetchErr) {
    console.warn('‼️ Błąd forestryRequest (fetch):', fetchErr.message);
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (parseErr) {
    console.warn('‼️ Nieparsowalny JSON z forestryRequest:', text);
    return null;
  }
}

module.exports = { sendForestryRequest };
