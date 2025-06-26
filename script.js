function processText() {
  const text = document.getElementById("inputText").value;
  const decode = document.getElementById("decodeMode").checked;
  const container = document.getElementById("outputArea");
  container.innerHTML = "";

  if (!decode) return renderEncode(text, container);

  const detected = detectEncodingType(text);
  if (!detected) {
    container.innerHTML = `<div class="category-box"><div class="category-title">Tidak bisa deteksi tipe encoding</div></div>`;
    return;
  }

  const decoders = {
    Base64: { "Base64 → Text": tryDecode(() => atob(text)) },
    Hex: { "Hex → Text": tryDecode(() => hexDecode(text)) },
    Binary: { "Binary → Text": tryDecode(() => binaryDecode(text)) },
    Unicode: { "Unicode → Text": tryDecode(() => unicodeUnescape(text)) },
    HTML: { "HTML → Text": tryDecode(() => htmlDecode(text)) },
    URL: {
      "URL → Text": tryDecode(() => decodeURIComponent(text)),
      "Double URL Decode": tryDecode(() =>
        decodeURIComponent(decodeURIComponent(text))
      ),
      "Triple URL Decode": tryDecode(() =>
        decodeURIComponent(decodeURIComponent(decodeURIComponent(text)))
      ),
    },
  };

  const groupDiv = document.createElement("div");
  groupDiv.className = "category-box";

  const title = document.createElement("div");
  title.className = "category-title";
  title.innerText = `Detected: ${detected}`;

  const grid = document.createElement("div");
  grid.className = "output-grid";

  for (const [label, result] of Object.entries(decoders[detected])) {
    const box = document.createElement("div");
    box.className = "output-box";
    box.innerHTML = `
          <span>${label}</span>
          <button class="copy-btn" onclick="copyToClipboard(\`${escapeBackticks(
            result
          )}\`)">Copy</button>
          ${result}`;
    grid.appendChild(box);
  }

  groupDiv.appendChild(title);
  groupDiv.appendChild(grid);
  container.appendChild(groupDiv);
}

function renderEncode(text, container) {
  const groups = [
    {
      title: "Encoding / Decoding",
      data: {
        Base64: btoa(text),
        "URL Encode": encodeURIComponent(text),
        "Full URL Encode": [...text]
          .map((c) => `%${c.charCodeAt(0).toString(16)}`)
          .join(""),
        "Unicode Escape": [...text]
          .map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))
          .join(""),
        "HTML Encode": [...text].map((c) => `&#${c.charCodeAt(0)};`).join(""),
        Hex: [...text]
          .map((c) => "\\x" + c.charCodeAt(0).toString(16))
          .join(""),
        Binary: [...text]
          .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
          .join(" "),
      },
    },
    {
      title: "String Transforms",
      data: {
        Reverse: text.split("").reverse().join(""),
        Uppercase: text.toUpperCase(),
        Lowercase: text.toLowerCase(),
      },
    },
    {
      title: "Multi-Encode",
      data: {
        "Double Encode (URL)": encodeURIComponent(encodeURIComponent(text)),
        "Triple Encode (URL)": encodeURIComponent(
          encodeURIComponent(encodeURIComponent(text))
        ),
      },
    },
  ];

  groups.forEach((group) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "category-box";

    const title = document.createElement("div");
    title.className = "category-title";
    title.innerText = group.title;

    const grid = document.createElement("div");
    grid.className = "output-grid";

    for (const [label, result] of Object.entries(group.data)) {
      const box = document.createElement("div");
      box.className = "output-box";
      box.innerHTML = `
            <span>${label}</span>
            <button class="copy-btn" onclick="copyToClipboard(\`${escapeBackticks(
              result
            )}\`)">Copy</button>
            ${result}`;
      grid.appendChild(box);
    }

    groupDiv.appendChild(title);
    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
  });
}

// === DETEKSI ENCODING ===

function detectEncodingType(input) {
  if (isLikelyBase64(input)) return "Base64";
  if (/^(\\x)?([0-9a-fA-F]{2})+$/.test(input.replace(/\\x/g, ""))) return "Hex";
  if (/^([01]{8}\s?)+$/.test(input.trim())) return "Binary";
  if (/\\u[0-9a-fA-F]{4}/.test(input)) return "Unicode";
  if (/&#\d+;/.test(input)) return "HTML";
  if (/%[0-9a-fA-F]{2}/.test(input)) return "URL";
  return null;
}

function isLikelyBase64(str) {
  try {
    const decoded = atob(str);
    return /^[\x00-\x7F]*$/.test(decoded);
  } catch {
    return false;
  }
}

// === UTILITAS ===

function tryDecode(fn) {
  try {
    return fn();
  } catch {
    return "[Invalid]";
  }
}

function unicodeUnescape(str) {
  return str.replace(/\\u([\dA-Fa-f]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function hexDecode(str) {
  return str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function binaryDecode(str) {
  return str
    .split(" ")
    .map((b) => String.fromCharCode(parseInt(b, 2)))
    .join("");
}

function htmlDecode(str) {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

function escapeBackticks(str) {
  return String(str).replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => {
      alert("Copied to clipboard!");
    },
    () => {
      alert("Failed to copy!");
    }
  );
}
