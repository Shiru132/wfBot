// login.js
const CONFIG = require('./config.json');   

async function performLogin(page) {
  console.log(`🔑 Próba logowania jako ${CONFIG.login}@${CONFIG.serverId}`);

 
  await page.goto(`${CONFIG.baseUrl}/main.php?ref=gomffpl`, { waitUntil: 'networkidle2' });
  
 
  console.log('➡️ Strona logowania załadowana');

  await page.waitForSelector('input[type="text"]', { timeout: 15000 });
  await page.type('input[type="text"]', CONFIG.login,    { delay: 100 });
  await page.type('input[type="password"]', CONFIG.password, { delay: 100 });
  await page.select('select[name="server"]', CONFIG.serverId);
  await page.click('#loginbutton');

  console.log('➡️ Kliknąłem „Zaloguj” – czekam na RID…');
  await page.waitForFunction(
    () => typeof window.rid === 'string' && window.rid.length > 0,
    { timeout: 15000 }
  );

  console.log('✅ Zalogowano na serwerze', CONFIG.serverId);
}

module.exports = performLogin;
