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

## Bank logos

Logos are 128×128 PNGs in `assets/logos/`, downloaded from each bank's website (Nov 2026); Tirana Bank uses its site icon.
`data/banks.js` maps each bank to its logo, short name and fallback badge colours. Set `logo: null` to show the coloured initials badge instead.

## Single-file version

`python3 tools/build_single_file.py out.html` bundles everything (CSS, data, logos) into one HTML file for publishing.
