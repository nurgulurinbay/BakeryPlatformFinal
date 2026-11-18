// ===== Light / Dark mode (saved in localStorage) =====
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");
function applyTheme(t) {
  root.setAttribute("data-theme", t);
  themeBtn.textContent = t === "dark" ? "☀️ Day" : "🌙 Night";
}
applyTheme(localStorage.getItem("theme") || "light");
themeBtn.addEventListener("click", () => {
  const t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", t);
  applyTheme(t);
});

// ===== Form validation (no HTML validation attributes) =====
const rules = {
  required: v => v.trim() ? "" : "This field is required.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email, e.g. name@example.com.",
  phone: v => /^\+?[0-9\s-]{10,15}$/.test(v.trim()) ? "" : "Enter a valid phone number (10-15 digits).",
  password: v => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v) ? "" : "Password needs 8+ characters, with letters and numbers."
};
// Checks every field with data-rule inside the form and shows messages under the field
function validate(form) {
  let ok = true;
  form.querySelectorAll("[data-rule]").forEach(input => {
    if (input.closest("[hidden]")) return; // skip fields of hidden form steps
    let msg = "";
    for (const r of input.dataset.rule.split(" ")) {
      msg = rules[r](input.value);
      if (msg) break;
    }
    input.nextElementSibling.textContent = msg;
    if (msg) ok = false;
  });
  return ok;
}
// Connects a form to a handler that runs only when validation passes
function handleForm(id, onValid) {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate(form)) return;
    // Spinner and disabled button while the "server" works
    const btn = form.querySelector("[type='submit']");
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Please wait...';
    setTimeout(() => { btn.disabled = false; btn.innerHTML = label; onValid(form); }, 800);
  });
  form.addEventListener("reset", () => form.querySelectorAll(".error").forEach(e => e.textContent = ""));
}
// Temporary toast notification
function showToast(message) {
  const el = document.createElement("div");
  el.className = "toast align-items-center text-bg-success border-0";
  el.innerHTML = '<div class="d-flex"><div class="toast-body"></div></div>';
  el.querySelector(".toast-body").textContent = message;
  document.getElementById("toast-box").appendChild(el);
  new bootstrap.Toast(el, { delay: 2500 }).show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}
const show = id => document.getElementById(id).hidden = false;

// ===== Order and Contact forms =====
handleForm("order-form", form => {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.push({ name: form["order-name"].value, item: form["order-item"].value });
  localStorage.setItem("orders", JSON.stringify(orders));
  form.reset(); show("order-success"); showToast("Order request saved!");
});
handleForm("contact-form", form => { form.reset(); show("contact-success"); showToast("Message sent!"); });

// ===== Authentication simulation =====
handleForm("signup-form", form => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const email = form["su-email"].value.trim().toLowerCase();
  const msg = document.getElementById("su-msg");
  msg.hidden = false;
  if (users.some(u => u.email === email)) { msg.textContent = "This email is already registered."; return; }
  users.push({ name: form["su-name"].value.trim(), email, phone: form["su-phone"].value.trim(), password: form["su-pass"].value });
  localStorage.setItem("users", JSON.stringify(users));
  msg.textContent = "Account created! You can log in now.";
  form.reset();
  showToast("Account created!");
});
handleForm("login-form", form => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const email = form["li-email"].value.trim().toLowerCase();
  const user = users.find(u => u.email === email && u.password === form["li-pass"].value);
  if (!user) { document.getElementById("li-msg").textContent = "Wrong email or password."; return; }
  localStorage.setItem("currentUser", user.email);
  window.location.href = "profile.html";
});
// Profile page: show stored details or send the visitor to log in
if (document.getElementById("pf-name")) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(u => u.email === localStorage.getItem("currentUser"));
  if (!user) window.location.href = "auth.html";
  else {
    document.getElementById("pf-name").textContent = user.name;
    document.getElementById("pf-email").textContent = user.email;
    document.getElementById("pf-phone").textContent = user.phone;
  }
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "auth.html";
  });
}

