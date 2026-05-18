// みんなのチャット
// - /chats コレクションを使用
// - クエリは「今日の0時 (ローカル) 以降」のみ → 毎日0時に表示がリセット
// - リアルタイム購読、0時を跨いだら自動で再購読

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const db = getFirestore(initializeApp(firebaseConfig));

// ===== DOM =====
const logEl    = document.getElementById("chat-log");
const formEl   = document.getElementById("chat-form");
const bodyEl   = document.getElementById("chat-body");
const authorEl = document.getElementById("chat-author");
const counter  = document.getElementById("chat-counter");
const sendBtn  = document.getElementById("chat-send");
const errEl    = document.getElementById("chat-error");
const dateEl   = document.getElementById("chat-date");

// ===== ユーティリティ =====
function todayMidnight() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
}
function nextMidnight() {
  const m = todayMidnight();
  return new Date(m.getTime() + 24 * 60 * 60 * 1000);
}
function fmtDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} (${"日月火水木金土"[d.getDay()]})`;
}
function fmtTime(d) {
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// ===== 表示 =====
function renderMessages(items) {
  logEl.innerHTML = "";
  if (!items.length) {
    logEl.innerHTML = `<p class="chat-empty">今日の発言はまだありません。最初の一言をどうぞ。</p>`;
    return;
  }
  for (const it of items) {
    const t = it.createdAt?.toDate?.() || new Date();
    const row = document.createElement("div");
    row.className = "chat-msg";
    row.innerHTML = `
      <div class="chat-msg-head">
        <span class="chat-msg-author">${escapeHtml(it.authorName || "名無し")}</span>
        <span class="chat-msg-time">${fmtTime(t)}</span>
      </div>
      <div class="chat-msg-body">${escapeHtml(it.body)}</div>
    `;
    logEl.appendChild(row);
  }
  // 自動で最下部へ
  logEl.scrollTop = logEl.scrollHeight;
}

// ===== 購読（0時を跨いだら再構築）=====
let unsubscribe = null;
let midnightTimer = null;

function subscribe() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  const midnight = todayMidnight();
  dateEl.textContent = fmtDate(midnight);

  const q = query(
    collection(db, "chats"),
    where("createdAt", ">=", Timestamp.fromDate(midnight)),
    orderBy("createdAt", "asc")
  );

  unsubscribe = onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach(doc => items.push(doc.data()));
    renderMessages(items);
  }, (err) => {
    console.error("chat subscribe error:", err);
    logEl.innerHTML = `<p class="chat-empty" style="color:#dc2626">読み込みに失敗しました: ${escapeHtml(err.message || String(err))}</p>`;
  });

  // 次の0時に再購読をスケジュール
  if (midnightTimer) clearTimeout(midnightTimer);
  const msUntilMidnight = nextMidnight().getTime() - Date.now() + 1000; // +1秒の余裕
  midnightTimer = setTimeout(subscribe, msUntilMidnight);
}

// ===== 投稿 =====
bodyEl.addEventListener("input", () => {
  counter.textContent = `${bodyEl.value.length} / 500`;
});

// Enter で送信 / Shift+Enter で改行
bodyEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.hidden = true;
  const body = bodyEl.value.trim();
  if (!body) return;
  const author = authorEl.value.trim().slice(0, 40);
  sendBtn.disabled = true;
  try {
    await addDoc(collection(db, "chats"), {
      body,
      authorName: author || "名無し",
      createdAt: serverTimestamp()
    });
    bodyEl.value = "";
    counter.textContent = "0 / 500";
  } catch (err) {
    console.error(err);
    errEl.hidden = false;
    errEl.textContent = "送信に失敗しました：" + (err?.message || err);
  } finally {
    sendBtn.disabled = false;
    bodyEl.focus();
  }
});

// 名前の永続化（ローカル）
const NAME_KEY = "chat-author-name";
const saved = localStorage.getItem(NAME_KEY);
if (saved) authorEl.value = saved;
authorEl.addEventListener("change", () => localStorage.setItem(NAME_KEY, authorEl.value));

subscribe();
