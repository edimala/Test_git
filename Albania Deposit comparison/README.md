# Albanian Deposits Comparison

A static website that compares **term deposit** rates across Albanian banks, in ALL, EUR, USD and GBP.
The data comes from the "Albania Term Deposit Rates – Nov 2026" sheet (bank bulletins and the Bank of Albania comparison table).

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Features

- Pick currency, amount and term; the matching amount band is chosen for each product and interest earned is calculated.
- Gross rates or net of the 15% withholding tax.
- Filter standard deposits vs. offers/specials, and by how interest is paid. Offers show their end date.
- Rate table: best rate per bank for every term, with the best in each column outlined.
- Every row links to its source document. Deposit insurance (ASD, ALL 2,500,000) warning for larger ALL amounts.
- Data notes tab lists known gaps from the sheet.

## Updating the data

1. In the sheet, download the **Rates** tab as CSV.
2. Run `python3 tools/sheet_to_js.py Rates.csv` — this rewrites `data/rates.js`.
3. Edit `data/notes.js` if the "Notes & gaps" tab changed.

## Bank icons

Each bank gets a coloured badge defined in `data/banks.js` (short name, initials, colours).
To show a real logo, save it in `assets/logos/` (square, 64×64 px or larger) and set `logo: "assets/logos/<file>"` for that bank.

Columns used: `bank_id, bank_name, currency, term_months, rate_pct, amount_min, amount_max, amount_tier,
product, category, interest_payment, valid_until, notes, source_type, source_date, source_url`.
Rows without a term are listed in the Data notes tab instead of the tables.
