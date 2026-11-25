/*
 * Bank icons. `color` / `text` style the badge. Colours approximate each bank's brand.
 * Logos live in assets/logos/ as 128x128 PNGs (downloaded from each bank's website, Nov 2026).
 * To replace one, overwrite the file or point `logo` at a new file. Set logo: null to use the coloured badge.
 */
window.BANK_META = {
  ABI:        { short: "ABI",                    initials: "ABI", color: "#1b3a6b", text: "#ffffff", logo: "assets/logos/abi.png" },
  BKT:        { short: "BKT",                    initials: "BKT", color: "#d71920", text: "#ffffff", logo: "assets/logos/bkt.png" },
  CREDINS:    { short: "Credins Bank",           initials: "CR",  color: "#00539f", text: "#ffffff", logo: "assets/logos/credins.png" },
  INTESA:     { short: "Intesa Sanpaolo",        initials: "ISP", color: "#009a44", text: "#ffffff", logo: "assets/logos/intesa.png" },
  PROCREDIT:  { short: "ProCredit Bank",         initials: "PC",  color: "#c4001a", text: "#ffffff", logo: "assets/logos/procredit.png" },
  UBA:        { short: "United Bank of Albania", initials: "UBA", color: "#003b71", text: "#ffffff", logo: "assets/logos/uba.png" },
  OTP:        { short: "OTP Bank",               initials: "OTP", color: "#52ae30", text: "#ffffff", logo: "assets/logos/otp.png" },
  TIRANA:     { short: "Tirana Bank",            initials: "TB",  color: "#1f4e9c", text: "#ffffff", logo: "assets/logos/tirana.png" },
  JET:        { short: "Jet Bank",               initials: "JET", color: "#ff5a00", text: "#ffffff", logo: "assets/logos/jet.png" },
  UNION:      { short: "Union Bank",             initials: "UB",  color: "#00467f", text: "#ffffff", logo: "assets/logos/union.png" },
  FIB:        { short: "Fibank",                 initials: "FIB", color: "#007a3d", text: "#ffffff", logo: "assets/logos/fib.png" },
  RAIFFEISEN: { short: "Raiffeisen Bank",        initials: "RB",  color: "#fee600", text: "#1a1a1a", logo: "assets/logos/raiffeisen.png" },
  ZIRAAT:     { short: "Ziraat Bank",            initials: "ZB",  color: "#e30a17", text: "#ffffff", logo: null }
};
