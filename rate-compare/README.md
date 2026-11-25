# RateCompare

A static website that compares **savings account** and **term deposit** rates across banks.

All bank names and rates are currently **fictional sample data**.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
cd rate-compare
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Features

- **Savings accounts**: rate with or without bonus conditions, balance caps, minimum balance, fees, and estimated yearly interest for your balance.
- **Term deposits**: pick a term and an amount to see the rate, interest earned and total at maturity. Products you can't use (below the minimum or above the maximum deposit) are flagged.
- **Rate table by term**: a grid of every bank and term, with the best rate in each column highlighted.
- Sortable columns, search, a "Best" badge, light/dark mode, works on phones.

## Adding real data

Edit **`data/rates.js`** only. The schema is documented at the top of the file:

| Section        | Fields |
|----------------|--------|
| `banks`        | `id`, `name`, `color` |
| `savings`      | `bankId`, `product`, `baseRate`, `bonusRate`, `bonusConditions`, `minBalance`, `maxBalance`, `rateAboveMax`, `monthlyFee` |
| `termDeposits` | `bankId`, `product`, `minDeposit`, `maxDeposit`, `interestPaid`, `rates` (`{ months: rate }`) |

Rates are annual percentages (`4.85` = 4.85% p.a.). Also set `lastUpdated`, `currency` and `locale`.
The term buttons are built automatically from the terms that appear in the data.
