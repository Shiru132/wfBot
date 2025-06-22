// detection.js
const { sendFarmRequest } = require('./farmRequest');

async function detectType(page, rid, farm, pos) {
  console.group(`detectType [F${farm},P${pos}]`);
  const info = (await sendFarmRequest(page, rid, 'innerinfos', farm, pos)) || {};
  console.log(' raw innerinfos:', info);
  let type = 'garden';
  if (info.datablock?.[0] === 1 && info.datablock[1]) {
    const d = info.datablock[1];
    if (d.buildingid) type = 'factory';
    else if (d.animals)    type = 'stable';
  }
  console.log(` → wykryto ${type.toUpperCase()}`);
  console.groupEnd();
  return { type };
}

module.exports = detectType;
