import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createCotton2D } from "./cotton2d.js";

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches && !location.search.includes("motion=full");
const touch = matchMedia("(pointer: coarse)").matches;

const lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });
window.__lenis = lenis;

const root = document.documentElement;
const SKY = [
  { p: 0.0, top: "#fde9d6", mid: "#f9cfa9", bot: "#f4ae80", text: "#161311", sun: 1, stars: 0 },
  { p: 0.3, top: "#fbd9bd", mid: "#f6b386", bot: "#ec8a5e", text: "#161311", sun: 1, stars: 0 },
  { p: 0.5, top: "#d98e8a", mid: "#b8667a", bot: "#6e4466", text: "#fffaf5", sun: 0.35, stars: 0.2 },
  { p: 0.62, top: "#1d1a2c", mid: "#2a2340", bot: "#3b2c46", text: "#fffaf5", sun: 0, stars: 1 },
  { p: 0.74, top: "#241f33", mid: "#3a2c46", bot: "#7a4f5f", text: "#fffaf5", sun: 0.2, stars: 0.6 },
  { p: 0.8, top: "#f6d7c4", mid: "#f3b896", bot: "#ea9a74", text: "#161311", sun: 0.8, stars: 0 },
  { p: 1.0, top: "#fde9d6", mid: "#f9cfa9", bot: "#f4ae80", text: "#161311", sun: 1, stars: 0 },
];
const sun = document.querySelector(".sky-sun");
const stars = document.querySelector(".sky-stars");
function paintSky(p) {
  let i = 0;
  while (i < SKY.length - 2 && p > SKY[i + 1].p) i++;
  const a = SKY[i], b = SKY[i + 1];
  const t = gsap.utils.clamp(0, 1, (p - a.p) / (b.p - a.p));
  const mix = gsap.utils.interpolate;
  root.style.setProperty("--sky-top", mix(a.top, b.top, t));
  root.style.setProperty("--sky-mid", mix(a.mid, b.mid, t));
  root.style.setProperty("--sky-bot", mix(a.bot, b.bot, t));
  root.style.setProperty("--sky-text", mix(a.text, b.text, t));
  sun.style.opacity = mix(a.sun, b.sun, t);
  sun.style.transform = `translateY(${(p * 60).toFixed(1)}vh)`;
  stars.style.opacity = mix(a.stars, b.stars, t);
}
ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => paintSky(st.progress) });
paintSky(0);

const lines = document.querySelectorAll(".hero h1 .line > span");
if (!reduced) {
  gsap.from(lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.09, delay: 0.15 });
  gsap.from(".chips .chip", { y: 16, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.55 });
  gsap.from(".cta-row", { y: 16, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.75 });
  gsap.from("[data-stage]", { y: 40, opacity: 0, scale: 0.97, duration: 1.3, ease: "expo.out", delay: 0.3 });
  gsap.from("[data-inbox]", { y: 30, opacity: 0, duration: 1.1, ease: "expo.out", delay: 0.7 });
}

const chips = [...document.querySelectorAll(".chip")];
let chipI = 0;
function cycleChips() {
  chips.forEach((c, i) => c.classList.toggle("on", i === chipI));
  chipI = (chipI + 1) % chips.length;
}
cycleChips();
setInterval(cycleChips, 1800);

document.querySelectorAll(".magnetic").forEach((b) => {
  if (touch) return;
  const xTo = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3" });
  const yTo = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3" });
  b.addEventListener("pointermove", (e) => {
    const r = b.getBoundingClientRect();
    xTo((e.clientX - r.left - r.width / 2) * 0.25);
    yTo((e.clientY - r.top - r.height / 2) * 0.35);
  });
  b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
});

