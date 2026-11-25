(function () {
  "use strict";

  const D = window.RATES_DATA;
  const $ = (s) => document.querySelector(s);
  const banks = Object.fromEntries(D.banks.map((b) => [b.id, b]));

  const money = new Intl.NumberFormat(D.locale, { style: "currency", currency: D.currency, maximumFractionDigits: 0 });
  const pct = (r) => (r == null ? "—" : r.toFixed(2) + "%");
  const curSymbol = money.formatToParts(0).find((p) => p.type === "currency").value;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const termLabel = (m) => (m < 12 ? m + " mo" : m % 12 === 0 ? m / 12 + " yr" + (m > 12 ? "s" : "") : m + " mo");
  const paidLabel = { maturity: "At maturity", monthly: "Monthly", annually: "Annually" };

  function bankCell(id) {
    const b = banks[id] || { name: id, color: "#888" };
    const initials = b.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return `<div class="bank"><span class="bank-dot" style="background:${esc(b.color)}">${esc(initials)}</span>${esc(b.name)}</div>`;
  }
  const num = (el) => Math.max(0, parseFloat(el.value) || 0);

  /* ---------- header ---------- */
  document.querySelectorAll(".cur").forEach((el) => (el.textContent = curSymbol));
  $("#bankCount").textContent = D.banks.length;
  $("#updated").textContent = "Rates updated " +
    new Date(D.lastUpdated + "T00:00:00").toLocaleDateString(D.locale, { day: "numeric", month: "short", year: "numeric" });

  /* ---------- sorting helper ---------- */
  function makeSorter(table, initialKey, onChange) {
    const state = { key: initialKey, dir: -1 };
    table.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.dataset.sort;
        if (state.key === k) state.dir *= -1;
        else { state.key = k; state.dir = ["bank", "product", "interestPaid", "minBalance", "minDeposit"].includes(k) ? 1 : -1; }
        table.querySelectorAll("th").forEach((h) => h.classList.remove("sorted", "asc", "desc"));
        th.classList.add("sorted", state.dir === 1 ? "asc" : "desc");
        onChange();
      });
    });
    state.sort = (rows) => rows.sort((a, b) => {
      const x = a[state.key], y = b[state.key];
      if (typeof x === "string") return x.localeCompare(y) * state.dir;
      return ((x ?? -Infinity) - (y ?? -Infinity)) * state.dir;
    });
    return state;
  }

  /* ---------- savings ---------- */
  function savingsInterest(p, amount, withBonus) {
    const rate = p.baseRate + (withBonus ? p.bonusRate : 0);
    const capped = p.maxBalance != null && amount > p.maxBalance;
    const inBand = capped ? p.maxBalance : amount;
    const above = capped ? amount - p.maxBalance : 0;
    const grow = (bal, r) => bal * (Math.pow(1 + r / 100 / 12, 12) - 1);
    return grow(inBand, rate) + grow(above, p.rateAboveMax ?? p.baseRate);
  }

  const svTable = $("#svTable");
  const svSort = makeSorter(svTable, "effective", renderSavings);

  function renderSavings() {
    const amount = num($("#svAmount"));
    const withBonus = $("#svBonus").checked;
    const hideIneligible = $("#svEligible").checked;
    const q = $("#svSearch").value.trim().toLowerCase();

    let rows = D.savings.map((p) => ({
      ...p,
      bank: banks[p.bankId]?.name || p.bankId,
      effective: p.baseRate + (withBonus ? p.bonusRate : 0),
      earn: savingsInterest(p, amount, withBonus) - p.monthlyFee * 12,
      eligible: amount >= p.minBalance
    }));
    if (q) rows = rows.filter((r) => (r.bank + " " + r.product).toLowerCase().includes(q));
    if (hideIneligible) rows = rows.filter((r) => r.eligible);
    svSort.sort(rows);

    const bestEarn = Math.max(...rows.filter((r) => r.eligible).map((r) => r.earn));
    svTable.tBodies[0].innerHTML = rows.length ? rows.map((r) => {
      const best = r.eligible && r.earn === bestEarn;
      const notes = [];
      if (r.bonusConditions) notes.push(esc(r.bonusConditions));
      if (r.maxBalance != null) notes.push(`Rate applies up to ${money.format(r.maxBalance)}`);
      if (r.monthlyFee) notes.push(`${money.format(r.monthlyFee)} monthly fee`);
      return `<tr class="${best ? "best-row" : ""} ${r.eligible ? "" : "ineligible"}">
        <td>${bankCell(r.bankId)}</td>
        <td class="prod">${esc(r.product)}${best ? '<span class="badge">Best</span>' : ""}${r.eligible ? "" : '<span class="badge warn">Below min</span>'}</td>
        <td class="num rate">${pct(r.effective)}</td>
        <td class="num">${pct(r.baseRate)}</td>
        <td class="num">${r.bonusRate ? "+" + pct(r.bonusRate) : "—"}</td>
        <td class="cond">${notes.join(" · ") || "No conditions"}</td>
        <td class="num">${r.minBalance ? money.format(r.minBalance) : "None"}</td>
        <td class="num"><strong>${money.format(r.earn)}</strong></td>
      </tr>`;
    }).join("") : '<tr><td colspan="8" class="empty">No accounts match your filters.</td></tr>';
  }

  ["#svAmount", "#svSearch", "#svBonus", "#svEligible"].forEach((s) => $(s).addEventListener("input", renderSavings));

  /* ---------- term deposits ---------- */
  const allTerms = [...new Set(D.termDeposits.flatMap((t) => Object.keys(t.rates).map(Number)))].sort((a, b) => a - b);
  let selectedTerm = allTerms.includes(12) ? 12 : allTerms[0];

  $("#tdTerms").innerHTML = allTerms.map((m) =>
    `<button class="chip" role="radio" aria-checked="${m === selectedTerm}" data-term="${m}">${termLabel(m)}</button>`).join("");
  $("#tdTerms").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    selectedTerm = Number(btn.dataset.term);
    $("#tdTerms").querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-checked", c === btn));
    renderTD();
  });

  const tdTable = $("#tdTable");
  const tdSort = makeSorter(tdTable, "rate", renderTD);

  function renderTD() {
    const amount = num($("#tdAmount"));
    const paid = $("#tdPaid").value;
    let rows = D.termDeposits
      .filter((t) => t.rates[selectedTerm] != null && (!paid || t.interestPaid === paid))
      .map((t) => {
        const rate = t.rates[selectedTerm];
        const earn = amount * (rate / 100) * (selectedTerm / 12);
        return {
          ...t, rate, earn, total: amount + earn,
          bank: banks[t.bankId]?.name || t.bankId,
          eligible: amount >= t.minDeposit && (t.maxDeposit == null || amount <= t.maxDeposit)
        };
      });
    tdSort.sort(rows);
    const bestRate = Math.max(...rows.filter((r) => r.eligible).map((r) => r.rate));

    tdTable.tBodies[0].innerHTML = rows.length ? rows.map((r) => {
      const best = r.eligible && r.rate === bestRate;
      const flag = r.eligible ? "" : amount < r.minDeposit ? '<span class="badge warn">Below min</span>' : '<span class="badge warn">Above max</span>';
      return `<tr class="${best ? "best-row" : ""} ${r.eligible ? "" : "ineligible"}">
        <td>${bankCell(r.bankId)}</td>
        <td class="prod">${esc(r.product)}${best ? '<span class="badge">Best</span>' : ""}${flag}</td>
        <td class="num rate">${pct(r.rate)}</td>
        <td><span class="tag">${paidLabel[r.interestPaid] || esc(r.interestPaid)}</span></td>
        <td class="num">${money.format(r.minDeposit)}</td>
        <td class="num"><strong>${money.format(r.earn)}</strong></td>
        <td class="num">${money.format(r.total)}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="7" class="empty">No term deposits for ${termLabel(selectedTerm)} match your filters.</td></tr>`;
  }

  ["#tdAmount", "#tdPaid"].forEach((s) => $(s).addEventListener("input", renderTD));

  /* ---------- matrix ---------- */
  function renderMatrix() {
    const t = $("#mxTable");
    const colMax = {}, colMin = {};
    allTerms.forEach((m) => {
      const vals = D.termDeposits.map((d) => d.rates[m]).filter((v) => v != null);
      colMax[m] = Math.max(...vals); colMin[m] = Math.min(...vals);
    });
    t.tHead.innerHTML = `<tr><th>Bank</th>${allTerms.map((m) => `<th class="num">${termLabel(m)}</th>`).join("")}</tr>`;
    t.tBodies[0].innerHTML = D.termDeposits.map((d) => `<tr>
      <td>${bankCell(d.bankId)}</td>
      ${allTerms.map((m) => {
        const v = d.rates[m];
        if (v == null) return '<td class="num na">—</td>';
        const span = colMax[m] - colMin[m];
        const a = span ? 0.06 + 0.32 * ((v - colMin[m]) / span) : 0.2;
        const best = v === colMax[m];
        return `<td class="num ${best ? "best-cell" : ""}" style="${best ? "" : `background: rgba(var(--heat), ${a.toFixed(2)})`}">${pct(v)}</td>`;
      }).join("")}
    </tr>`).join("");
  }

  /* ---------- highlights ---------- */
  function renderHighlights() {
    const sv = D.savings.map((p) => ({ ...p, total: p.baseRate + p.bonusRate })).sort((a, b) => b.total - a.total)[0];
    const svNo = D.savings.filter((p) => !p.bonusRate).sort((a, b) => b.baseRate - a.baseRate)[0];
    const cards = [
      { label: "Top savings rate", value: pct(sv.total), sub: `${banks[sv.bankId].name} · ${sv.product}${sv.bonusRate ? " (with bonus)" : ""}` },
      svNo && { label: "Top no-conditions savings", value: pct(svNo.baseRate), sub: `${banks[svNo.bankId].name} · ${svNo.product}` }
    ];
    [6, 12].filter((m) => allTerms.includes(m)).forEach((m) => {
      const top = D.termDeposits.filter((d) => d.rates[m] != null).sort((a, b) => b.rates[m] - a.rates[m])[0];
      cards.push({ label: `Top ${termLabel(m)} term deposit`, value: pct(top.rates[m]), sub: `${banks[top.bankId].name} · ${top.product}` });
    });
    $("#highlights").innerHTML = cards.filter(Boolean).map((c) =>
      `<div class="card"><div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${esc(c.sub)}</div></div>`).join("");
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", t === tab); });
    document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== "panel-" + tab.dataset.tab));
  }));

  renderHighlights();
  renderSavings();
  renderTD();
  renderMatrix();
})();
