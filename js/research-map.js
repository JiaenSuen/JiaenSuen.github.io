(() => {
  "use strict";

  const dataCache = new Map();

  async function loadMapData(root) {
    const source = root.dataset.mapSrc || "data/research-map.json";
    if (!dataCache.has(source)) {
      dataCache.set(source, fetch(source, { cache: "no-cache" }).then(async (response) => {
        if (!response.ok) throw new Error(`Unable to load research map data: ${response.status}`);
        return response.json();
      }));
    }
    return dataCache.get(source);
  }

  const NS = "http://www.w3.org/2000/svg";
  const categoryColors = {
    completed: "#7293a9",
    ongoing: "#b9828e",
    future: "#9a8eaa",
    core: "#d0a69f",
    concept: "#c5ac95"
  };

  async function initResearchMap(root) {
    if (!root || root.dataset.rmInitialized === "true") return;
    root.dataset.rmInitialized = "true";

    const svg = root.querySelector('[data-rm-role="svg"]');
    const viewport = root.querySelector('[data-rm-role="viewport"]');
    const phaseLayer = root.querySelector('[data-rm-role="phase-layer"]');
    const edgeLayer = root.querySelector('[data-rm-role="edge-layer"]');
    const nodeLayer = root.querySelector('[data-rm-role="node-layer"]');
    const stage = root.querySelector('[data-rm-role="stage"]');
    const loading = root.querySelector('[data-rm-role="loading"]');
    const detailPanel = root.querySelector('[data-rm-role="detail-panel"]');
    const mapShell = root.querySelector('.map-shell');
    const fullscreenButton = root.querySelector('[data-rm-action="fullscreen"]');
    const fullscreenLabel = root.querySelector('[data-rm-role="fullscreen-label"]');
    const zoomReadout = root.querySelector('[data-rm-role="zoom-readout"]');

    if (!svg || !viewport || !phaseLayer || !edgeLayer || !nodeLayer || !stage || !loading || !detailPanel || !mapShell) {
      console.warn("Research Map module markup is incomplete.");
      return;
    }

    let data;
    try {
      data = await loadMapData(root);
    } catch (error) {
      loading.textContent = "The research map data could not be loaded.";
      loading.style.color = "#8b4d4d";
      root.dataset.rmInitialized = "false";
      console.error(error);
      return;
    }
    const view = { x: 0, y: 0, scale: 1 };
    const limits = { min: 0.7, max: 2.1 };
    let selectedId = null;
    let pointerStart = null;
    let hasDragged = false;

    const $ = (selector) => root.querySelector(selector);
    const $$ = (selector) => root.querySelectorAll(selector);

    function element(tag, attrs = {}, text = "") {
      const item = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => item.setAttribute(key, value));
      if (text) item.textContent = text;
      return item;
    }

    function splitLines(text, maxCharacters, maxLines = 3) {
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";

      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length <= maxCharacters || !line) line = candidate;
        else { lines.push(line); line = word; }
      });
      if (line) lines.push(line);

      if (lines.length > maxLines) {
        const visible = lines.slice(0, maxLines);
        visible[maxLines - 1] = `${visible[maxLines - 1].replace(/[.,;:]$/, "")}…`;
        return visible;
      }
      return lines;
    }

    function drawPhases() {
      data.phases.forEach((phase) => {
        phaseLayer.appendChild(element("text", { x: phase.x, y: 42, class: "phase-label" }, phase.label));
        phaseLayer.appendChild(element("text", { x: phase.x, y: 61, class: "phase-range" }, phase.range));
        phaseLayer.appendChild(element("line", { x1: phase.x, y1: 77, x2: phase.x + phase.width, y2: 77, class: "phase-line" }));
      });
    }

    function anchorPoint(node, toward) {
      const nodeCenter = { x: node.x + node.w / 2, y: node.y + node.h / 2 };
      const targetCenter = { x: toward.x + toward.w / 2, y: toward.y + toward.h / 2 };
      const dx = targetCenter.x - nodeCenter.x;
      const dy = targetCenter.y - nodeCenter.y;
      const horizontal = Math.abs(dx / node.w) > Math.abs(dy / node.h);
      if (horizontal) return { x: dx > 0 ? node.x + node.w : node.x, y: nodeCenter.y };
      return { x: nodeCenter.x, y: dy > 0 ? node.y + node.h : node.y };
    }

    function edgeCurve(source, target) {
      const start = anchorPoint(source, target);
      const end = anchorPoint(target, source);
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        const bend = Math.max(45, Math.abs(dx) * .42) * Math.sign(dx || 1);
        return {
          path: `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`,
          labelX: (start.x + end.x) / 2,
          labelY: (start.y + end.y) / 2 - 9
        };
      }
      const bend = Math.max(40, Math.abs(dy) * .42) * Math.sign(dy || 1);
      return {
        path: `M ${start.x} ${start.y} C ${start.x} ${start.y + bend}, ${end.x} ${end.y - bend}, ${end.x} ${end.y}`,
        labelX: (start.x + end.x) / 2 + 9,
        labelY: (start.y + end.y) / 2
      };
    }

    function drawEdges() {
      const nodes = new Map(data.nodes.map((node) => [node.id, node]));
      data.links.forEach((link, index) => {
        const source = nodes.get(link.source);
        const target = nodes.get(link.target);
        if (!source || !target) return;
        const curve = edgeCurve(source, target);
        edgeLayer.appendChild(element("path", {
          d: curve.path,
          class: `edge-path ${link.type}`,
          "data-source": link.source,
          "data-target": link.target,
          "data-link-index": index
        }));

        if (link.label && link.type === "main") {
          edgeLayer.appendChild(element("text", {
            x: curve.labelX,
            y: curve.labelY,
            class: "edge-label",
            "text-anchor": "middle",
            "data-source": link.source,
            "data-target": link.target
          }, link.label));
        }
      });
    }

    function drawNode(node) {
      const group = element("g", {
        class: `map-node category-${node.category}${node.emphasis ? " emphasis" : ""}`,
        transform: `translate(${node.x} ${node.y})`,
        "data-node-id": node.id,
        role: "button",
        tabindex: "0",
        "aria-label": `${node.shortLabel}. ${node.status}. Select for details.`
      });

      group.appendChild(element("rect", { x: -5, y: -5, width: node.w + 10, height: node.h + 10, rx: node.category === "concept" ? 9 : 13, class: "node-pulse" }));
      group.appendChild(element("rect", { width: node.w, height: node.h, rx: node.category === "concept" ? 8 : 12, class: "node-card" }));
      group.appendChild(element("rect", { x: 0, y: node.category === "concept" ? 20 : 24, width: 3, height: node.category === "concept" ? 27 : 37, rx: 1.5, class: "node-accent" }));

      const compact = node.category === "concept";
      const left = compact ? 18 : 23;
      const kickerY = compact ? 27 : 31;
      const titleY = compact ? 53 : 64;
      const titleWidth = compact ? Math.floor((node.w - 42) / 7) : Math.floor((node.w - 55) / 8);
      const maxLines = node.category === "core" ? 4 : compact ? 2 : node.emphasis ? 4 : 3;

      group.appendChild(element("text", { x: left, y: kickerY, class: "node-kicker" }, node.shortLabel));
      const title = element("text", { x: left, y: titleY, class: "node-title" });
      splitLines(node.title, titleWidth, maxLines).forEach((line, lineIndex) => {
        title.appendChild(element("tspan", { x: left, dy: lineIndex === 0 ? 0 : (compact ? 16 : node.category === "core" ? 22 : 19) }, line));
      });
      group.appendChild(title);

      if (!compact) group.appendChild(element("text", { x: left, y: node.h - 20, class: "node-index" }, node.index));

      const circleX = node.w - (compact ? 19 : 23);
      const circleY = compact ? 25 : node.h - 23;
      group.appendChild(element("circle", { cx: circleX, cy: circleY, r: compact ? 10 : 12, class: "node-arrow-ring" }));
      group.appendChild(element("text", { x: circleX, y: circleY + 4.5, class: "node-arrow", "text-anchor": "middle" }, "↗"));

      const domains = node.domains || [];
      let badgeX = compact ? left : Math.min(left + 66, node.w - 92);
      const badgeY = compact ? node.h - 18 : node.h - 31;
      domains.forEach((domain) => {
        const isAI = domain === "AI";
        const badgeWidth = isAI ? 22 : 18;
        const domainClass = isAI ? "ai" : "robotics";
        group.appendChild(element("rect", { x: badgeX, y: badgeY, width: badgeWidth, height: 14, rx: 7, class: `node-domain-badge ${domainClass}` }));
        group.appendChild(element("text", { x: badgeX + badgeWidth / 2, y: badgeY + 9.5, class: `node-domain-text ${domainClass}` }, isAI ? "AI" : "R"));
        badgeX += badgeWidth + 4;
      });

      group.addEventListener("click", (event) => { event.stopPropagation(); if (!hasDragged) selectNode(node.id); });
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(node.id); }
      });
      nodeLayer.appendChild(group);
    }

    function drawLegend() {
      const legend = $(".map-legend");
      data.categories.forEach((category) => {
        const item = document.createElement("span");
        item.className = "legend-item";
        item.innerHTML = `<span class="legend-dot" style="--dot-color:${categoryColors[category.id]}"></span>${category.label}`;
        legend.appendChild(item);
      });
    }

    function connectedIds(id) {
      const result = new Set([id]);
      data.links.forEach((link) => {
        if (link.source === id) result.add(link.target);
        if (link.target === id) result.add(link.source);
      });
      return result;
    }

    function positionDetailPanel(id) {
      if (window.matchMedia("(max-width: 720px)").matches) {
        detailPanel.style.removeProperty("left");
        detailPanel.style.removeProperty("top");
        detailPanel.style.removeProperty("right");
        delete detailPanel.dataset.side;
        return;
      }

      const nodeElement = root.querySelector(`[data-node-id="${CSS.escape(id)}"]`);
      if (!nodeElement) return;
      const stageRect = stage.getBoundingClientRect();
      const nodeRect = nodeElement.getBoundingClientRect();
      const panelWidth = detailPanel.offsetWidth;
      const panelHeight = detailPanel.offsetHeight;
      const gap = 16;
      const margin = 12;

      let left = nodeRect.right - stageRect.left + gap;
      let side = "right";
      if (left + panelWidth > stageRect.width - margin) {
        left = nodeRect.left - stageRect.left - panelWidth - gap;
        side = "left";
      }
      left = Math.max(margin, Math.min(left, stageRect.width - panelWidth - margin));

      let top = nodeRect.top - stageRect.top + nodeRect.height / 2;
      const halfHeight = panelHeight / 2;
      top = Math.max(halfHeight + margin, Math.min(top, stageRect.height - halfHeight - margin));

      detailPanel.style.left = `${left}px`;
      detailPanel.style.top = `${top}px`;
      detailPanel.style.right = "auto";
      detailPanel.dataset.side = side;
    }

    function selectNode(id) {
      const node = data.nodes.find((item) => item.id === id);
      if (!node) return;
      selectedId = id;
      const connected = connectedIds(id);
      svg.classList.add("has-selection");

      $$(".map-node").forEach((item) => {
        const nodeId = item.dataset.nodeId;
        item.classList.toggle("is-selected", nodeId === id);
        item.classList.toggle("is-dimmed", !connected.has(nodeId));
      });
      $$(".edge-path, .edge-label").forEach((item) => {
        const isConnected = item.dataset.source === id || item.dataset.target === id;
        item.classList.toggle("is-connected", isConnected);
        item.classList.toggle("is-dimmed", !isConnected);
      });

      $('[data-rm-role="detail-index"]').textContent = node.index;
      $('[data-rm-role="detail-status"]').textContent = node.status;
      $('[data-rm-role="detail-title"]').textContent = node.title;
      $('[data-rm-role="detail-summary"]').textContent = node.brief || node.description;
      const domains = $('[data-rm-role="detail-domains"]');
      domains.replaceChildren(...(node.domains || []).map((domain) => {
        const item = document.createElement("span");
        item.className = `detail-domain ${domain === "AI" ? "ai" : "robotics"}`;
        item.textContent = domain === "AI" ? "AI" : "Robotics";
        return item;
      }));
      detailPanel.classList.add("is-open");
      window.requestAnimationFrame(() => positionDetailPanel(id));
    }

    function clearSelection() {
      selectedId = null;
      svg.classList.remove("has-selection");
      $$(".is-selected, .is-dimmed, .is-connected").forEach((item) => item.classList.remove("is-selected", "is-dimmed", "is-connected"));
      detailPanel.classList.remove("is-open");
    }

    function updateView() {
      viewport.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
      zoomReadout.textContent = `${Math.round(view.scale * 100)}%`;
      if (selectedId) window.requestAnimationFrame(() => positionDetailPanel(selectedId));
    }

    function zoomAt(factor, clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      const screenX = (clientX - rect.left) * (1600 / rect.width);
      const screenY = (clientY - rect.top) * (880 / rect.height);
      const nextScale = Math.min(limits.max, Math.max(limits.min, view.scale * factor));
      const ratio = nextScale / view.scale;
      view.x = screenX - (screenX - view.x) * ratio;
      view.y = screenY - (screenY - view.y) * ratio;
      view.scale = nextScale;
      updateView();
    }

    function resetView() { view.x = 0; view.y = 0; view.scale = 1; updateView(); }

    function syncFullscreenControl() {
      const active = document.fullscreenElement === mapShell || mapShell.classList.contains("is-page-fullscreen");
      fullscreenButton.setAttribute("aria-pressed", String(active));
      fullscreenButton.setAttribute("aria-label", active ? "Exit full-screen map" : "Expand map to full screen");
      fullscreenLabel.textContent = active ? "Exit map" : "Full map";
      if (selectedId) window.requestAnimationFrame(() => positionDetailPanel(selectedId));
    }

    async function toggleFullscreenMap() {
      if (mapShell.classList.contains("is-page-fullscreen")) {
        mapShell.classList.remove("is-page-fullscreen");
        syncFullscreenControl();
        return;
      }
      if (document.fullscreenElement === mapShell) { await document.exitFullscreen(); return; }

      try {
        if (mapShell.requestFullscreen) await mapShell.requestFullscreen();
        else { mapShell.classList.add("is-page-fullscreen"); syncFullscreenControl(); }
      } catch (error) {
        mapShell.classList.add("is-page-fullscreen");
        syncFullscreenControl();
        console.warn("Browser fullscreen was unavailable; using page fullscreen instead.", error);
      }
    }

    function addMapControls() {
      stage.addEventListener("wheel", (event) => {
        event.preventDefault();
        zoomAt(event.deltaY < 0 ? 1.1 : .91, event.clientX, event.clientY);
      }, { passive: false });

      stage.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest(".map-node")) return;
        pointerStart = { clientX: event.clientX, clientY: event.clientY, x: view.x, y: view.y };
        hasDragged = false;
        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");
      });

      stage.addEventListener("pointermove", (event) => {
        if (!pointerStart) return;
        const rect = svg.getBoundingClientRect();
        const dx = (event.clientX - pointerStart.clientX) * (1600 / rect.width);
        const dy = (event.clientY - pointerStart.clientY) * (880 / rect.height);
        if (Math.abs(dx) + Math.abs(dy) > 4) hasDragged = true;
        view.x = pointerStart.x + dx;
        view.y = pointerStart.y + dy;
        updateView();
      });

      const endPointer = (event) => {
        if (!pointerStart) return;
        pointerStart = null;
        stage.classList.remove("is-dragging");
        try { stage.releasePointerCapture(event.pointerId); } catch (_) {}
        window.setTimeout(() => { hasDragged = false; }, 0);
      };
      stage.addEventListener("pointerup", endPointer);
      stage.addEventListener("pointercancel", endPointer);

      $('[data-rm-action="zoom-in"]').addEventListener("click", () => {
        const rect = svg.getBoundingClientRect();
        zoomAt(1.18, rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
      $('[data-rm-action="zoom-out"]').addEventListener("click", () => {
        const rect = svg.getBoundingClientRect();
        zoomAt(.85, rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
      $('[data-rm-action="reset"]').addEventListener("click", resetView);
      fullscreenButton.addEventListener("click", toggleFullscreenMap);
      $('[data-rm-action="close-detail"]').addEventListener("click", clearSelection);

      stage.addEventListener("click", (event) => {
        if (event.target === svg || event.target.classList.contains("map-grid")) clearSelection();
      });

      document.addEventListener("fullscreenchange", syncFullscreenControl);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (mapShell.classList.contains("is-page-fullscreen")) {
          mapShell.classList.remove("is-page-fullscreen");
          syncFullscreenControl();
        } else if (root.contains(document.activeElement) || selectedId) clearSelection();
      });
      window.addEventListener("resize", () => { if (selectedId) positionDetailPanel(selectedId); });
    }

    try {
      drawLegend();
      drawPhases();
      drawEdges();
      data.nodes.forEach(drawNode);
      addMapControls();

      const initialNode = root.dataset.initialNode || null;
      if (initialNode && data.nodes.some((node) => node.id === initialNode)) selectNode(initialNode);
      window.setTimeout(() => loading.classList.add("is-hidden"), 180);

      root.researchMap = { selectNode, clearSelection, resetView, data };
    } catch (error) {
      loading.textContent = "The research map could not be initialized.";
      loading.style.color = "#8b4d4d";
      console.error(error);
    }
  }

  function boot() {
    document.querySelectorAll("[data-research-map-module]").forEach(initResearchMap);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  window.ResearchMapModule = { init: initResearchMap };
})();
