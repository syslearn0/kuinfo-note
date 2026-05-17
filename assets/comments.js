// 共有ノート コメント機能
// - 各 <h2>/<h3>/<p>/<figure>/<details> に決定論的 anchor-id を付与
// - Firestore からこのページ分の投稿を取得し、種類別の色バッジを表示
// - クリックで投稿フォームを開き、コメント / 質問 / 間違い指摘 を投稿

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, collection, query, where,
  onSnapshot, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ===== 種類定義 =====
const TYPES = {
  comment:    { label: "コメント",   color: "#2563eb", icon: "\u{1F4AC}" },
  question:   { label: "質問",       color: "#ca8a04", icon: "❓"    },
  correction: { label: "間違い指摘", color: "#dc2626", icon: "⚠️" }
};

// ===== ページslug算出 =====
// このスクリプトの場所 (= /<repo>/assets/comments.js) から サイトルートを割り出す
const SCRIPT_URL = new URL(import.meta.url);
const SITE_ROOT  = new URL("../", SCRIPT_URL).pathname;  // /<repo>/

function computePageSlug() {
  let path = location.pathname;
  if (path.startsWith(SITE_ROOT)) path = path.slice(SITE_ROOT.length);
  path = decodeURIComponent(path);
  path = path.replace(/\.html$/i, "");
  // 末尾が "index" もしくは "/index" なら除去
  if (path === "index") path = "";
  else if (path.endsWith("/index")) path = path.slice(0, -"index".length);
  if (path === "") path = "/";
  return path;
}
const pageSlug = computePageSlug();

// ===== Firebase init =====
const db = getFirestore(initializeApp(firebaseConfig));

// ===== ユーティリティ =====
async function sha1Short(text) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf, 0, 4))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

function anchorTargets() {
  return document.querySelectorAll("main h2, main h3, main p, main figure, main details");
}

async function assignAnchorIds() {
  for (const el of anchorTargets()) {
    if (el.dataset.anchorId) continue;
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
    if (!txt) continue;
    el.dataset.anchorId = `${el.tagName.toLowerCase()}-${await sha1Short(txt)}`;
    el.classList.add("nc-anchor");

    // 「＋」追加ボタン（実DOM）
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "nc-add";
    addBtn.textContent = "＋";
    addBtn.setAttribute("aria-label", "コメントを追加");
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openPanel(el);
    });
    el.appendChild(addBtn);
  }
}

// ===== バッジ表示 =====
function ensureBadgeContainer(el) {
  let badge = el.querySelector(":scope > .nc-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "nc-badge";
    badge.setAttribute("aria-label", "コメントを開く");
    el.appendChild(badge);
    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      openPanel(el);
    });
  }
  return badge;
}

function renderBadges(grouped) {
  // 既存バッジをクリア
  document.querySelectorAll(".nc-badge").forEach(b => b.remove());

  for (const el of anchorTargets()) {
    const id = el.dataset.anchorId;
    const items = grouped.get(id);
    if (!items || !items.length) continue;

    const counts = { comment: 0, question: 0, correction: 0 };
    for (const it of items) counts[it.type] = (counts[it.type] || 0) + 1;

    const badge = ensureBadgeContainer(el);
    badge.innerHTML = "";
    for (const t of ["comment", "question", "correction"]) {
      if (!counts[t]) continue;
      const chip = document.createElement("span");
      chip.className = `nc-chip nc-chip-${t}`;
      chip.style.background = TYPES[t].color;
      chip.textContent = `${TYPES[t].icon}${counts[t]}`;
      badge.appendChild(chip);
    }
  }
}

// ===== パネル（投稿フォーム + 一覧）=====
let currentPanel = null;
function closePanel() {
  if (currentPanel) { currentPanel.remove(); currentPanel = null; }
}