// ===== Menu: search + category filter (last search saved) =====
const menuList = document.getElementById("menu-list");
if (menuList) {
  const items = [
  { name: "Sourdough Bread", cat: "Bread", price: "$4", text: "Crusty loaf baked every morning.", img: "images/menu-page1.jpg" },
  { name: "Rye Bread", cat: "Bread", price: "$4", text: "Dense, dark and slightly sweet.", img: "images/menu-page2.jpg" },
  { name: "Butter Croissant", cat: "Pastry", price: "$3", text: "Handmade, flaky and golden.", img: "images/menu-page3.jpg" },
  { name: "Cinnamon Roll", cat: "Pastry", price: "$3", text: "Soft roll with sweet glaze.", img: "images/menu-page4.jpg" },
  { name: "Apple Danish", cat: "Pastry", price: "$3", text: "Fresh apples in puff pastry.", img: "images/menu-page5.jpg" },
  { name: "Birthday Cake", cat: "Cake", price: "$25", text: "Custom cake for any occasion.", img: "images/menu-page6.jpg" },
  { name: "Chocolate Cake", cat: "Cake", price: "$20", text: "Rich layers with dark chocolate.", img: "images/menu-page7.jpg" },
  { name: "Berry Cheesecake", cat: "Cake", price: "$22", text: "Creamy cheesecake with berries.", img: "images/menu-page8.jpg" }
];
  const search = document.getElementById("menu-search");
  const cat = document.getElementById("menu-category");
  const saved = JSON.parse(localStorage.getItem("menuFilter") || "{}");
  search.value = saved.q || ""; cat.value = saved.c || "All";
  // Wraps the searched text in <mark>
  function highlight(text, q) {
    if (!q) return text;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp("(" + safe + ")", "ig"), "<mark>$1</mark>");
  }
  function render() {
    const q = search.value.trim().toLowerCase();
    localStorage.setItem("menuFilter", JSON.stringify({ q: search.value, c: cat.value }));
    const found = items.filter(i => (cat.value === "All" || i.cat === cat.value) && i.name.toLowerCase().includes(q));
    document.getElementById("menu-count").textContent = found.length + " product(s) found";
    menuList.innerHTML = found.map(i => `<div class="col-12 col-md-6 col-lg-3"><div class="card h-100"><img loading="lazy" src="${i.img}" class="card-img-top" alt="${i.name}"><div class="card-body d-flex flex-column"><h3 class="h5">${highlight(i.name, q)}</h3><p>${i.text}</p><p class="mt-auto"><strong>${i.price}</strong> <span class="badge badge-cat">${i.cat}</span></p><a class="btn btn-primary" href="order.html">Order</a></div></div></div>`).join("");
  }
  // Autocomplete suggestions under the search box
  const suggest = document.getElementById("menu-suggest");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    const names = q ? items.filter(i => i.name.toLowerCase().includes(q)).slice(0, 5) : [];
    suggest.innerHTML = names.map(i => `<button type="button" class="list-group-item list-group-item-action">${i.name}</button>`).join("");
    suggest.hidden = names.length === 0;
    render();
  });
  suggest.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") { search.value = e.target.textContent; suggest.hidden = true; render(); }
  });
  document.addEventListener("click", e => { if (e.target !== search) suggest.hidden = true; });
  cat.addEventListener("change", render);
  render();
}

// ===== Gallery: public API (TheMealDB desserts) =====
const apiList = document.getElementById("api-list");
if (apiList) {
  const status = document.getElementById("api-status");
  async function loadDesserts() {
    status.textContent = "Loading dessert ideas...";
    apiList.innerHTML = "";
    try {
      const res = await fetch("https://www.themealdb.com/api/json/v1/1/filter.php?c=Dessert");
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      const picks = data.meals.sort(() => Math.random() - 0.5).slice(0, 6);
      apiList.innerHTML = picks.map(m => `<div class="col-6 col-md-4 col-lg-2"><div class="card h-100"><img loading="lazy" src="${m.strMealThumb}" class="card-img-top" alt="${m.strMeal}"><div class="card-body"><p class="mb-0">${m.strMeal}</p></div></div></div>`).join("");
      status.textContent = "";
    } catch (err) {
      status.innerHTML = '<span class="error">Could not load dessert ideas. Check your connection and try again.</span>';
    }
  }
  document.getElementById("reload-desserts").addEventListener("click", loadDesserts);
  loadDesserts();
}

