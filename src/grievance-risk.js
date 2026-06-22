/**
 * Grievance Monitoring — risk classification guidance & score calculator.
 * Aligns with spreadsheet "Risk Classification Guidance" + RISK LEVEL matrix.
 */

export const GRV_RISK_SCORE_FIELDS = [
  'Publish Grievance',
  'Subject Grievance',
  'Repeat Grievance',
  'Consequence',
  'Group Scale',
  'No Response',
];

export const GRV_RISK_COMPUTED_FIELDS = ['Total Score', 'Risk Classification'];

/** Full guidance reference (Indikator → options). */
export const GRV_RISK_GUIDANCE = [
  {
    field: 'Publish Grievance',
    label: '1 · Publish Grievance',
    options: [
      { score: 2, label: 'Yes' },
      { score: 1, label: 'No' },
    ],
  },
  {
    field: 'Subject Grievance',
    label: '2 · Subject Grievance',
    options: [
      { score: 2, label: 'Group Level' },
      { score: 1, label: 'Subsidiary / None Group' },
    ],
  },
  {
    field: 'Repeat Grievance',
    label: '3 · Repeat Grievance',
    options: [
      { score: 3, label: '2× or more within 3 months' },
      { score: 2, label: '1× within 3 months' },
      { score: 1, label: 'Not repeated' },
    ],
  },
  {
    field: 'Consequence',
    label: '4 · Consequence',
    options: [
      { score: 3, label: 'Potential harm / external sanctions' },
      { score: 2, label: 'Requires action plan & clarification' },
      { score: 1, label: 'No significant impact' },
    ],
  },
  {
    field: 'Group Scale',
    label: '5 · Group Scale',
    options: [
      { score: 3, label: '5+ mills or plantation ≥ 50,000 ha' },
      { score: 2, label: '2–4 mills or plantation 10k–<50k ha' },
      { score: 1, label: '1 mill or plantation < 10k ha' },
    ],
  },
  {
    field: 'No Response',
    label: '6 · No Response',
    options: [
      { score: 2, label: 'No response within 2 weeks of clarification request' },
      { score: 1, label: 'Response provided' },
    ],
  },
];

const GRV_RISK_HEADER_ALIASES = {
  'Consequense': 'Consequence',
  'CONSEQUENSE': 'Consequence',
  'CONSEQUENCE': 'Consequence',
};

export function grvRiskFieldValue_(row, field) {
  const r = row || {};
  const direct = r[field];
  if (direct != null && String(direct).trim() !== '') return String(direct).trim();
  const alias = GRV_RISK_HEADER_ALIASES[field];
  if (alias && r[alias] != null && String(r[alias]).trim() !== '') return String(r[alias]).trim();
  return '';
}

export function grvRiskScoresFromRow_(row) {
  return GRV_RISK_SCORE_FIELDS.map(function(field) {
    const raw = grvRiskFieldValue_(row, field);
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
  });
}

export function grvRiskTotalFromRow_(row) {
  const stored = row && row['Total Score'];
  if (stored != null && String(stored).trim() !== '') {
    const n = parseInt(stored, 10);
    if (!isNaN(n)) return n;
  }
  const scores = grvRiskScoresFromRow_(row);
  if (!scores.some(function(s) { return s > 0; })) return 0;
  return scores.reduce(function(a, b) { return a + b; }, 0);
}

/** Total score → Low / Medium / High (matches spreadsheet examples: 8=Low, 10=Medium). */
export function grvRiskClassFromTotal_(total) {
  const n = parseInt(total, 10);
  if (isNaN(n) || n <= 0) return '';
  if (n <= 8) return 'Low';
  if (n <= 11) return 'Medium';
  return 'High';
}

export function grvRiskClassFromRow_(row) {
  const stored = row && row['Risk Classification'];
  if (stored && String(stored).trim()) return String(stored).trim();
  return grvRiskClassFromTotal_(grvRiskTotalFromRow_(row));
}

