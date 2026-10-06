// --- String Pattern Matching Algorithms ---

// 1. Knuth-Morris-Pratt (KMP)
function computeLPS(pattern) {
  const lps = new Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i].toLowerCase() === pattern[len].toLowerCase()) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
}

function searchKMP(text, pattern) {
  if (!pattern || !text) return { matches: [], trace: "" };
  const matches = [];
  const lps = computeLPS(pattern);
  let i = 0, j = 0;

  while (i < text.length) {
    if (pattern[j].toLowerCase() === text[i].toLowerCase()) {
      i++;
      j++;
    }
    if (j === pattern.length) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && pattern[j].toLowerCase() !== text[i].toLowerCase()) {
      if (j !== 0) j = lps[j - 1];
      else i++;
    }
  }
  return { matches, trace: `LPS Array: [${lps.join(", ")}]` };
}

// 2. Z-Algorithm
function searchZ(text, pattern) {
  if (!pattern || !text) return { matches: [], trace: "" };
  const concat = pattern + "$" + text;
  const n = concat.length;
  const Z = new Array(n).fill(0);
  let l = 0, r = 0;

  for (let i = 1; i < n; i++) {
    if (i <= r) Z[i] = Math.min(r - i + 1, Z[i - l]);
    while (
      i + Z[i] < n &&
      concat[Z[i]].toLowerCase() === concat[i + Z[i]].toLowerCase()
    ) {
      Z[i]++;
    }
    if (i + Z[i] - 1 > r) {
      l = i;
      r = i + Z[i] - 1;
    }
  }

  const matches = [];
  const pLen = pattern.length;
  for (let i = pLen + 1; i < n; i++) {
    if (Z[i] === pLen) matches.push(i - pLen - 1);
  }
  return { matches, trace: `Z-Array Sample: [${Z.slice(0, Math.min(n, 20)).join(", ")}...]` };
}

// 3. Rabin-Karp Algorithm
function searchRabinKarp(text, pattern) {
  if (!pattern || !text || pattern.length > text.length) return { matches: [], trace: "" };
  const matches = [];
  const d = 256;
  const q = 101; // Prime modulus
  const m = pattern.length;
  const n = text.length;
  let p = 0, t = 0, h = 1;

  for (let i = 0; i < m - 1; i++) h = (h * d) % q;

  for (let i = 0; i < m; i++) {
    p = (d * p + pattern.charCodeAt(i).toLowerCase()) % q;
    t = (d * t + text.charCodeAt(i).toLowerCase()) % q;
  }

  for (let i = 0; i <= n - m; i++) {
    if (p === t) {
      let match = true;
      for (let j = 0; j < m; j++) {
        if (text[i + j].toLowerCase() !== pattern[j].toLowerCase()) {
          match = false;
          break;
        }
      }
      if (match) matches.push(i);
    }
    if (i < n - m) {
      t = (d * (t - text.charCodeAt(i).toLowerCase() * h) + text.charCodeAt(i + m).toLowerCase()) % q;
      if (t < 0) t = t + q;
    }
  }
  return { matches, trace: `Rolling Hash Modulo: ${q} | Pattern Hash: ${p}` };
}

// 4. Suffix Array Binary Search
function buildSuffixArray(text) {
  const suffixes = [];
  for (let i = 0; i < text.length; i++) {
    suffixes.push({ index: i, str: text.substring(i).toLowerCase() });
  }
  suffixes.sort((a, b) => a.str.localeCompare(b.str));
  return suffixes.map((s) => s.index);
}

function searchSuffixArray(text, pattern) {
  if (!pattern || !text) return { matches: [], trace: "" };
  const sa = buildSuffixArray(text);
  const matches = [];
  const p = pattern.toLowerCase();
  const m = pattern.length;

  for (let idx of sa) {
    if (text.substring(idx, idx + m).toLowerCase() === p) {
      matches.push(idx);
    }
  }
  matches.sort((a, b) => a - b);
  return { matches, trace: `Suffix Array Indexes (First 8): [${sa.slice(0, 8).join(", ")}]` };
}

// --- Document Analytics & Engine Controller ---
function computeAnalytics(text) {
  const words = text.trim().match(/\b[a-zA-Z0-9_-]+\b/g) || [];
  const charCount = text.length;
  const wordCount = words.length;

  const freqMap = {};
  for (let w of words) {
    const clean = w.toLowerCase();
    freqMap[clean] = (freqMap[clean] || 0) + 1;
  }

  const sortedFreq = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { charCount, wordCount, sortedFreq };
}

function highlightMatches(text, ranges) {
  if (!ranges.length) return escapeHtml(text);
  ranges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const cur = ranges[i];
    const prev = merged[merged.length - 1];
    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push(cur);
    }
  }

  let out = "";
  let lastIdx = 0;
  for (let r of merged) {
    out += escapeHtml(text.substring(lastIdx, r.start));
    out += `<mark>${escapeHtml(text.substring(r.start, r.end))}</mark>`;
    lastIdx = r.end;
  }
  out += escapeHtml(text.substring(lastIdx));
  return out;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

// --- DOM Event Listeners ---
document.getElementById("runBtn").addEventListener("click", () => {
  const text = document.getElementById("documentText").value;
  const rawPatterns = document.getElementById("searchPattern").value;
  const algo = document.getElementById("algoSelect").value;

  const patterns = rawPatterns.split(",").map((p) => p.trim()).filter((p) => p.length > 0);

  // Compute text statistics
  const analytics = computeAnalytics(text);
  document.getElementById("metricChars").textContent = analytics.charCount;
  document.getElementById("metricWords").textContent = analytics.wordCount;

  const freqListEl = document.getElementById("freqList");
  freqListEl.innerHTML = analytics.sortedFreq
    .map(([w, c]) => `<li><span>${escapeHtml(w)}</span><strong>${c}x</strong></li>`)
    .join("");

  // Run selected algorithm & measure performance
  const t0 = performance.now();
  const allRanges = [];
  const traceLogs = [];

  for (let pattern of patterns) {
    let res;
    if (algo === "kmp") res = searchKMP(text, pattern);
    else if (algo === "z") res = searchZ(text, pattern);
    else if (algo === "rabin-karp") res = searchRabinKarp(text, pattern);
    else if (algo === "suffix-array") res = searchSuffixArray(text, pattern);

    for (let idx of res.matches) {
      allRanges.push({ start: idx, end: idx + pattern.length });
    }
    traceLogs.push(`"${pattern}": ${res.matches.length} matches | ${res.trace}`);
  }
  const t1 = performance.now();

  // Update UI results
  document.getElementById("metricMatches").textContent = allRanges.length;
  document.getElementById("metricTime").textContent = `${(t1 - t0).toFixed(2)} ms`;
  document.getElementById("algoDetails").textContent = traceLogs.join(" \n ");
  document.getElementById("highlightedOutput").innerHTML = highlightMatches(text, allRanges);
});

// Trigger initial run on load
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("runBtn").click();
});