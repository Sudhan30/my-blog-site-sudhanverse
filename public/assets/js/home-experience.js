/* Interactive homepage. Native JS, no dependencies, no client-side rendering required. */
(() => {
  const root = document.querySelector(".home-experience");
  if (!root) return;
  document.documentElement.classList.add("js-ready");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveals enrich the experience; content is always visible without JavaScript.
  const reveals = Array.from(root.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !reduced) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -30px 0px", threshold: 0.08 });
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }

  // An exploratory teaching sketch, like the interactive inference explainer
  // on sudharsana.dev. No invented performance metrics or model claims.
  const scenarios = {
    data: {
      title: "Make the identity trustworthy.",
      description: "A useful data product begins with the signals: standardize records, resolve who they represent, and only then publish a shared view. The order matters more than the diagram.",
      nodes: [["Ingest", "Raw signals"], ["Resolve", "Identity"], ["Model", "Golden record"], ["Serve", "Decisions"]]
    },
    agent: {
      title: "Ground the answer before it acts.",
      description: "An agent should know what it can access, fetch the right context, use tools with clear boundaries and verify outcomes before presenting a decision.",
      nodes: [["Ask", "Intent"], ["Retrieve", "Context"], ["Act", "Tool boundary"], ["Verify", "Result"]]
    },
    operations: {
      title: "Shipping is only the beginning.",
      description: "Production work keeps going after the merge: reconcile deployment state, observe actual behavior, and improve the system from evidence.",
      nodes: [["Commit", "Change"], ["Reconcile", "GitOps"], ["Run", "K3s"], ["Observe", "Signals"]]
    }
  };
  const tabs = [...root.querySelectorAll(".lab-tab")];
  const canvas = root.querySelector("#lab-canvas");
  const nodes = [...root.querySelectorAll(".lab-node")];
  const labTitle = root.querySelector("#lab-title");
  const labDescription = root.querySelector("#lab-description");
  function setScenario(key, replay = false) {
    const scenario = scenarios[key];
    if (!scenario) return;
    tabs.forEach((tab) => {
      const selected = tab.dataset.scenario === key;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    nodes.forEach((node, index) => {
      const strong = node.querySelector("strong");
      const detail = node.querySelector("small");
      strong.textContent = scenario.nodes[index][0];
      detail.textContent = scenario.nodes[index][1];
    });
    labTitle.textContent = scenario.title;
    labDescription.textContent = scenario.description;
    canvas.dataset.scenario = key;
    if (replay && !reduced) {
      canvas.classList.remove("playing");
      void canvas.offsetWidth;
      canvas.classList.add("playing");
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setScenario(tab.dataset.scenario, true));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      setScenario(tabs[next].dataset.scenario, true);
    });
  });
  root.querySelector("#lab-replay")?.addEventListener("click", () => {
    const key = tabs.find(tab => tab.getAttribute("aria-selected") === "true")?.dataset.scenario || "data";
    setScenario(key, true);
  });

  // Search and filters use the actual server-rendered article index.
  const rows = [...root.querySelectorAll(".post-row")];
  const featured = [...root.querySelectorAll(".featured-item")];
  const entryElements = [...featured, ...rows];
  const entries = entryElements.map((el) => {
    const anchor = el.querySelector("a[href^='/post/']");
    const title = el.querySelector(".featured-title, .post-row-title")?.textContent?.trim() || "";
    const excerpt = el.querySelector(".featured-excerpt, .post-row-excerpt")?.textContent?.trim() || "";
    const tags = (el.dataset.tags || "").toLowerCase();
    return { title, excerpt, tags, href: anchor?.getAttribute("href") || "/", el };
  });
  const input = root.querySelector("#journal-filter-input");
  const count = root.querySelector("#journal-count");
  const empty = root.querySelector("#journal-empty");
  const filters = [...root.querySelectorAll(".journal-filter")];
  let activeFilter = "all";
  function matchesFilter(entry, group) {
    if (group === "all") return true;
    const tags = entry.tags;
    if (group === "ai") return /(^|,) *(ai|ai-agents|agent|llm|sql|gemini|claude|speech-to-text)(,|$)/.test(tags);
    if (group === "systems") return /(^|,) *(infrastructure|architecture|k3s|kubernetes|monitoring|gitops|devops|self-hosting|self-hosted)(,|$)/.test(tags);
    if (group === "cloud") return /(^|,) *(cloud|gcp|firebase|deployment)(,|$)/.test(tags);
    return tags.includes(group);
  }
  function filterRows() {
    const query = (input?.value || "").toLocaleLowerCase().trim();
    let visible = 0;
    rows.forEach((row) => {
      const entry = entries.find(item => item.el === row);
      if (!entry) return;
      const matches = matchesFilter(entry, activeFilter) && (entry.title + " " + entry.excerpt + " " + entry.tags).toLocaleLowerCase().includes(query);
      row.hidden = !matches;
      if (matches) visible++;
    });
    if (count) count.textContent = visible + (visible === 1 ? " note" : " notes") + " to explore";
    if (empty) empty.hidden = visible !== 0;
  }
  filters.forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filters.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    filterRows();
  }));
  input?.addEventListener("input", filterRows);
  filterRows();

  // Native <dialog> gives reliable Escape, backdrop and keyboard behavior.
  const dialog = root.querySelector("#journal-search-dialog");
  const modalInput = root.querySelector("#journal-global-search");
  const results = root.querySelector("#journal-search-results");
  let previousFocus = null;
  function renderModal() {
    if (!results) return;
    results.replaceChildren();
    const query = (modalInput?.value || "").toLocaleLowerCase().trim();
    const found = entries.filter(e => (e.title + " " + e.excerpt + " " + e.tags).toLocaleLowerCase().includes(query)).slice(0, 16);
    if (found.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No stories found. Try agents, infrastructure or hackathon.";
      p.style.padding = "20px 0";
      results.append(p);
    }
    found.forEach((entry) => {
      const link = document.createElement("a");
      link.href = entry.href;
      link.textContent = entry.title;
      const detail = document.createElement("small");
      detail.textContent = entry.excerpt;
      link.appendChild(detail);
      results.appendChild(link);
    });
  }
  function openSearch() {
    if (!dialog?.showModal) return;
    previousFocus = document.activeElement;
    modalInput.value = "";
    renderModal();
    dialog.showModal();
    modalInput.focus();
  }
  root.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", openSearch));
  root.querySelector("[data-search-close]")?.addEventListener("click", () => dialog.close());
  modalInput?.addEventListener("input", renderModal);
  dialog?.addEventListener("close", () => previousFocus?.focus?.());
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault(); openSearch();
    }
    if (event.key === "/" && !dialog?.open && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
      event.preventDefault(); openSearch();
    }
  });
})();