function riskBadgeClass_(level) {
  const v = String(level || '').toLowerCase();
  if (v.includes('high')) return 'risk-high';
  if (v.includes('med')) return 'risk-med';
  if (v.includes('low')) return 'risk-low';
  return '';
}

export function grvRiskBadgeHtml_(level, escHtml) {
  if (!level) return '—';
  const cls = riskBadgeClass_(level);
  return '<span class="status-badge ' + cls + '"><span class="s-dot"></span>'
    + escHtml(level) + '</span>';
}

export function grvRiskTableCellHtml_(row, escHtml, riskBadgeFn) {
  const level = grvRiskClassFromRow_(row);
  if (!level) return '—';
  const total = grvRiskTotalFromRow_(row);
  let html = riskBadgeFn ? riskBadgeFn(level) : grvRiskBadgeHtml_(level, escHtml);
  if (total > 0) {
    html += '<span class="grv-risk-total-hint" title="Total risk score">'
      + escHtml(String(total)) + '</span>';
  }
  return html;
}

function guidanceTableHtml_(escHtml) {
  let rows = '';
  GRV_RISK_GUIDANCE.forEach(function(ind) {
    ind.options.forEach(function(opt, oi) {
      rows += '<tr>'
        + (oi === 0
          ? '<td class="grv-risk-guide-no" rowspan="' + ind.options.length + '">' + escHtml(ind.label.split('·')[0].trim()) + '</td>'
            + '<td class="grv-risk-guide-ind" rowspan="' + ind.options.length + '">' + escHtml(ind.label.replace(/^\d+\s*·\s*/, '')) + '</td>'
          : '')
        + '<td>' + escHtml(opt.label) + '</td>'
        + '<td class="grv-risk-guide-score">' + escHtml(String(opt.score)) + '</td>'
        + '</tr>';
    });
  });
  return ''
    + '<table class="grv-risk-guide-table" aria-label="Risk classification guidance">'
    + '<thead><tr><th>No</th><th>Indicator</th><th>Description</th><th>Score</th></tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>';
}

function scoreSelectHtml_(ind, currentVal, escHtml) {
  const cur = String(currentVal || '').trim();
  let opts = '<option value="">Select score…</option>';
  ind.options.forEach(function(opt) {
    const val = String(opt.score);
    const sel = cur === val ? ' selected' : '';
    opts += '<option value="' + val + '"' + sel + '>'
      + escHtml('Score ' + opt.score + ' — ' + opt.label) + '</option>';
  });
  return ''
    + '<div class="form-field grv-risk-picker">'
    + '<label for="grv-risk-' + escHtml(ind.field) + '">' + escHtml(ind.label) + '</label>'
    + '<select id="grv-risk-' + escHtml(ind.field) + '" data-field="' + escHtml(ind.field) + '" data-grv-risk-score>'
    + opts + '</select>'
    + '<p class="grv-risk-picker-hint" data-grv-risk-hint="' + escHtml(ind.field) + '"></p>'
    + '</div>';
}

/**
 * Risk section HTML for Add/Edit grievance modal.
 * @param {object} data - existing row
 * @param {function} escHtml
 */
