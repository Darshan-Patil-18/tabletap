// OCR text parser for menu scanning - Enhanced version

function cleanPrice(str) {
  return parseFloat(str.replace(/[^\d.]/g, '')) || 0;
}

function isAllCaps(str) {
  const letters = str.replace(/[^a-zA-Z]/g, '');
  return letters.length > 0 && letters === letters.toUpperCase();
}

// More robust price extractor - handles Rs, Rs., ₹, plain numbers on right side
function extractPrices(line) {
  // Match: optional currency symbol + number  e.g. ₹250, Rs.150, 250
  const matches = [...line.matchAll(/(?:Rs\.?\s*|₹\s*)?(\d{1,6}(?:\.\d{1,2})?)\s*(?:\/?\s*(?:Rs\.?\s*|₹\s*)?(\d{1,6}(?:\.\d{1,2})?))?/g)];
  const prices = [];
  for (const m of matches) {
    const p = parseFloat(m[1]);
    if (p > 0 && p < 100000) prices.push(p);
    if (m[2]) {
      const p2 = parseFloat(m[2]);
      if (p2 > 0 && p2 < 100000 && p2 !== p) prices.push(p2);
    }
  }
  return [...new Set(prices)];
}

// Detect "Name   Price" on same line — name on left, price on far right
// e.g. "Butter Chicken    280" or "Paneer Tikka....180" or "Garlic Naan 60"
function parseSameLine(line) {
  // Pattern: text, then optional dots/spaces, then price at end
  // Handles: "Butter Chicken 280", "Butter Chicken...280", "Butter Chicken  Rs 280"
  const match = line.match(/^(.+?)\s*[.\-_\s]{0,30}(?:Rs\.?\s*|₹\s*)?(\d{2,5}(?:\.\d{1,2})?)\s*(?:\/\-|\/)?$/);
  if (match) {
    const name = cleanItemName(match[1]);
    const price = parseFloat(match[2]);
    if (name.length >= 2 && price >= 5 && price < 100000) {
      return { name, price };
    }
  }
  // Also handle "Name  half/full  price1  price2" pattern
  const twoPrice = line.match(/^(.+?)\s+(?:Rs\.?\s*|₹\s*)?(\d{2,5})\s*[/\s]\s*(?:Rs\.?\s*|₹\s*)?(\d{2,5})\s*$/);
  if (twoPrice) {
    const name = cleanItemName(twoPrice[1]);
    const p1 = parseFloat(twoPrice[2]);
    const p2 = parseFloat(twoPrice[3]);
    if (name.length >= 2 && p1 >= 5 && p2 >= 5) {
      return { name, price: Math.max(p1, p2), halfPrice: Math.min(p1, p2) };
    }
  }
  return null;
}

function cleanItemName(name) {
  return name
    .replace(/^[-•*#|]+/, '')
    .replace(/[-•*#|]+$/, '')
    .replace(/(?:Rs\.?|₹)\s*\d+(?:\.\d+)?/g, '')
    .replace(/\d{2,}(?:\.\d+)?/g, '')
    .replace(/[^\w\s()\/,-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isCategoryCandidate(line, idx, lines) {
  const cleaned = cleanItemName(line);
  if (!cleaned || cleaned.length < 2) return false;
  const prices = extractPrices(line);
  if (prices.length > 0) return false;
  // All-caps headers like "STARTERS", "MAIN COURSE"
  if (isAllCaps(cleaned) && cleaned.length > 2) return true;
  // Short line (≤ 28 chars) with no price followed by lines with prices
  if (cleaned.length <= 28) {
    const nextFew = lines.slice(idx + 1, idx + 4);
    const nextHasPrices = nextFew.some(nl => parseSameLine(nl) || extractPrices(nl).length > 0);
    if (nextHasPrices) return true;
  }
  return false;
}

export function parseOCRText(text) {
  // Pre-process: split lines and normalize
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const lines = [];

  // First pass: try to combine/split lines
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    lines.push(line);
  }

  const categories = [];
  let currentCat = { title: 'Other', items: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isCategoryCandidate(line, i, lines)) {
      if (currentCat.items.length > 0 || currentCat.title !== 'Other') {
        categories.push(currentCat);
      }
      const title = cleanItemName(line) || line.trim();
      currentCat = { title, items: [] };
      continue;
    }

    // Try same-line parse first (most common menu format)
    const sameLine = parseSameLine(line);
    if (sameLine) {
      if (sameLine.halfPrice) {
        // Has half/full
        currentCat.items.push({ name: `${sameLine.name} (Half)`, price: sameLine.halfPrice });
        currentCat.items.push({ name: `${sameLine.name} (Full)`, price: sameLine.price });
      } else {
        currentCat.items.push({ name: sameLine.name, price: sameLine.price });
      }
      continue;
    }

    // Fallback: extract prices from line
    const prices = extractPrices(line);

    if (prices.length === 1) {
      const name = cleanItemName(line);
      if (name.length >= 2) {
        // Check if next line is price-only (name on one line, price on next)
        const nextLine = lines[i + 1] || '';
        const nextPrices = extractPrices(nextLine);
        const nextName = cleanItemName(nextLine);
        if (nextPrices.length === 0 && prices[0] >= 5) {
          currentCat.items.push({ name, price: prices[0] });
        } else if (nextPrices.length === 0 && prices[0] >= 5) {
          currentCat.items.push({ name, price: prices[0] });
        } else {
          currentCat.items.push({ name, price: prices[0] });
        }
      }
    } else if (prices.length >= 2) {
      const name = cleanItemName(line);
      if (name.length >= 2) {
        // Half/Full
        currentCat.items.push({ name: `${name} (Half)`, price: prices[0] });
        currentCat.items.push({ name: `${name} (Full)`, price: prices[1] });
      }
    } else {
      // No price on this line — might be item name, check next line for price
      const namePart = cleanItemName(line);
      if (namePart.length >= 3) {
        const nextLine = lines[i + 1] || '';
        const nextSameLine = parseSameLine(nextLine);
        const nextPrices = extractPrices(nextLine);
        if (!nextSameLine && nextPrices.length === 1 && nextPrices[0] >= 5) {
          const nextName = cleanItemName(nextLine);
          // If next line is ONLY a price (no name), combine with current
          if (nextName.length < 3) {
            currentCat.items.push({ name: namePart, price: nextPrices[0] });
            i++; // skip next line
          }
        }
      }
    }
  }

  if (currentCat.items.length > 0) {
    categories.push(currentCat);
  }

  // Filter empty, deduplicate items within categories
  return categories
    .filter(c => c.items.length > 0)
    .map(c => ({
      ...c,
      items: c.items.filter((item, idx, arr) =>
        idx === arr.findIndex(x => x.name.toLowerCase().trim() === item.name.toLowerCase().trim())
      ),
    }));
}

// Merge parsed categories into existing menu
export function mergeParsedIntoMenu(existingMenu, parsed) {
  const merged = existingMenu.map(c => ({ ...c, items: [...c.items] }));
  let added = 0, skipped = 0;

  for (const cat of parsed) {
    let existingCat = merged.find(c => c.title.toLowerCase().trim() === cat.title.toLowerCase().trim());
    if (!existingCat) {
      existingCat = { title: cat.title, items: [] };
      merged.push(existingCat);
    }
    for (const item of cat.items) {
      const isDupe = existingCat.items.some(
        ei => ei.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );
      if (isDupe) { skipped++; }
      else { existingCat.items.push({ ...item, id: Date.now() + Math.random() }); added++; }
    }
  }

  return { merged, added, skipped };
}
