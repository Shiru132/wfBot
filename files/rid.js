// rid.js
async function fetchRid(page) {
  const rid = await page.evaluate(() => window.rid);
  if (!rid) throw new Error('RID nieznaleziony');
  console.log('🔑 RID pobrane:', rid);
  return rid;
}

module.exports = fetchRid;