document.addEventListener("click", (e) => {
  if (currentPanel && !currentPanel.contains(e.target)) closePanel();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

function openPanel(anchorEl, presetType = "comment") {
  closePanel();
  const id = anchorEl.dataset.anchorId;
  const items = (LATEST_GROUPED.get(id) || [])
    .slice()
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

  const panel = document.createElement("div");
  panel.className = "nc-panel";
  panel.innerHTML = `
    <div class="nc-panel-head">
      <div class="nc-type-switch">
        ${Object.entries(TYPES).map(([k, v]) => `
          <button type="button" data-type="${k}"
            class="nc-type-btn ${k === presetType ? "active" : ""}"
            style="--c:${v.color}">${v.icon} ${v.label}</button>
        `).join("")}
      </div>
      <button type="button" class="nc-close" aria-label="閉じる">×</button>
    </div>
    <div class="nc-list"></div>
    <form class="nc-form">
      <input type="text" name="author" maxlength="40" placeholder="名前（任意）" class="nc-author">
      <textarea name="body" maxlength="1000" required placeholder="ここに書き込む…" class="nc-body" rows="3"></textarea>
      <div class="nc-form-foot">
        <span class="nc-counter">0 / 1000</span>
        <button type="submit" class="nc-submit">投稿</button>
      </div>
      <p class="nc-error" hidden></p>
    </form>
  `;
  anchorEl.appendChild(panel);
  currentPanel = panel;

  // 一覧
  const list = panel.querySelector(".nc-list");
  if (!items.length) {
    list.innerHTML = `<p class="nc-empty">まだ投稿はありません</p>`;
  } else {
    for (const it of items) {
      const row = document.createElement("div");
      row.className = `nc-item nc-item-${it.type}`;
      row.style.borderLeftColor = TYPES[it.type]?.color || "#999";
      const time = it.createdAt?.toDate?.().toLocaleString("ja-JP") || "";
      row.innerHTML = `
        <div class="nc-item-head">
          <span class="nc-item-type" style="background:${TYPES[it.type]?.color}">${TYPES[it.type]?.icon} ${TYPES[it.type]?.label || it.type}</span>
          <span class="nc-item-author">${escapeHtml(it.authorName || "名無し")}</span>
          <span class="nc-item-time">${time}</span>
        </div>
        <div class="nc-item-body">${escapeHtml(it.body)}</div>
      `;
      list.appendChild(row);
    }
  }

  // type switch
  let selectedType = presetType;
  panel.querySelectorAll(".nc-type-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedType = btn.dataset.type;
      panel.querySelectorAll(".nc-type-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // counter
  const ta = panel.querySelector(".nc-body");
  const counter = panel.querySelector(".nc-counter");
  ta.addEventListener("input", () => counter.textContent = `${ta.value.length} / 1000`);

  // close
  panel.querySelector(".nc-close").addEventListener("click", (e) => { e.stopPropagation(); closePanel(); });

  // submit
  panel.querySelector(".nc-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = panel.querySelector(".nc-error");
    errEl.hidden = true;
    const body = ta.value.trim();
    if (!body) return;
    const author = panel.querySelector(".nc-author").value.trim().slice(0, 40);
    const submitBtn = panel.querySelector(".nc-submit");
    submitBtn.disabled = true;
    try {
      await addDoc(collection(db, "comments"), {
        pageSlug,
        anchorId: id,
        type: selectedType,
        body,
        authorName: author || "名無し",
        createdAt: serverTimestamp()
      });
      closePanel();
    } catch (err) {
      console.error(err);
      errEl.hidden = false;
      errEl.textContent = "投稿に失敗しました：" + (err?.message || err);
      submitBtn.disabled = false;
    }
  });

  // クリック伝播防止（パネル内クリックで閉じないように）
  panel.addEventListener("click", e => e.stopPropagation());
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// ===== ページ全体コメント =====
const PAGE_ANCHOR_ID = "__page__";

function ensurePageCommentsSection() {
  if (document.getElementById("nc-page-section")) return;
  const section = document.createElement("section");
  section.id = "nc-page-section";
  section.innerHTML = `
    <h2>このページへのコメント</h2>
    <p class="nc-muted">特定の段落ではなく、ページ全体・回全体に対するコメント・質問・間違い指摘はこちらに書いてください。</p>
    <div class="nc-page-list"></div>
    <form class="nc-form nc-page-form">
      <div class="nc-type-switch">
        ${Object.entries(TYPES).map(([k, v], i) => `
          <button type="button" data-type="${k}"
            class="nc-type-btn ${i === 0 ? "active" : ""}"
            style="--c:${v.color}">${v.icon} ${v.label}</button>
        `).join("")}
      </div>
      <input type="text" name="author" maxlength="40" placeholder="名前（任意）" class="nc-author">
      <textarea name="body" maxlength="1000" required placeholder="ここに書き込む…" class="nc-body" rows="3"></textarea>
      <div class="nc-form-foot">
        <span class="nc-counter">0 / 1000</span>
        <button type="submit" class="nc-submit">投稿</button>
      </div>
      <p class="nc-error" hidden></p>
    </form>
  `;
  document.querySelector("main").appendChild(section);

  // type switch
  let selectedType = "comment";
  section.querySelectorAll(".nc-type-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      selectedType = btn.dataset.type;
      section.querySelectorAll(".nc-type-btn").forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // counter
  const ta = section.querySelector(".nc-body");
  const counter = section.querySelector(".nc-counter");
  ta.addEventListener("input", () => counter.textContent = `${ta.value.length} / 1000`);

  // submit
  section.querySelector(".nc-page-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = section.querySelector(".nc-error");
    errEl.hidden = true;
    const body = ta.value.trim();
    if (!body) return;
    const author = section.querySelector(".nc-author").value.trim().slice(0, 40);
    const submitBtn = section.querySelector(".nc-submit");
    submitBtn.disabled = true;
    try {
      await addDoc(collection(db, "comments"), {
        pageSlug,
        anchorId: PAGE_ANCHOR_ID,
        type: selectedType,
        body,
        authorName: author || "名無し",
        createdAt: serverTimestamp()
      });
      ta.value = "";
      counter.textContent = "0 / 1000";
    } catch (err) {
      console.error(err);
      errEl.hidden = false;
      errEl.textContent = "投稿に失敗しました：" + (err?.message || err);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function renderPageList(grouped) {
  const section = document.getElementById("nc-page-section");
  if (!section) return;
  const list = section.querySelector(".nc-page-list");
  const items = (grouped.get(PAGE_ANCHOR_ID) || [])
    .slice()
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<p class="nc-empty">まだ投稿はありません</p>`;
    return;
  }
  for (const it of items) {
    const row = document.createElement("div");
    row.className = `nc-item nc-item-${it.type}`;
    row.style.borderLeftColor = TYPES[it.type]?.color || "#999";
    const time = it.createdAt?.toDate?.().toLocaleString("ja-JP") || "";
    row.innerHTML = `
      <div class="nc-item-head">
        <span class="nc-item-type" style="background:${TYPES[it.type]?.color}">${TYPES[it.type]?.icon} ${TYPES[it.type]?.label || it.type}</span>
        <span class="nc-item-author">${escapeHtml(it.authorName || "名無し")}</span>
        <span class="nc-item-time">${time}</span>
      </div>
      <div class="nc-item-body">${escapeHtml(it.body)}</div>
    `;
    list.appendChild(row);
  }
}

// ===== Firestore購読 =====
let LATEST_GROUPED = new Map();
function subscribe() {
  const q = query(collection(db, "comments"), where("pageSlug", "==", pageSlug));
  onSnapshot(q, (snap) => {
    const grouped = new Map();
    snap.forEach(doc => {
      const d = doc.data();
      if (!d.anchorId) return;
      if (!grouped.has(d.anchorId)) grouped.set(d.anchorId, []);
      grouped.get(d.anchorId).push(d);
    });
    LATEST_GROUPED = grouped;
    renderBadges(grouped);
    renderPageList(grouped);
    renderOrphans(grouped);
  }, (err) => {
    console.error("Firestore subscribe error:", err);
  });
}

// 段落テキストが変わってanchor_idが宙に浮いた投稿をページ末尾にまとめて出す
function renderOrphans(grouped) {
  const liveIds = new Set([PAGE_ANCHOR_ID]); // ページ全体コメントは常にlive扱い
  for (const el of anchorTargets()) {
    if (el.dataset.anchorId) liveIds.add(el.dataset.anchorId);
  }
  const orphans = [];
  for (const [aid, items] of grouped) {
    if (!liveIds.has(aid)) orphans.push(...items);
  }

  let section = document.getElementById("nc-orphans");
  if (!orphans.length) { section?.remove(); return; }
  if (!section) {
    section = document.createElement("section");
    section.id = "nc-orphans";
    section.innerHTML = `<h2>未紐付けの投稿</h2><p class="nc-muted">本文の編集により紐付きが外れた投稿です。</p><div class="nc-orphan-list"></div>`;
    document.querySelector("main").appendChild(section);
  }
  const list = section.querySelector(".nc-orphan-list");
  list.innerHTML = "";
  orphans.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  for (const it of orphans) {
    const row = document.createElement("div");
    row.className = `nc-item nc-item-${it.type}`;
    row.style.borderLeftColor = TYPES[it.type]?.color || "#999";
    const time = it.createdAt?.toDate?.().toLocaleString("ja-JP") || "";
    row.innerHTML = `
      <div class="nc-item-head">
        <span class="nc-item-type" style="background:${TYPES[it.type]?.color}">${TYPES[it.type]?.icon} ${TYPES[it.type]?.label || it.type}</span>
        <span class="nc-item-author">${escapeHtml(it.authorName || "名無し")}</span>
        <span class="nc-item-time">${time}</span>
      </div>
      <div class="nc-item-body">${escapeHtml(it.body)}</div>
    `;
    list.appendChild(row);
  }
}

// ===== boot =====
(async function boot() {
  if (!document.querySelector("main")) return;  // 対象外ページ
  // index ページ（ルート / 各科目index）にはコメント機能を出さない
  // 判定の根拠を多重化：(a) pageSlug が "/" or "/"終わり (b) .lectures グリッドあり
  if (
    pageSlug === "/" ||
    pageSlug.endsWith("/") ||
    document.querySelector("main .lectures")
  ) return;
  await assignAnchorIds();
  ensurePageCommentsSection();
  subscribe();
})();
