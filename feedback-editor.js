(function () {
  /* ============================================
     Feedback Editor — vanilla JS, zero deps.
     Usage: <script src="feedback-editor.js"></script>
     ============================================ */

  // --- State ---
  let isEditing = false;
  let pins = [];
  let activePinId = null;
  let nextId = 1;
  let highlightedEl = null;

  // --- DOM refs (populated on init) ---
  let $trigger, $banner, $actions, $cancelBtn, $saveBtn, $popup, $textarea, $popupConfirm, $popupCancel, $popupDelete, $toast;

  // ================================================================
  //  STYLES
  // ================================================================
  function injectStyles() {
    if (document.getElementById("fe-styles")) return;
    const css = document.createElement("style");
    css.id = "fe-styles";
    css.textContent = `
      .fe-trigger{position:fixed;top:80px;right:16px;z-index:9999;width:40px;height:40px;border-radius:50%;background:#142133;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);transition:transform .15s}
      .fe-trigger:active{transform:scale(.9)}
      .fe-banner{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#142133;color:#fff;font-size:14px;padding:8px 16px;border-radius:9999px;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2)}
      .fe-actions{position:fixed;top:80px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px}
      .fe-actions button{height:36px;padding:0 16px;border-radius:9999px;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;border:none;cursor:pointer;transition:transform .15s;box-shadow:0 2px 8px rgba(0,0,0,.2)}
      .fe-actions button:active{transform:scale(.98)}
      .fe-btn-cancel{background:#F3F3F3;color:#75808F;border:1px solid #E8ECF0!important}
      .fe-btn-save{background:#142133;color:#fff}
      .fe-btn-save:disabled{background:#C4C7CC;cursor:default}
      .fe-pin{position:fixed;z-index:9999;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .15s;pointer-events:auto;transform:translate(-50%,-50%)}
      .fe-pin:active{transform:translate(-50%,-50%) scale(.9)}
      .fe-pin--new{background:#FFD700;color:#142133}
      .fe-pin--done{background:#EE5A5A;color:#fff}
      .fe-pin--active{transform:translate(-50%,-50%) scale(1.25)!important;box-shadow:0 0 0 3px #142133}
      .fe-popup{position:fixed;z-index:10000;background:#fff;border-radius:16px;padding:20px;width:320px;box-shadow:0 4px 24px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.05)}
      .fe-popup textarea{width:100%;height:128px;border:1px solid #E8ECF0;border-radius:8px;padding:10px;font-size:14px;outline:none;resize:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-sizing:border-box}
      .fe-popup textarea:focus{border-color:#142133}
      .fe-popup textarea::placeholder{color:#AFB1C4}
      .fe-popup-btns{display:flex;gap:12px;margin-top:12px}
      .fe-popup-btns button{flex:1;height:40px;border-radius:9999px;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;border:none;cursor:pointer;transition:transform .15s}
      .fe-popup-btns button:active{transform:scale(.97)}
      .fe-popup-cancel{background:#F3F3F3;color:#75808F}
      .fe-popup-confirm{background:#142133;color:#fff}
      .fe-popup-delete{display:block;width:100%;margin-top:8px;height:36px;border-radius:9999px;background:transparent;color:#EE5A5A;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;border:none;cursor:pointer;transition:transform .15s}
      .fe-popup-delete:active{transform:scale(.97)}
      .fe-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:#2CBB5F;color:#fff;font-size:14px;padding:10px 20px;border-radius:9999px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.2)}
    `;
    document.head.appendChild(css);
  }

  // ================================================================
  //  DOM BUILDERS
  // ================================================================
  var svgNS = "http://www.w3.org/2000/svg";
  var svgTags = { svg:1, path:1, circle:1, rect:1, line:1, polyline:1, polygon:1, g:1, defs:1, clipPath:1, mask:1, text:1, tspan:1, use:1, symbol:1, pattern:1, linearGradient:1, radialGradient:1, stop:1 };
  function h(tag, attrs, ...children) {
    var el = svgTags[tag] ? document.createElementNS(svgNS, tag) : document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "className") el.className = v;
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else el.setAttribute(k, v);
      }
    }
    for (const c of children) {
      if (typeof c === "string") el.appendChild(document.createTextNode(c));
      else if (c instanceof Node) el.appendChild(c);
    }
    return el;
  }

  // ================================================================
  //  PIN HELPERS
  // ================================================================
  function pinViewportY(pin) {
    const docH = document.documentElement.scrollHeight;
    const raw = (pin.y / 100) * docH - window.scrollY;
    return Math.max(0, (raw / window.innerHeight) * 100);
  }

  function renderPins() {
    // Remove old pin DOM
    document.querySelectorAll(".fe-pin").forEach(function (el) { el.remove(); });
    pins.forEach(function (pin) {
      const vpct = pinViewportY(pin);
      var cls = pin.note.trim() ? "fe-pin fe-pin--done" : "fe-pin fe-pin--new";
      if (activePinId === pin.id) cls += " fe-pin--active";
      var btn = h("div", {
        className: cls,
        style: { left: pin.x + "%", top: vpct + "%" },
        "data-pin-id": pin.id,
        onClick: function (e) { e.stopPropagation(); openPin(pin.id); },
      }, String(pin.id));
      document.body.appendChild(btn);
    });
  }

  // ================================================================
  //  POPUP
  // ================================================================
  function calcPopupPos(pin) {
    var vh = window.innerHeight;
    var px = (pin.x / 100) * window.innerWidth;
    var docH = document.documentElement.scrollHeight;
    var py = (pin.y / 100) * docH - window.scrollY;
    var placeRight = px < window.innerWidth * 0.55;
    var placeBottom = py < vh * 0.5;
    return {
      left: placeRight ? px + 16 : px - 16,
      top: placeBottom ? py + 16 : py - 16,
      anchorX: placeRight ? "left" : "right",
      anchorY: placeBottom ? "top" : "bottom",
    };
  }

  function showPopup(pin, pos) {
    $popup.style.display = "block";
    $popup.style.left = pos.left + "px";
    $popup.style.top = pos.top + "px";
    var tx = pos.anchorX === "right" ? "calc(-100% - 8px)" : "8px";
    $popup.style.transform = "translateX(" + tx + ")";
    $textarea.value = pin.draft;
    $popup.setAttribute("data-pin-id", pin.id);
    setTimeout(function () { $textarea.focus(); }, 50);
  }

  function hidePopup() {
    $popup.style.display = "none";
    $popup.removeAttribute("data-pin-id");
    activePinId = null;
  }

  function openPin(id) {
    var pin = pins.find(function (p) { return p.id === id; });
    if (!pin) return;
    // Sync draft from note when opening
    pin.draft = pin.note;
    activePinId = id;
    var pos = calcPopupPos(pin);
    showPopup(pin, pos);
    renderPins();
    highlightPinElement(pin);
  }

  function highlightPinElement(pin) {
    // Find the element at that position and highlight it
    var docH = document.documentElement.scrollHeight;
    var absY = (pin.y / 100) * docH;
    var absX = (pin.x / 100) * window.innerWidth;
    var el = document.elementFromPoint(absX, absY);
    if (el && el !== document.body && el !== document.documentElement) {
      if (highlightedEl) { highlightedEl.style.outline = ""; highlightedEl.style.outlineOffset = ""; }
      el.style.outline = "2px solid #EE5A5A";
      el.style.outlineOffset = "2px";
      highlightedEl = el;
    }
  }

  // ================================================================
  //  PIN CRUD
  // ================================================================
  function addPin(xPct, yDocPct, target) {
    var pin = { id: nextId, x: xPct, y: yDocPct, note: "", draft: "" };
    nextId++;
    pins.push(pin);
    activePinId = pin.id;
    renderPins();
    updateBanner();
    var pos = calcPopupPos(pin);
    showPopup(pin, pos);
    if (highlightedEl) { highlightedEl.style.outline = ""; highlightedEl.style.outlineOffset = ""; }
    target.style.outline = "2px solid #EE5A5A";
    target.style.outlineOffset = "2px";
    highlightedEl = target;
  }

  function removePin(id) {
    pins = pins.filter(function (p) { return p.id !== id; });
    if (activePinId === id) hidePopup();
    if (highlightedEl) { highlightedEl.style.outline = ""; highlightedEl.style.outlineOffset = ""; highlightedEl = null; }
    renderPins();
    updateBanner();
    updateSaveBtn();
  }

  function confirmPin(id) {
    var pin = pins.find(function (p) { return p.id === id; });
    if (!pin) return;
    var draft = $textarea.value.trim();
    pin.note = draft;
    pin.draft = draft;
    hidePopup();
    if (highlightedEl) { highlightedEl.style.outline = ""; highlightedEl.style.outlineOffset = ""; highlightedEl = null; }
    renderPins();
    updateSaveBtn();
  }

  function updateBanner() {
    $banner.textContent = "点击页面元素添加标注 · 已添加 " + pins.length + " 处";
  }

  function updateSaveBtn() {
    var count = pins.filter(function (p) { return p.note.trim(); }).length;
    $saveBtn.textContent = "保存 (" + count + ")";
    $saveBtn.disabled = count === 0;
  }

  // ================================================================
  //  EDIT MODE
  // ================================================================
  function enterEditMode() {
    isEditing = true;
    document.body.style.cursor = "crosshair";
    document.body.style.userSelect = "none";
    $trigger.style.display = "none";
    $banner.style.display = "block";
    $actions.style.display = "flex";
    updateBanner();
    updateSaveBtn();
  }

  function exitEditMode() {
    isEditing = false;
    pins = [];
    activePinId = null;
    nextId = 1;
    hidePopup();
    if (highlightedEl) { highlightedEl.style.outline = ""; highlightedEl.style.outlineOffset = ""; highlightedEl = null; }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    $trigger.style.display = "flex";
    $banner.style.display = "none";
    $actions.style.display = "none";
    document.querySelectorAll(".fe-pin").forEach(function (el) { el.remove(); });
  }

  function save() {
    var validPins = pins.filter(function (p) { return p.note.trim(); });
    if (validPins.length === 0) return;
    var payload = {
      page: window.location.pathname,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      pins: validPins.map(function (p) { return { id: p.id, x: p.x, y: p.y, note: p.note }; }),
    };

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        showToast("标注已发送，AI 正在处理…");
        exitEditMode();
      })
      .catch(function () {
        // Fallback: download JSON
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "feedback-" + Date.now() + ".json";
        a.click();
        showToast("已下载 feedback.json");
        exitEditMode();
      });
  }

  function showToast(msg) {
    $toast.textContent = msg;
    $toast.style.display = "block";
    setTimeout(function () { $toast.style.display = "none"; }, 3000);
  }

  // ================================================================
  //  GLOBAL EVENT HANDLERS
  // ================================================================
  function onPageClick(e) {
    if (!isEditing) return;
    var target = e.target;
    // Ignore clicks on feedback UI
    if (target.closest("[data-fe-ui]")) return;
    e.preventDefault();
    e.stopPropagation();
    var xPct = (e.clientX / window.innerWidth) * 100;
    var docY = ((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100;
    addPin(xPct, docY, target);
  }

  function onKeyDown(e) {
    if (e.key !== "Delete") return;
    if (activePinId === null) return;
    e.preventDefault();
    removePin(activePinId);
  }

  function onScroll() { renderPins(); }
  function onResize() { renderPins(); }

  // ================================================================
  //  INIT
  // ================================================================
  function init() {
    if (document.getElementById("fe-trigger")) return; // already inited

    injectStyles();

    // Trigger button
    $trigger = h("button", { id: "fe-trigger", className: "fe-trigger", "data-fe-ui": "", onClick: enterEditMode, title: "标注修改意见" },
      h("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "#fff", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" },
        h("path", { d: "M15.232 5.232l3.536 3.536M9 11l-1 5 5-1 9.192-9.192a2.5 2.5 0 10-3.536-3.536L9 11z" }),
        h("path", { d: "M21 21H3" })
      )
    );

    // Banner
    $banner = h("div", { id: "fe-banner", className: "fe-banner", "data-fe-ui": "", style: { display: "none" } }, "点击页面元素添加标注 · 已添加 0 处");

    // Action buttons
    $cancelBtn = h("button", { className: "fe-btn-cancel", "data-fe-ui": "", onClick: exitEditMode }, "取消");
    $saveBtn = h("button", { className: "fe-btn-save", "data-fe-ui": "", onClick: save }, "保存 (0)");
    $actions = h("div", { id: "fe-actions", className: "fe-actions", "data-fe-ui": "", style: { display: "none" } }, $cancelBtn, $saveBtn);

    // Popup
    $textarea = h("textarea", { placeholder: "输入修改意见…", onInput: function () {
      var id = parseInt($popup.getAttribute("data-pin-id"));
      if (id) { var pin = pins.find(function (p) { return p.id === id; }); if (pin) pin.draft = $textarea.value; }
    }});
    $popupConfirm = h("button", { className: "fe-popup-confirm", "data-fe-ui": "", onClick: function () {
      var id = parseInt($popup.getAttribute("data-pin-id"));
      if (id) confirmPin(id);
    }}, "确定");
    $popupCancel = h("button", { className: "fe-popup-cancel", "data-fe-ui": "", onClick: function () {
      var id = parseInt($popup.getAttribute("data-pin-id"));
      if (!id) return;
      var pin = pins.find(function (p) { return p.id === id; });
      if (pin && !pin.draft.trim() && !pin.note.trim()) removePin(id);
      else hidePopup();
    }}, "取消");
    $popupDelete = h("button", { className: "fe-popup-delete", "data-fe-ui": "", onClick: function () {
      var id = parseInt($popup.getAttribute("data-pin-id"));
      if (id) removePin(id);
    }}, "删除标注");
    $popup = h("div", { id: "fe-popup", className: "fe-popup", "data-fe-ui": "", style: { display: "none" } },
      $textarea,
      h("div", { className: "fe-popup-btns" }, $popupCancel, $popupConfirm),
      $popupDelete
    );

    // Toast
    $toast = h("div", { id: "fe-toast", className: "fe-toast", "data-fe-ui": "", style: { display: "none" } });

    // Mount
    document.body.appendChild($trigger);
    document.body.appendChild($banner);
    document.body.appendChild($actions);
    document.body.appendChild($popup);
    document.body.appendChild($toast);

    // Global listeners
    document.addEventListener("click", onPageClick, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
  }

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