export function grvRiskSectionHtml_(data, escHtml) {
  data = data || {};
  const total = grvRiskTotalFromRow_(data);
  const riskClass = grvRiskClassFromRow_(data);
  const pickers = GRV_RISK_GUIDANCE.map(function(ind) {
    return scoreSelectHtml_(ind, grvRiskFieldValue_(data, ind.field), escHtml);
  }).join('');

  return ''
    + '<div class="grv-risk-section full">'
    + '<div class="grv-risk-section-head">'
    + '<h4 class="grv-risk-section-title">Risk Classification</h4>'
    + '<p class="grv-risk-section-desc">Select a score (1–3) for each indicator. Total score and risk level are calculated automatically.</p>'
    + '</div>'
    + '<details class="grv-risk-guidance">'
    + '<summary>Risk classification guidance</summary>'
    + '<div class="grv-risk-guidance-body">' + guidanceTableHtml_(escHtml) + '</div>'
    + '</details>'
    + '<div class="grv-risk-pickers">' + pickers + '</div>'
    + '<div class="grv-risk-result-row">'
    + '<div class="form-field auto-total-field">'
    + '<label>Total Score</label>'
    + '<input type="hidden" data-field="Total Score" id="grv-risk-total-input" value="' + escHtml(total ? String(total) : '') + '">'
    + '<div class="auto-total-val" id="grv-risk-total-display">' + escHtml(total ? String(total) : '—') + '</div>'
    + '</div>'
    + '<div class="form-field auto-total-field">'
    + '<label>Risk Classification</label>'
    + '<input type="hidden" data-field="Risk Classification" id="grv-risk-class-input" value="' + escHtml(riskClass) + '">'
    + '<div class="grv-risk-result-badge" id="grv-risk-class-display">'
    + (riskClass ? grvRiskBadgeHtml_(riskClass, escHtml) : '<span class="grv-risk-placeholder">Select all indicators</span>')
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function updateRiskHint_(field, score) {
  const hint = document.querySelector('[data-grv-risk-hint="' + field + '"]');
  if (!hint) return;
  const ind = GRV_RISK_GUIDANCE.find(function(g) { return g.field === field; });
  if (!ind || !score) {
    hint.textContent = '';
    return;
  }
  const opt = ind.options.find(function(o) { return String(o.score) === String(score); });
  hint.textContent = opt ? opt.label : '';
}

export function grvRecalcRiskSection_(root) {
  root = root || document.getElementById('modalFormGrid');
  if (!root) return;
  let total = 0;
  let filled = 0;
  GRV_RISK_SCORE_FIELDS.forEach(function(field) {
    const el = root.querySelector('[data-field="' + field + '"]');
    const n = el ? parseInt(el.value, 10) : NaN;
    if (!isNaN(n) && n > 0) {
      total += n;
      filled += 1;
      updateRiskHint_(field, n);
    } else {
      updateRiskHint_(field, '');
    }
  });
  const totalInput = root.querySelector('#grv-risk-total-input');
  const totalDisplay = root.querySelector('#grv-risk-total-display');
  const classInput = root.querySelector('#grv-risk-class-input');
  const classDisplay = root.querySelector('#grv-risk-class-display');
  const complete = filled === GRV_RISK_SCORE_FIELDS.length;
  if (totalInput) totalInput.value = complete ? String(total) : '';
  if (totalDisplay) totalDisplay.textContent = complete ? String(total) : '—';
  const riskClass = complete ? grvRiskClassFromTotal_(total) : '';
  if (classInput) classInput.value = riskClass;
  if (classDisplay) {
    classDisplay.innerHTML = riskClass
      ? grvRiskBadgeHtml_(riskClass, function(s) { return s; })
      : '<span class="grv-risk-placeholder">Select all indicators</span>';
  }
}

export function grvInitRiskSection_(root, data) {
  root = root || document.getElementById('modalFormGrid');
  if (!root) return;
  root.querySelectorAll('[data-grv-risk-score]').forEach(function(sel) {
    sel.addEventListener('change', function() { grvRecalcRiskSection_(root); });
  });
  grvRecalcRiskSection_(root);
}

/** Normalize row after API read — fill computed fields for display/export. */
export function grvNormalizeRiskRow_(row) {
  if (!row || typeof row !== 'object') return row;
  const total = grvRiskTotalFromRow_(row);
  if (total > 0) row['Total Score'] = String(total);
  const risk = grvRiskClassFromRow_(row);
  if (risk) row['Risk Classification'] = risk;
  GRV_RISK_SCORE_FIELDS.forEach(function(field) {
    const v = grvRiskFieldValue_(row, field);
    if (v) row[field] = v;
  });
  return row;
}
