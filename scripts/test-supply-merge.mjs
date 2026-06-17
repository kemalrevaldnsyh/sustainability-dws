/**
 * Supply import merge — company + quarter/year (sesuai request user).
 * Run: node scripts/test-supply-merge.mjs
 */

const SUPPLY_PCT_COL_CPO = 'PERCENTAGE SUPPLY CPO';
const SUPPLY_PCT_COL_PK = 'PERCENTAGE SUPPLY PK';

function supplyNormKey_(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function supplyPeriodKey_(quarter, year) {
  const q = String(quarter || '').trim().toUpperCase().replace(/^Q/i, 'Q');
  return q + '|' + String(year || '').trim();
}
function supplyCompanyKey_(company) {
  return supplyNormKey_(company);
}
function supplyCombineSupplyTypes_(a, b) {
  const types = [];
  function addToken(raw) {
    const u = String(raw || '').trim().toUpperCase();
    if (!u) return;
    if (u.indexOf('CPO') >= 0 && types.indexOf('CPO') === -1) types.push('CPO');
    if (u.indexOf('PK') >= 0 && types.indexOf('PK') === -1) types.push('PK');
  }
  addToken(a);
  addToken(b);
  if (types.length > 1) return 'CPO+PK';
  return types[0] || 'CPO';
}
function supplyRowHasCpo_(row) {
  const st = String(row.supply_type || '').toUpperCase();
  if (st.indexOf('CPO') >= 0) return true;
  const pct = row[SUPPLY_PCT_COL_CPO];
  return pct != null && String(pct).trim() !== '';
}
function supplyRowHasPk_(row) {
  const st = String(row.supply_type || '').toUpperCase();
  if (st.indexOf('PK') >= 0) return true;
  const pct = row[SUPPLY_PCT_COL_PK];
  return pct != null && String(pct).trim() !== '';
}
function supplyMergeProductSupplyField_(row) {
  const types = [];
  if (supplyRowHasCpo_(row)) types.push('CPO');
  if (supplyRowHasPk_(row)) types.push('PK');
  if (types.length === 2) return 'CPO, PK';
  if (types.length === 1) return types[0];
  return '';
}
function supplyFindDraftRowsForMergeByCompany_(batch, companyName) {
  const wantCo = supplyCompanyKey_(companyName);
  return (batch.rows || []).filter(function(row) {
    return !row._submitted && supplyCompanyKey_(row['COMPANY NAME']) === wantCo;
  });
}
function supplyApplyImportToDraftRow_(existing, r, kind) {
  const pctField = kind === 'PK' ? SUPPLY_PCT_COL_PK : SUPPLY_PCT_COL_CPO;
  const facField = kind === 'PK' ? 'FACILITY NAME PK' : 'FACILITY NAME CPO';
  existing[pctField] = r.SUPPLY_PCT;
  existing[facField] = r.PLANT || existing[facField] || '';
  existing.supply_type = supplyCombineSupplyTypes_(existing.supply_type, kind);
  existing['PRODUCT SUPPLY'] = supplyMergeProductSupplyField_(existing);
}

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('FAIL:', msg);
}

// 1) Same quarter/year + company name → merge CPO then PK
const batch = {
  quarter: 'Q1', year: '2026', supply_type: 'CPO',
  rows: [{
    'COMPANY NAME': 'ABDI BORNEO PLANTATIONS',
    supply_type: 'CPO',
    [SUPPLY_PCT_COL_CPO]: 45.5,
    'FACILITY NAME CPO': 'PLANT A',
    _submitted: false,
  }],
};
const pkRow = { company: 'ABDI BORNEO PLANTATIONS', SUPPLY_PCT: 12.3, PLANT: 'PLANT B' };
const matches = supplyFindDraftRowsForMergeByCompany_(batch, pkRow.company);
assert(matches.length === 1, 'find by company name');
supplyApplyImportToDraftRow_(matches[0], pkRow, 'PK');
assert(matches[0].supply_type === 'CPO+PK', 'supply_type CPO+PK');
assert(matches[0][SUPPLY_PCT_COL_CPO] === 45.5, 'CPO pct preserved');
assert(matches[0][SUPPLY_PCT_COL_PK] === 12.3, 'PK pct added');
assert(matches[0]['PRODUCT SUPPLY'] === 'CPO, PK', 'PRODUCT SUPPLY CPO, PK');

// 2) Different quarter → no merge
const batchQ2 = { rows: [{ 'COMPANY NAME': 'X', supply_type: 'CPO', _submitted: false }] };
assert(supplyPeriodKey_('Q1', '2026') !== supplyPeriodKey_('Q2', '2026'), 'different period keys');

// 3) Company name case-insensitive
assert(supplyCompanyKey_('Abdi Borneo') === supplyCompanyKey_('ABDI BORNEO'), 'company norm case');

// 4) Different company → no match
assert(supplyFindDraftRowsForMergeByCompany_(batch, 'OTHER CO').length === 0, 'different company no merge');

console.log('Supply merge tests:', passed, 'passed,', failed, 'failed');
process.exit(failed ? 1 : 0);
