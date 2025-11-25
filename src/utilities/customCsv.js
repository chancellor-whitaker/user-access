export default async function csv(url, row = undefined, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    const json = await response.json();
    return row ? json.map(row) : json;
  }

  const text = await response.text();
  return parseCSV(text, row);
}

// Properly splits CSV lines while handling quoted fields
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && line[i + 1] === '"') {
      // Handle escaped quotes ("" -> ")
      current += '"';
      i++;
    } else if (char === '"') {
      // Toggle quoted field mode
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = "";
    } else {
      // Regular character
      current += char;
    }
  }
  values.push(current.trim()); // Add last field
  return values;
}

function parseCSV(text, row) {
  const lines = text.trim().split("\n");
  const headers = parseCSVLine(lines.shift());

  const data = lines.map((line) => {
    const values = parseCSVLine(line);
    const obj = Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
    return row ? row(obj, values) : obj;
  });

  return data;
}