if (!reduced) {
  gsap.to("[data-inbox]", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("[data-stage]", { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}

const stageCatSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
stageCatSvg.setAttribute("viewBox", "10 0 410 290");
document.querySelector("[data-stage-cat]").appendChild(stageCatSvg);
const stageCat = createCotton2D(stageCatSvg);
stageCat.setState("sit");

const PINGS = [
  { title: "Send Aryan the revised homepage copy", body: "You said you'd send it tonight." },
  { title: "Reply to Ghehna on the nudge flows", body: "She's waiting for your pick." },
  { title: "Feedback on minimi with Akio", body: "Starts in 10 minutes." },
];
const toast = document.querySelector("[data-toast]");
const tTitle = document.querySelector("[data-toast-title]");
const tBody = document.querySelector("[data-toast-body]");
const mcat = document.querySelector("[data-mcat]");
const ring = toast.querySelector(".ring");
const itemsEl = [...document.querySelectorAll("[data-item]")];
const closedEl = document.querySelector("[data-closed]");
let pingI = 0, closed = 4;
function ping() {
  const d = PINGS[pingI % PINGS.length];
  tTitle.textContent = d.title;
  tBody.textContent = d.body;
  mcat.classList.add("ping");
  stageCat.lookAt(0.6, 0.8);
  stageCat.hop();
  const tl = gsap.timeline();
  tl.to(toast, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.8)" })
    .fromTo(ring, { opacity: 0.9, scale: 0.8 }, { opacity: 0, scale: 1.6, duration: 0.9, ease: "power2.out" }, "<0.1")
    .to(toast, { opacity: 0, y: -12, scale: 0.96, duration: 0.45, ease: "power2.in", delay: 2.4 })
    .add(() => {
      mcat.classList.remove("ping");
      stageCat.lookAt(0, 0);
      const it = itemsEl[pingI % itemsEl.length];
      it.classList.add("done");
      closed += 1;
      closedEl.textContent = closed;
      gsap.delayedCall(2.2, () => it.classList.remove("done"));
      pingI++;
    });
}
gsap.delayedCall(reduced ? 0.4 : 1.8, () => { ping(); setInterval(ping, 6000); });

const layer = document.querySelector("[data-cat-layer]");
const cat = createCotton2D(document.querySelector("[data-cat-svg]"));
const bubble = document.querySelector("[data-cat-bubble]");
const state = { x: 40, dir: 1, idle: 0, target: null, shown: false, lastScroll: null, v: 0, finale: false };
const bowl = document.querySelector("[data-bowl]");
const feedState = { count: 0, sleeping: false };
const catW = () => layer.getBoundingClientRect().width;
gsap.set(layer, { opacity: 0 });

ScrollTrigger.create({
  trigger: ".hero",
  start: "35% top",
  onEnter: () => {
    if (state.shown) return;
    state.shown = true;
    gsap.to("[data-stage-cat]", { opacity: 0, x: -40, duration: 0.5, ease: "power2.in" });
    gsap.to(layer, { opacity: 1, duration: 0.3 });
    state.x = -catW() * 0.6;
    cat.setDirection(1);
  },
  onLeaveBack: () => {
    state.shown = false;
    gsap.to("[data-stage-cat]", { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" });
    gsap.to(layer, { opacity: 0, duration: 0.3 });
  },
});

document.querySelector("[data-cat-hit]").addEventListener("click", () => {
  cat.hop();
  gsap.fromTo(bubble, { opacity: 0, y: 6, scale: 0.8 }, { opacity: 1, y: -8, scale: 1, duration: 0.35, ease: "back.out(2)", overwrite: true });
  gsap.to(bubble, { opacity: 0, y: -16, duration: 0.4, delay: 1.1, ease: "power2.in" });
});

addEventListener("pointermove", (e) => {
  const r = layer.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  cat.lookAt(gsap.utils.clamp(-1, 1, ((e.clientX - cx) / innerWidth) * 2 * state.dir), gsap.utils.clamp(-1, 1, -(e.clientY - cy) / innerHeight * 2));
});

gsap.ticker.add((time, deltaMs) => {
  const dt = Math.min(deltaMs / 1000, 1 / 20);
  const sy = window.scrollY;
  const raw = (sy - (state.lastScroll ?? sy)) / Math.max(dt * 60, 0.5);
  state.lastScroll = sy;
  state.v = (state.v || 0) + (raw - (state.v || 0)) * 0.35;
  const v = Math.abs(lenis.velocity || 0) > 0.05 ? lenis.velocity : state.v;
  const speed = state.shown && !reduced ? gsap.utils.clamp(0, 1, Math.abs(v) / 26) : 0;
  const W = catW();
  const maxX = innerWidth - W * 0.85;
  if (state.finale && state.shown) {
    const br = bowl.getBoundingClientRect();
    const tx = br.left + br.width * 0.3 - W * 0.74;
    const d = tx - state.x;
    if (Math.abs(d) > 5) {
      state.dir = d > 0 ? 1 : -1;
      const sp = Math.min(1, Math.abs(d) / 260);
      cat.setSpeed(0.3 + sp * 0.6);
      state.x += state.dir * (90 + 380 * sp) * dt;
      if ((state.dir > 0 && state.x > tx) || (state.dir < 0 && state.x < tx)) state.x = tx;
    } else {
      state.dir = 1;
      state.x = tx;
      if (cat.state === "walk" || cat.state === "run" || cat.state === "idle") cat.setState(feedState.sleeping ? "sleep" : "sit");
    }
  } else if (speed > 0.04) {
    state.idle = 0;
    state.target = null;
    const want = v > 0 ? 1 : -1;
    if (want !== state.dir && Math.abs(v) > 2) state.dir = want;
    cat.setSpeed(0.25 + speed * 0.75);
    state.x += state.dir * (80 + 520 * speed) * dt;
    if (state.x > maxX) { state.x = maxX; state.dir = -1; }
    if (state.x < -W * 0.15) { state.x = -W * 0.15; state.dir = 1; }
  } else if (state.shown) {
    state.idle += dt;
    if (state.target === null && state.idle > 3.5 && Math.random() < dt * 0.25) {
      state.target = gsap.utils.random(W * 0.2, maxX - 10);
    }
    if (state.target !== null) {
      const d = state.target - state.x;
      if (Math.abs(d) < 6) { state.target = null; cat.setSpeed(0); state.idle = 0; }
      else { state.dir = d > 0 ? 1 : -1; cat.setSpeed(0.22); state.x += state.dir * 70 * dt; }
    } else {
      cat.setSpeed(0);
      if (state.idle > 22 && cat.state !== "sleep") cat.setState("sleep");
    }
  }
  if (state.shown && cat.state === "sleep" && speed > 0.04) cat.setState("idle");
  cat.setDirection(state.dir);
  layer.style.transform = `translate3d(${state.x.toFixed(1)}px,0,0)`;
  cat.update(dt);
  stageCat.update(dt);
});

window.__cat = { cat, stageCat, state };

const desktop = matchMedia("(min-width: 901px) and (min-height: 560px)");

gsap.utils.toArray(".reveal").forEach((el) => {
  if (reduced) return;
  gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
});

const orbit = document.querySelector("[data-orbit]");
const orbs = [...orbit.querySelectorAll("[data-orb]")];
const linesSvg = orbit.querySelector("[data-orbit-lines]");
const NS = "http://www.w3.org/2000/svg";
const orbLines = orbs.map(() => {
  const l = document.createElementNS(NS, "line");
  l.setAttribute("stroke", "#f2832f");
  l.setAttribute("stroke-width", "2");
  l.setAttribute("stroke-linecap", "round");
  l.setAttribute("stroke-dasharray", "4 6");
  l.style.opacity = "0";
  linesSvg.appendChild(l);
  return l;
});
let orbT = 0, activeOrb = 0, hoverOrb = -1;
orbs.forEach((o, i) => {
  o.addEventListener("pointerenter", () => (hoverOrb = i));
  o.addEventListener("pointerleave", () => (hoverOrb = -1));
  o.addEventListener("click", () => (hoverOrb = hoverOrb === i ? -1 : i));
});
setInterval(() => { activeOrb = (activeOrb + 1) % (orbs.length - 1); }, 1600);
gsap.ticker.add((t, d) => {
  const dt = Math.min(d / 1000, 1 / 20);
  const v = Math.abs(lenis.velocity || 0);
  orbT += dt * (reduced ? 0 : 0.12 + Math.min(v, 40) * 0.01);
  const W = orbit.clientWidth, c = W / 2;
  orbs.forEach((o, i) => {
    const ring = +o.dataset.ring, base = (+o.dataset.angle * Math.PI) / 180;
    const R = ring === 1 ? W * 0.28 : W * (W < 460 ? 0.39 : 0.46);
    const a = base + orbT * (ring === 1 ? 1 : -0.7);
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    o.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    const on = (hoverOrb === -1 ? activeOrb === i : hoverOrb === i) && !o.classList.contains("more");
    o.classList.toggle("active", on);
    const l = orbLines[i];
    l.setAttribute("x1", c); l.setAttribute("y1", c);
    l.setAttribute("x2", (c + x).toFixed(1)); l.setAttribute("y2", (c + y).toFixed(1));
    l.style.opacity = on ? "0.9" : "0";
    l.style.strokeDashoffset = String((-t * 30) % 100);
  });
});

const featItems = [...document.querySelectorAll("[data-feat]")];
const featBgs = [...document.querySelectorAll("[data-feat-bg]"), ...document.querySelectorAll("[data-scene]")].map((el) => { el.dataset.k = el.dataset.featBg ?? el.dataset.scene; return el; });
const cards = [...document.querySelectorAll("[data-card]")];
const featBar = document.querySelector("[data-feat-bar]");
const draft = document.querySelector("[data-draft]");
const draftHTML = draft.innerHTML;
const draftText = draft.textContent;
let featIdx = -1;
function showFeat(i) {
  if (i === featIdx) return;
  featIdx = i;
  featItems.forEach((el, k) => el.classList.toggle("on", k === i));
  featBgs.forEach((el) => el.classList.toggle("on", +el.dataset.k === i));
  cards.forEach((el, k) => {
    gsap.to(el, k === i
      ? { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 0.18, ease: "back.out(1.4)", overwrite: true }
      : { opacity: 0, y: k < i ? -30 : 30, scale: 0.96, duration: 0.22, ease: "power2.in", overwrite: true });
  });
}
function featLocal(i, lp) {
  const card = cards[i];
  if (i === 1) {
    const n = Math.floor(gsap.utils.clamp(0, 1, lp / 0.6) * draftText.length);
    if (lp >= 0.6) draft.innerHTML = draftHTML;
    else draft.textContent = draftText.slice(0, n);
  }
  const done = lp > 0.72;
  if (done && !card.classList.contains("done")) {
    const act = card.querySelector("[data-act]");
    act.classList.add("press");
    setTimeout(() => act.classList.remove("press"), 160);
    card.classList.add("done");
    if (state.shown) cat.hop();
  } else if (!done) card.classList.remove("done");
}
let featST = null;
function setupFeatures() {
  if (featST) { featST.kill(); featST = null; }
  if (desktop.matches && !reduced) {
    featST = ScrollTrigger.create({
      trigger: "[data-features]",
      start: "top top",
      end: "+=260%",
      pin: ".features-pin",
      scrub: true,
      onUpdate: (st) => {
        const p = st.progress;
        featBar.style.transform = `scaleY(${p.toFixed(3)})`;
        const i = Math.min(2, Math.floor(p * 3));
        showFeat(i);
        featLocal(i, p * 3 - i);
      },
    });
    showFeat(0);
  } else {
    let i = 0;
    clearInterval(window.__featTimer);
    showFeat(0);
    featLocal(0, 1);
    window.__featTimer = setInterval(() => { i = (i + 1) % 3; showFeat(i); featLocal(i, 1); }, 3200);
  }
}
setupFeatures();
desktop.addEventListener("change", () => { featIdx = -1; setupFeatures(); ScrollTrigger.refresh(); });

const deckCards = [...document.querySelectorAll(".deck-card")];
let deckOrder = deckCards.map((_, i) => i);
function layoutDeck(animate) {
  deckOrder.forEach((ci, pos) => {
    const el = deckCards[ci];
    const vars = { xPercent: -50, yPercent: -50, y: pos * 18 - 24, x: pos * 10, scale: 1 - pos * 0.05, rotate: pos === 0 ? -2 : pos % 2 ? 3 : -4, zIndex: 10 - pos, opacity: pos > 3 ? 0 : 1 - pos * 0.12 };
    if (animate) gsap.to(el, { ...vars, duration: 0.7, ease: "expo.out" });
    else gsap.set(el, vars);
  });
}
layoutDeck(false);
setInterval(() => {
  if (reduced) return;
  const top = deckCards[deckOrder[0]];
  gsap.timeline()
    .to(top, { y: -150, x: 60, rotate: 12, duration: 0.45, ease: "power2.in" })
    .add(() => { deckOrder.push(deckOrder.shift()); layoutDeck(true); });
}, 2400);

let tweetsLoaded = false;
ScrollTrigger.create({
  trigger: "[data-tweets]",
  start: "top 140%",
  onEnter: () => {
    if (tweetsLoaded) return;
    tweetsLoaded = true;
    const sc = document.createElement("script");
    sc.src = "https://platform.twitter.com/widgets.js";
    sc.async = true;
    sc.onload = () => setTimeout(() => ScrollTrigger.refresh(), 1500);
    document.body.appendChild(sc);
  },
});

const qas = [...document.querySelectorAll("[data-qa]")];
function setQA(i, open, instant) {
  const b = qas[i].querySelector(".q"), a = qas[i].querySelector(".a");
  b.setAttribute("aria-expanded", open ? "true" : "false");
  gsap.to(a, { height: open ? "auto" : 0, duration: instant ? 0 : 0.5, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
}
qas.forEach((qa, i) => {
  qa.querySelector(".q").addEventListener("click", () => {
    const isOpen = qa.querySelector(".q").getAttribute("aria-expanded") === "true";
    qas.forEach((_, k) => setQA(k, k === i ? !isOpen : false));
  });
});
setQA(0, true, true);

const feedSec = document.querySelector("[data-feed]");
const memories = [...document.querySelectorAll("[data-memory]")];
const countEl = document.querySelector("[data-feed-count]");
const titleEl = document.querySelector("[data-feed-title]");
const subEl = document.querySelector("[data-feed-sub]");
const crumbs = document.querySelector("[data-crumbs]");
const titleHTML = titleEl.innerHTML, subText = subEl.textContent;

ScrollTrigger.create({
  trigger: feedSec,
  start: "top 45%",
  onEnter: () => { state.finale = true; if (!state.shown) { state.shown = true; gsap.to(layer, { opacity: 1, duration: 0.3 }); } },
  onLeaveBack: () => { state.finale = false; feedState.sleeping = false; cat.setState("idle"); },
});

function bowlPoint() {
  const r = bowl.getBoundingClientRect();
  return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.3 };
}
function burst() {
  for (let i = 0; i < 9; i++) {
    const c = document.createElement("i");
    crumbs.appendChild(c);
    const a = -Math.PI * (0.15 + Math.random() * 0.7);
    gsap.fromTo(c, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(a) * gsap.utils.random(20, 50), y: Math.sin(a) * gsap.utils.random(20, 46), scale: 0.3, opacity: 0, duration: 0.7, ease: "power2.out", onComplete: () => c.remove() });
  }
}
function feed(el) {
  if (el.classList.contains("eaten")) return;
  el.classList.add("eaten");
  const r = el.getBoundingClientRect();
  const b = bowlPoint();
  const dx = b.x - (r.left + r.width / 2), dy = b.y - (r.top + r.height / 2);
  gsap.to(el, { x: `+=${dx}`, y: `+=${dy}`, scale: 0.15, rotate: 20, opacity: 0, duration: 0.65, ease: "power2.in", onComplete: () => {
    burst();
    feedState.count++;
    countEl.textContent = `${feedState.count} / 3 memories kept safe`;
    cat.setState("eat");
    gsap.delayedCall(1.3, () => {
      if (feedState.count >= 3) {
        feedState.sleeping = true;
        cat.setState("sleep");
        feedSec.classList.add("fed");
        titleEl.innerHTML = 'Fed on memories. <span class="serif">Forgets nothing.</span>';
        subEl.textContent = "That’s minimi.";
        countEl.textContent = "3 / 3 memories kept safe";
      } else cat.setState("sit");
    });
  } });
}
memories.forEach((el) => {
  let sx = 0, sy = 0, moved = false, dragging = false;
  el.addEventListener("pointerdown", (e) => {
    if (el.classList.contains("eaten")) return;
    dragging = true; moved = false; sx = e.clientX; sy = e.clientY;
    el.setPointerCapture(e.pointerId);
    gsap.to(el, { scale: 1.06, duration: 0.2 });
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 6) moved = true;
    gsap.set(el, { x: dx, y: dy });
  });
  el.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    const r = el.getBoundingClientRect(), b = bowlPoint();
    const near = Math.hypot(r.left + r.width / 2 - b.x, r.top + r.height / 2 - b.y) < 150;
    if (!moved || near) feed(el);
    else gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" });
  });
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); feed(el); } });
});
document.querySelector("[data-feed-replay]").addEventListener("click", () => {
  feedState.count = 0;
  feedState.sleeping = false;
  feedSec.classList.remove("fed");
  titleEl.innerHTML = titleHTML;
  subEl.textContent = subText;
  countEl.textContent = "0 / 3 memories kept safe";
  memories.forEach((el, i) => {
    el.classList.remove("eaten");
    gsap.fromTo(el, { x: 0, y: -40, opacity: 0, scale: 0.8, rotate: 0 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, delay: i * 0.12, ease: "back.out(1.8)" });
  });
  cat.setState("sit");
});
window.__feed = () => memories.forEach((el, i) => setTimeout(() => feed(el), i * 1900));