// ===== Home page interactive features =====
if (document.getElementById("time-greeting")) {
  // Greeting by time of day
  const hour = new Date().getHours();
  let hello;
  switch (true) {
    case hour < 12: hello = "Good morning"; break;
    case hour < 18: hello = "Good afternoon"; break;
    default: hello = "Good evening";
  }
  document.getElementById("time-greeting").textContent = hello + "! Welcome to Sweet Crumb Bakery";

  // Personal greeting (name saved in localStorage)
  const greetOut = document.getElementById("personal-greeting");
  const savedName = localStorage.getItem("visitorName");
  if (savedName) greetOut.textContent = "Welcome back, " + savedName + "!";
  handleForm("greeting-form", form => {
    const name = form["user-name"].value.trim();
    localStorage.setItem("visitorName", name);
    greetOut.textContent = "Hello, " + name + "! Enjoy your visit.";
  });

  // Star rating (saved in localStorage)
  const stars = document.querySelectorAll(".star");
  const ratingText = document.getElementById("rating-value");
  function showRating(n) {
    stars.forEach(s => s.classList.toggle("active", Number(s.dataset.value) <= n));
    ratingText.textContent = n ? "Your rating: " + n + " / 5" : "Click a star to rate us";
  }
  showRating(Number(localStorage.getItem("rating")) || 0);
  stars.forEach(s => s.addEventListener("click", () => {
    localStorage.setItem("rating", s.dataset.value);
    showRating(Number(s.dataset.value));
  }));

  // Live date and time
  const dateBox = document.getElementById("date-time");
  const tick = () => dateBox.textContent = new Date().toLocaleString();
  tick(); setInterval(tick, 1000);

  // Background colour changer (reset when the theme changes)
  const bgColors = { light: ["#fff7f0", "#fdeede", "#f6e3d3", "#fff3d6"], dark: ["#1e1511", "#251a2a", "#16241d", "#2b1a1a"] };
  let bgIndex = 0;
  document.getElementById("color-change-btn").addEventListener("click", () => {
    const list = bgColors[root.getAttribute("data-theme")];
    bgIndex = (bgIndex + 1) % list.length;
    root.style.setProperty("--bg", list[bgIndex]);
  });
  themeBtn.addEventListener("click", () => root.style.removeProperty("--bg"));

  // Newsletter popup
  const popup = document.getElementById("contact-popup");
  document.getElementById("open-popup-btn").addEventListener("click", () => popup.hidden = false);
  document.getElementById("close-popup-btn").addEventListener("click", () => popup.hidden = true);
  popup.addEventListener("click", e => { if (e.target === popup) popup.hidden = true; });
  handleForm("popup-form", form => {
    const subs = JSON.parse(localStorage.getItem("subscribers") || "[]");
    subs.push(form["popup-email"].value.trim());
    localStorage.setItem("subscribers", JSON.stringify(subs));
    form.reset(); show("popup-success"); showToast("Subscribed successfully!");
  });
}

// ===== Scroll progress bar and back-to-top button =====
const bar = document.getElementById("scroll-bar");
const toTop = document.getElementById("to-top");
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  toTop.style.display = window.scrollY > 300 ? "block" : "none";
});
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ===== Animated number counters (start when visible) =====
const counters = document.querySelectorAll(".counter");
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target, target = Number(el.dataset.target);
    let current = 0;
    const timer = setInterval(() => {
      current += Math.ceil(target / 60);
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current + "+";
    }, 25);
    counterObserver.unobserve(el);
  });
});
counters.forEach(c => counterObserver.observe(c));

// ===== Copy to clipboard buttons =====
document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      btn.textContent = "✓ Copied";
      showToast("Copied to clipboard!");
      setTimeout(() => btn.textContent = "Copy", 2000);
    });
  });
});

// ===== FAQ accordion (smooth open / close) =====
document.querySelectorAll(".faq-q").forEach(question => {
  question.addEventListener("click", () => {
    const answer = question.nextElementSibling;
    const isOpen = question.classList.toggle("open");
    answer.style.maxHeight = isOpen ? answer.scrollHeight + "px" : "0";
    question.setAttribute("aria-expanded", isOpen);
  });
});

// ===== Multi-step order form (Next / Back) =====
const step1 = document.getElementById("step-1");
if (step1) {
  const step2 = document.getElementById("step-2");
  const orderForm = document.getElementById("order-form");
  document.getElementById("next-step").addEventListener("click", () => {
    if (validate(orderForm)) { step1.hidden = true; step2.hidden = false; }
  });
  document.getElementById("prev-step").addEventListener("click", () => { step2.hidden = true; step1.hidden = false; });
  orderForm.addEventListener("reset", () => { step2.hidden = true; step1.hidden = false; });
}


