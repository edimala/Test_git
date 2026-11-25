(function () {
  "use strict";

  const D = window.RATES_DATA;
  const NOTES = window.RATES_NOTES || [];
  const TAX = (D.withholdingTaxPct ?? 15) / 100;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- reference data ---------- */
  const META = window.BANK_META || {};
  const PALETTE = ["#c8102e", "#1d4ed8", "#0f766e", "#7c3aed", "#b45309", "#be185d", "#15803d", "#0369a1", "#9f1239", "#4d7c0f", "#6d28d9", "#a16207", "#334155"];
  const DEFAULT_AMOUNT = { ALL: 1000000, EUR: 10000, USD: 10000, GBP: 10000 };
  const CCY_ORDER = ["ALL", "EUR", "USD", "GBP"];

  const rows = D.rows.filter((r) => r.term_months != null && r.currency);
  const bankIds = [...new Set(D.rows.map((r) => r.bank_id))];
  const banks = {};
  bankIds.forEach((id, i) => {
    const full = D.rows.find((r) => r.bank_id === id).bank_name;
    const m = META[id] || {};
    banks[id] = { id, full, name: m.short || full, color: m.color || PALETTE[i % PALETTE.length], text: m.text || "#fff",
      initials: m.initials || full.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase(), logo: m.logo || null };
  });
  const currencies = CCY_ORDER.filter((c) => rows.some((r) => r.currency === c))
    .concat([...new Set(rows.map((r) => r.currency))].filter((c) => !CCY_ORDER.includes(c)));

  /* ---------- formatting ---------- */
  const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
  const money = (v, ccy) => ccy + " " + nf.format(Math.round(v));
  const pct = (r) => (r == null ? "—" : r.toFixed(2) + "%");
  const termLabel = (m) => (m % 12 === 0 ? m / 12 + (m === 12 ? " yr" : " yrs") : m + " mo");
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(s, withDay) {
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s || "");
    if (!m) return null;
    return (withDay && m[3] ? +m[3] + " " : "") + MONTHS[+m[2] - 1] + " " + m[1];
  }
  const sourceLabel = (t) => (/bulletin/i.test(t) ? "Bank bulletin" : /bank of albania/i.test(t) ? "Bank of Albania" : t ? t[0].toUpperCase() + t.slice(1) : "Source");
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : null);
  const paidLabel = (p) => (!p ? "—" : /varies/i.test(p) ? "Varies" : p[0].toUpperCase() + p.slice(1));

  function bankCell(id) {
    const b = banks[id];
    const icon = b.logo
      ? `<span class="bank-icon logo"><img src="${esc(b.logo)}" alt=""></span>`
      : `<span class="bank-icon" style="--bc:${esc(b.color)};--bt:${esc(b.text)}" data-len="${b.initials.length}">${esc(b.initials)}</span>`;
    return `<div class="bank" title="${esc(b.full)}">${icon}<span>${esc(b.name)}</span></div>`;
  }

  /* ---------- state ---------- */
  const state = { ccy: "ALL", amount: DEFAULT_AMOUNT.ALL, tax: "gross", category: "", paid: "", term: 12 };
  const shown = (r) => (r == null ? null : state.tax === "net" ? r * (1 - TAX) : r);

  /* ---------- core: one offer per product/term for the chosen amount ---------- */
  function offers(ccy, amount, term, opts = {}) {
    const category = opts.category ?? state.category;
    const paid = opts.paid ?? state.paid;
    const groups = new Map();
    for (const r of rows) {
      if (r.currency !== ccy || (term != null && r.term_months !== term)) continue;
      if (category === "standard" && r.category !== "standard") continue;
      if (category === "offer" && r.category === "standard") continue;
      if (paid && r.interest_payment !== paid) continue;
      const k = [r.bank_id, r.product, r.category, r.interest_payment, r.term_months, r.valid_until].join("|");
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    const out = [];
    for (const g of groups.values()) {
      const tiered = g.filter((r) => r.amount_tier);
      let row, status = "ok", rate, rateMax = null;
      if (tiered.length) {
        const lo = tiered.find((r) => /minimum/i.test(r.amount_tier));
        const hi = tiered.find((r) => /highest/i.test(r.amount_tier));
        row = lo || hi;
        rate = row.rate_pct;
        if (lo && hi && hi.rate_pct !== lo.rate_pct) rateMax = hi.rate_pct;
      } else {
        row = g.find((r) => (r.amount_min == null || amount >= r.amount_min) && (r.amount_max == null || amount <= r.amount_max));
        if (!row) {
          const byMin = [...g].sort((a, b) => (a.amount_min ?? 0) - (b.amount_min ?? 0));
          if (amount < (byMin[0].amount_min ?? 0)) { row = byMin[0]; status = "below"; }
          else { row = byMin[byMin.length - 1]; status = "above"; }
        }
        rate = row.rate_pct;
      }
      out.push({ row, status, tiered: !!tiered.length, rate, rateMax, bankId: row.bank_id, term: row.term_months });
    }
    return out;
  }
  const usable = (o) => o.status === "ok" && o.rate != null;

  /* ---------- controls ---------- */
  function chipGroup(el, items, current, onPick) {
    el.innerHTML = items.map(([v, label]) =>
      `<button class="chip" role="radio" aria-checked="${String(v) === String(current)}" data-v="${esc(v)}">${esc(label)}</button>`).join("");
    el.onclick = (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      el.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-checked", c === b));
      onPick(b.dataset.v);
    };
  }

  chipGroup($("#ccy"), currencies.map((c) => [c, c]), state.ccy, (v) => {
    state.ccy = v;
    state.amount = DEFAULT_AMOUNT[v] ?? 10000;
    $("#amount").value = state.amount;
    renderAll();
  });
  chipGroup($("#taxMode"), [["gross", "Gross"], ["net", `Net of ${Math.round(TAX * 100)}% tax`]], state.tax, (v) => { state.tax = v; renderAll(); });

  const paidOpts = [...new Set(rows.map((r) => r.interest_payment).filter(Boolean))].sort();
  $("#paid").insertAdjacentHTML("beforeend", paidOpts.map((p) => `<option value="${esc(p)}">${esc(paidLabel(p))}</option>`).join(""));
  $("#amount").value = state.amount;
  $("#amount").addEventListener("input", () => { state.amount = Math.max(0, parseFloat($("#amount").value) || 0); renderAll(); });
  $("#category").addEventListener("input", () => { state.category = $("#category").value; renderAll(); });
  $("#paid").addEventListener("input", () => { state.paid = $("#paid").value; renderAll(); });

  function renderTerms() {
    const terms = [...new Set(offers(state.ccy, state.amount, null).map((o) => o.term))].sort((a, b) => a - b);
    if (!terms.includes(state.term)) state.term = terms.includes(12) ? 12 : terms[0];
    chipGroup($("#terms"), terms.map((t) => [t, termLabel(t)]), state.term, (v) => { state.term = Number(v); renderCompare(); });
  }

  /* ---------- sorting ---------- */
  const sort = { key: "rate", dir: -1 };
  const tdTable = $("#tdTable");
  tdTable.querySelectorAll("th[data-sort]").forEach((th) => th.addEventListener("click", () => {
    const k = th.dataset.sort;
    if (sort.key === k) sort.dir *= -1; else { sort.key = k; sort.dir = ["bank", "product", "payment", "amin"].includes(k) ? 1 : -1; }
    tdTable.querySelectorAll("th").forEach((h) => h.classList.remove("sorted", "asc", "desc"));
    th.classList.add("sorted", sort.dir === 1 ? "asc" : "desc");
    renderCompare();
  }));

  /* ---------- compare table ---------- */
  function bandText(o) {
    const r = o.row, c = state.ccy;
    if (o.tiered) return '<span class="muted">Varies by amount</span>';
    if (r.amount_min != null && r.amount_max != null) return `${nf.format(r.amount_min)} – ${nf.format(r.amount_max)}`;
    if (r.amount_min != null) return `From ${nf.format(r.amount_min)}`;
    if (r.amount_max != null) return `Up to ${nf.format(r.amount_max)}`;
    return '<span class="muted">Any amount</span>';
  }

  function renderCompare() {
    const amount = state.amount;
    const list = offers(state.ccy, amount, state.term).map((o) => {
      const r = shown(o.rate);
      return {
        ...o, shownRate: r, shownMax: shown(o.rateMax),
        bank: banks[o.bankId].name, product: o.row.product, payment: o.row.interest_payment || "",
        amin: o.row.amount_min ?? 0, sourceDate: o.row.source_date || "",
        earn: r == null ? null : amount * (r / 100) * (state.term / 12)
      };
    });
    list.sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      if (typeof x === "string" || typeof y === "string") return String(x).localeCompare(String(y)) * sort.dir;
      // unusable offers always sink to the bottom when sorting by rate/earnings
      if (sort.key === "rate" || sort.key === "earn") {
        const ua = usable(a), ub = usable(b);
        if (ua !== ub) return ua ? -1 : 1;
      }
      return ((x ?? -Infinity) - (y ?? -Infinity)) * sort.dir;
    });
    const best = Math.max(...list.filter(usable).map((o) => o.shownRate));

    tdTable.tBodies[0].innerHTML = list.length ? list.map((o) => {
      const r = o.row;
      const isBest = usable(o) && o.shownRate === best;
      const badges = [];
      if (isBest) badges.push('<span class="badge">Best</span>');
      if (r.category !== "standard") badges.push(`<span class="badge offer">${r.category === "promo" ? "Offer" : "Special"}</span>`);
      if (r.valid_until) badges.push(`<span class="badge warn">Ends ${esc(fmtDate(r.valid_until, true) || r.valid_until)}</span>`);
      if (o.status === "below") badges.push(`<span class="badge warn">Min ${esc(nf.format(r.amount_min))}</span>`);
      if (o.status === "above") badges.push(`<span class="badge warn">Above max</span>`);
      const rateHtml = o.shownRate == null ? '<span class="muted">Negotiable</span>'
        : pct(o.shownRate) + (o.shownMax != null ? `<div class="sub">up to ${pct(o.shownMax)}</div>` : "");
      const noteText = [r.notes, o.tiered ? "Bank of Albania lists only the lowest and highest amount band" : ""].filter(Boolean).join(" · ");
      const url = safeUrl(r.source_url);
      const src = `${esc(sourceLabel(r.source_type))}<div class="sub">${esc(fmtDate(r.source_date) || "Undated")}</div>`;
      return `<tr class="${isBest ? "best-row" : ""} ${o.status === "ok" ? "" : "ineligible"}">
        <td>${bankCell(o.bankId)}</td>
        <td class="prod">${esc(r.product)}<div class="badges">${badges.join("")}</div>${noteText ? `<div class="note-line">${esc(noteText)}</div>` : ""}</td>
        <td class="num rate">${rateHtml}</td>
        <td class="num"><strong>${o.earn == null ? "—" : money(o.earn, state.ccy)}</strong>${o.tiered && o.shownMax != null ? '<div class="sub">at the lowest rate</div>' : ""}</td>
        <td><span class="tag" title="${esc(r.interest_payment)}">${esc(paidLabel(r.interest_payment))}</span></td>
        <td class="num">${bandText(o)}</td>
        <td class="src">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${src}</a>` : src}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="7" class="empty">No ${esc(state.ccy)} deposits for ${termLabel(state.term)} match your filters.</td></tr>`;
  }

  /* ---------- matrix ---------- */
  function renderMatrix() {
    const all = offers(state.ccy, state.amount, null).filter(usable);
    const terms = [...new Set(all.map((o) => o.term))].sort((a, b) => a - b);
    const ids = bankIds.filter((id) => all.some((o) => o.bankId === id));
    const cell = {};
    for (const o of all) {
      const k = o.bankId + "|" + o.term;
      if (!cell[k] || o.rate > cell[k].rate) cell[k] = o;
    }
    const colMax = {}, colMin = {};
    terms.forEach((t) => {
      const v = ids.map((id) => cell[id + "|" + t]?.rate).filter((x) => x != null);
      colMax[t] = Math.max(...v); colMin[t] = Math.min(...v);
    });
    const t = $("#mxTable");
    t.tHead.innerHTML = `<tr><th>Bank</th>${terms.map((m) => `<th class="num">${termLabel(m)}</th>`).join("")}</tr>`;
    t.tBodies[0].innerHTML = ids.length ? ids.map((id) => `<tr><td>${bankCell(id)}</td>${terms.map((m) => {
      const o = cell[id + "|" + m];
      if (!o) return '<td class="num na">—</td>';
      const span = colMax[m] - colMin[m];
      const a = span ? 0.05 + 0.33 * ((o.rate - colMin[m]) / span) : 0.15;
      const isBest = o.rate === colMax[m];
      const tip = `${o.row.product}${o.row.category !== "standard" ? " (" + o.row.category + ")" : ""}`;
      return `<td class="num ${isBest ? "best-cell" : ""}" title="${esc(tip)}" style="${isBest ? "" : `background: rgba(var(--heat), ${a.toFixed(2)})`}">${pct(shown(o.rate))}${o.row.category !== "standard" ? "<sup>*</sup>" : ""}</td>`;
    }).join("")}</tr>`).join("")
      : `<tr><td class="empty">No ${esc(state.ccy)} deposits match your filters at this amount.</td></tr>`;
  }

  /* ---------- highlights ---------- */
  function renderHighlights() {
    const cards = currencies.slice(0, 3).map((c) => {
      const amt = DEFAULT_AMOUNT[c] ?? 10000;
      const top = offers(c, amt, 12, { category: "", paid: "" }).filter(usable).sort((a, b) => b.rate - a.rate)[0];
      if (!top) return "";
      return `<button class="card" data-ccy="${esc(c)}">
        <div class="label">Best 1-year rate · ${esc(c)}</div>
        <div class="value">${pct(shown(top.rate))}</div>
        <div class="sub">${esc(banks[top.bankId].name)} · ${esc(top.row.product)}</div>
        <div class="sub">For ${esc(money(amt, c))}${top.row.category !== "standard" ? " · offer" : ""}</div>
      </button>`;
    });
    cards.push(`<div class="card info">
      <div class="label">Deposit insurance</div>
      <div class="value">ALL ${nf.format(D.insuranceLimitALL || 2500000)}</div>
      <div class="sub">Insured by ASD per depositor, per bank</div>
    </div>`);
    $("#highlights").innerHTML = cards.join("");
    $("#highlights").querySelectorAll("button.card").forEach((b) => b.addEventListener("click", () => {
      $(`#ccy .chip[data-v="${b.dataset.ccy}"]`).click();
      state.term = 12; renderAll();
      document.querySelector('.tab[data-tab="compare"]').click();
    }));
  }

  /* ---------- notes ---------- */
  function renderNotes() {
    const hidden = D.rows.filter((r) => r.term_months == null);
    const extra = hidden.map((r) => [`Not in tables: ${banks[r.bank_id].name}`, [r.product !== "—" ? r.product : "", r.notes].filter(Boolean).join(" — ")]);
    $("#notes").innerHTML = NOTES.concat(extra).map(([k, v]) =>
      `<div class="note ${/^gap/i.test(k) ? "gap" : /expir/i.test(k) ? "exp" : ""}"><div class="note-k">${esc(k)}</div><div class="note-v">${esc(v)}</div></div>`).join("");
  }

  function renderInsurance() {
    const lim = D.insuranceLimitALL || 2500000;
    const over = state.ccy === "ALL" && state.amount > lim;
    $("#insure").hidden = !over;
    if (over) $("#insure").textContent = `ASD insures up to ALL ${nf.format(lim)} per bank. Consider splitting larger amounts across banks.`;
  }

  /* ---------- header & tabs ---------- */
  $("#bankCount").textContent = new Set(rows.map((r) => r.bank_id)).size;
  $("#updated").textContent = "Rates retrieved " + (fmtDate(D.retrieved, true) || D.retrieved);
  $("#disclaimer").textContent =
    `Rates are gross nominal annual rates unless "Net of ${Math.round(TAX * 100)}% tax" is selected. Interest earned is simple interest ` +
    `over the term, before any compounding or fees. Where only the Bank of Albania comparison table is available, the exact amount ` +
    `bands are not published, so earnings use the rate at the minimum amount. Offers marked * in the rate table are promotional. ` +
    `Always confirm with the bank before you deposit.`;

  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", t === tab); });
    document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== "panel-" + tab.dataset.tab));
  }));

  function renderAll() {
    $("#ccyLabel").textContent = state.ccy;
    renderInsurance();
    renderHighlights();
    renderTerms();
    renderCompare();
    renderMatrix();
  }
  renderNotes();
  renderAll();
})();
