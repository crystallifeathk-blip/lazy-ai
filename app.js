const AVAILABLE_LANGUAGES = [
  { code: "zh-Hant", label: "繁體中文" },
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tl", label: "Filipino" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "hi", label: "हिन्दी" }
];

const STORAGE_KEY = "ai-lazy-pack-language";

const dom = {
  languageSelect: document.getElementById("languageSelect"),
  statusMessage: document.getElementById("statusMessage"),
  termsTitle: document.getElementById("termsTitle"),
  termsMeta: document.getElementById("termsMeta"),
  termsNotice: document.getElementById("termsNotice"),
  termsBody: document.getElementById("termsBody"),
  privacyTitle: document.getElementById("privacyTitle"),
  privacyMeta: document.getElementById("privacyMeta"),
  privacyIntro: document.getElementById("privacyIntro"),
  privacyBody: document.getElementById("privacyBody"),
  consentTitle: document.getElementById("consentTitle"),
  consentText: document.getElementById("consentText"),
  contactInfo: document.getElementById("contactInfo")
};

function initLanguageSelect() {
  dom.languageSelect.innerHTML = "";

  AVAILABLE_LANGUAGES.forEach(({ code, label }) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = label;
    dom.languageSelect.appendChild(option);
  });

  const stored = window.localStorage.getItem(STORAGE_KEY);
  const initial = AVAILABLE_LANGUAGES.some(({ code }) => code === stored)
    ? stored
    : AVAILABLE_LANGUAGES[0].code;

  dom.languageSelect.value = initial;
  dom.languageSelect.addEventListener("change", handleLanguageChange);

  loadLocale(initial);
}

function handleLanguageChange(event) {
  const code = event.target.value;
  window.localStorage.setItem(STORAGE_KEY, code);
  loadLocale(code, { announce: true });
}

async function loadLocale(code, options = {}) {
  const { announce = false } = options;
  showStatus(`Loading ${code}…`);

  try {
    const response = await fetch(`locales/${code}.json`, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    applyLocale(data);
    showStatus("Content updated.", { persistent: announce });
  } catch (error) {
    console.error(error);
    showStatus("Unable to load the selected language.", { isError: true, persistent: true });
  }
}

function applyLocale(data) {
  const langCode = data?.language?.code ?? "en";
  document.documentElement.lang = langCode;
  document.title = `${data?.terms?.title ?? "Ai Lazy Pack"} | Ai Lazy Pack Policies`;

  dom.termsTitle.textContent = data.terms?.title ?? "";
  dom.termsMeta.textContent = formatMeta([data.terms?.version, data.terms?.effectiveDate]);
  dom.termsNotice.textContent = data.terms?.notice ?? "";
  renderDocumentSections(dom.termsBody, data.terms?.sections ?? []);

  dom.privacyTitle.textContent = data.privacy?.title ?? "";
  dom.privacyMeta.textContent = formatMeta([
    data.privacy?.version,
    data.privacy?.effectiveDate,
    data.privacy?.updatedDate
  ]);
  dom.privacyIntro.textContent = data.privacy?.intro ?? "";
  renderDocumentSections(dom.privacyBody, data.privacy?.sections ?? []);

  dom.consentTitle.textContent = data.consent?.title ?? "";
  dom.consentText.textContent = data.consent?.text ?? "";
  dom.contactInfo.textContent = data.contact ?? "";
}

function formatMeta(parts) {
  return parts.filter(Boolean).join(" · ");
}

function renderDocumentSections(container, sections) {
  container.innerHTML = "";

  sections.forEach((section) => {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    heading.textContent = section.title ?? "";
    article.appendChild(heading);

    (section.content ?? []).forEach((block) => {
      const node = renderContentBlock(block);
      if (node) {
        article.appendChild(node);
      }
    });

    container.appendChild(article);
  });
}

function renderContentBlock(block) {
  if (!block || typeof block !== "object") {
    return null;
  }

  switch (block.type) {
    case "paragraph": {
      const p = document.createElement("p");
      p.textContent = block.text ?? "";
      return p;
    }
    case "list": {
      const ul = document.createElement("ul");
      (block.items ?? []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item ?? "";
        ul.appendChild(li);
      });
      return ul;
    }
    default:
      return null;
  }
}

let statusTimeoutId;

function showStatus(message, options = {}) {
  const { isError = false, persistent = false } = options;
  dom.statusMessage.textContent = message;
  dom.statusMessage.classList.toggle("is-visible", true);
  dom.statusMessage.style.background = isError ? "rgba(220, 53, 69, 0.92)" : "rgba(15, 23, 42, 0.9)";

  if (!persistent) {
    clearTimeout(statusTimeoutId);
    statusTimeoutId = window.setTimeout(() => {
      dom.statusMessage.classList.remove("is-visible");
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", initLanguageSelect);