// ===== Random baking fact (About) =====
const factBtn = document.getElementById("fact-btn");
if (factBtn) {
  const facts = [
    "A baguette needs only four ingredients: flour, water, yeast and salt.",
    "A sourdough starter can stay alive and be used for many years.",
    "Croissants are based on the Austrian kipferl pastry.",
    "Butter in croissant dough creates the flaky layers when it melts in the oven."
  ];
  factBtn.addEventListener("click", () => {
    document.getElementById("fact-text").textContent = facts[Math.floor(Math.random() * facts.length)];
  });
}

// ===== Sound effect button (Home) =====
const bellBtn = document.getElementById("bell-btn");
if (bellBtn) {
  bellBtn.addEventListener("click", () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  });
}

// ===== Arrow keys: navbar links, carousel (Home), thumbnails (Gallery) =====
document.addEventListener("keydown", e => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const dir = e.key === "ArrowRight" ? 1 : -1;
  const links = [...document.querySelectorAll(".navbar .nav-link")];
  const at = links.indexOf(document.activeElement);
  if (at >= 0) { links[(at + dir + links.length) % links.length].focus(); return; }
  const carousel = document.getElementById("bakeryCarousel");
  if (carousel) {
    const c = bootstrap.Carousel.getOrCreateInstance(carousel);
    dir > 0 ? c.next() : c.prev();
  } else if (thumbs.length) {
    const now = thumbs.findIndex(t => t.classList.contains("active"));
    selectThumb(thumbs[(now + dir + thumbs.length) % thumbs.length]);
  }
});

// ===== Language selector (EN / RU / KK) for the navbar and headings =====
const translations = {
  ru: { "Home": "Главная", "Menu": "Меню", "About": "О нас", "Gallery": "Галерея", "Order": "Заказ", "Contact": "Контакты", "Account": "Аккаунт",
    "Our Menu": "Наше меню", "Order Request": "Заявка на заказ", "Contact Us": "Связаться с нами", "My Profile": "Мой профиль", "Sign Up": "Регистрация", "Log In": "Вход",
    "Dessert Ideas": "Идеи десертов", "Frequently Asked Questions": "Частые вопросы", "Our Team": "Наша команда", "Bakery in Numbers": "Пекарня в цифрах",
    "Baking Fact": "Факт о выпечке", "Why Choose Our Bakery?": "Почему выбирают нас?", "Our Bakery Gallery": "Галерея пекарни", "Interactive Features": "Интерактив",
    "About Sweet Crumb Bakery": "О Sweet Crumb Bakery", 'Freshly Baked, <span class="highlight">Every Day</span>': 'Свежая выпечка, <span class="highlight">каждый день</span>' },
  kk: { "Home": "Басты бет", "Menu": "Мәзір", "About": "Біз туралы", "Gallery": "Галерея", "Order": "Тапсырыс", "Contact": "Байланыс", "Account": "Аккаунт",
    "Our Menu": "Біздің мәзір", "Order Request": "Тапсырыс беру", "Contact Us": "Бізбен байланысыңыз", "My Profile": "Менің профилім", "Sign Up": "Тіркелу", "Log In": "Кіру",
    "Dessert Ideas": "Десерт идеялары", "Frequently Asked Questions": "Жиі қойылатын сұрақтар", "Our Team": "Біздің команда", "Bakery in Numbers": "Нақты сандармен",
    "Baking Fact": "Нан пісіру фактісі", "Why Choose Our Bakery?": "Неге бізді таңдайды?", "Our Bakery Gallery": "Нанхана галереясы", "Interactive Features": "Интерактив",
    "About Sweet Crumb Bakery": "Sweet Crumb Bakery туралы", 'Freshly Baked, <span class="highlight">Every Day</span>': 'Жаңа піскен, <span class="highlight">күн сайын</span>' }
};
const langSelect = document.getElementById("lang-select");
function setLanguage(lang) {
  document.querySelectorAll("[data-t]").forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.innerHTML; // remember the English text
    el.innerHTML = (translations[lang] && translations[lang][el.dataset.en]) || el.dataset.en;
  });
  document.documentElement.lang = lang;
}
langSelect.value = localStorage.getItem("lang") || "en";
setLanguage(langSelect.value);
langSelect.addEventListener("change", () => {
  localStorage.setItem("lang", langSelect.value);
  setLanguage(langSelect.value);
});
