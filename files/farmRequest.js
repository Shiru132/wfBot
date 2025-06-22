const CONFIG = require('./config.json');

async function sendFarmRequest(page, rid, mode, farm, position, extra = {}) {
  const params = new URLSearchParams({ mode, farm, position, rid, ...extra }).toString();
  const url = `${CONFIG.baseUrl}${CONFIG.farmEndpoint}?${params}`;

  console.log(`🌾 [farmRequest] ${mode} → farm=${farm}, pos=${position}`);
  

  let text;
  
  try {
    text = await page.evaluate(u => fetch(u).then(r => r.text()), url);
  } catch (fetchErr) {
    console.warn('‼️ nłąd farmRequest (fetch):', fetchErr.message);
    return null;
  }

  
  try {
    return JSON.parse(text);
  } catch (parseErr) {
    console.warn('‼️ nieparsowalny jSON z farmRequest:', text);
    return null;
  }
}

module.exports = { sendFarmRequest };
