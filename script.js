const root = document.documentElement;

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.getElementById("site-menu");

function setMenu(open) {
  const scrollbarWidth = open ? window.innerWidth - document.documentElement.clientWidth : 0;
  root.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
  root.classList.toggle("menu-open", open);
  document.body.classList.toggle("menu-open", open);
  siteMenu.classList.toggle("is-open", open);
  siteMenu.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => {
  setMenu(!document.body.classList.contains("menu-open"));
});

siteMenu.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    setMenu(false);
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
});

addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
});

const marqueeTrack = document.querySelector(".marquee-track");
const marqueeGroup = marqueeTrack.querySelector(".marquee-group");
let marqueeOffset = 0;
let marqueeLoopWidth = 1;
let marqueeLastTime = 0;

function measureMarquee() {
  marqueeLoopWidth = marqueeGroup.getBoundingClientRect().width || 1;
  marqueeOffset %= marqueeLoopWidth;
}

function animateMarquee(time) {
  if (!marqueeLastTime) marqueeLastTime = time;
  const elapsed = Math.min(40, time - marqueeLastTime);
  marqueeLastTime = time;
  marqueeOffset -= elapsed * .055;
  if (Math.abs(marqueeOffset) >= marqueeLoopWidth) marqueeOffset += marqueeLoopWidth;
  marqueeTrack.style.transform = `translate3d(${marqueeOffset}px, 0, 0)`;
  requestAnimationFrame(animateMarquee);
}

measureMarquee();
if (document.fonts?.ready) document.fonts.ready.then(measureMarquee);
addEventListener("resize", measureMarquee);
requestAnimationFrame(animateMarquee);

const ugcContent = JSON.parse(document.getElementById("ugc-content").textContent);
const reelsGrid = document.getElementById("latest-reels-grid");

ugcContent.forEach(({ title, thumbnail, link }, index) => {
  const card = document.createElement("a");
  const media = document.createElement("div");
  const number = document.createElement("b");
  const meta = document.createElement("div");
  const text = document.createElement("div");
  const type = document.createElement("p");
  const heading = document.createElement("h4");
  const arrow = document.createElement("span");

  card.className = "reel-card tilt-card";
  card.href = link || "#";
  if (link) {
    card.target = "_blank";
    card.rel = "noreferrer";
  } else {
    card.addEventListener("click", (event) => event.preventDefault());
  }

  media.className = "reel-media";
  media.setAttribute("role", "img");
  media.setAttribute("aria-label", `${title} thumbnail`);

  if (thumbnail) {
    const image = document.createElement("img");
    image.src = thumbnail;
    image.alt = `${title} thumbnail`;
    image.loading = index < 3 ? "eager" : "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.remove());
    media.appendChild(image);
  } else {
    media.classList.add("reel-placeholder", `reel-placeholder-${["one", "two", "three"][index % 3]}`);
    const placeholder = document.createElement("span");
    placeholder.textContent = "THUMBNAIL";
    media.appendChild(placeholder);
  }

  number.className = "reel-number";
  number.textContent = String(index + 1).padStart(2, "0");
  media.appendChild(number);

  meta.className = "project-meta";
  type.textContent = "UGC content";
  heading.textContent = title;
  arrow.textContent = "↗";
  text.append(type, heading);
  meta.append(text, arrow);
  card.append(media, meta);
  reelsGrid.appendChild(card);
});

const videoProjects = [
  ["ALLWEB.MK", "Event visuals", "https://youtu.be/FKvMNd88GSQ", "https://img.youtube.com/vi/FKvMNd88GSQ/maxresdefault.jpg"],
  ["Literatura.mk", "Event recap", "https://youtu.be/QNsONcdGqq8", "https://img.youtube.com/vi/QNsONcdGqq8/maxresdefault.jpg"],
  ["SciVi", "Social campaign", "https://www.facebook.com/watch/?v=940102877023051", "https://dristevski.com/images/scivi.jpg"],
  ["Literatura Stores", "Brand film", "https://youtu.be/AmOpF0eS-OA", "https://img.youtube.com/vi/AmOpF0eS-OA/maxresdefault.jpg"],
  ["UNDP MK", "Impact story", "https://www.facebook.com/watch/?v=603657754393309", "https://dristevski.com/images/undp1.jpg"],
  ["UNDP", "New systems", "https://www.facebook.com/watch/?v=4674385525973608", "https://dristevski.com/images/undp2.jpg"],
  ["UNDP", "Control app", "https://www.facebook.com/watch/?v=1001611937126307", "https://dristevski.com/images/undp3.jpg"],
  ["Sam Svoj Barmen", "Branded content", "https://youtu.be/cg9ePsTWIO4", "https://img.youtube.com/vi/93clzL9Tw_E/maxresdefault.jpg"],
  ["#Komkast", "Video series", "https://youtu.be/RLWSNRApqs4", "https://img.youtube.com/vi/9IjjYciNyVo/maxresdefault.jpg"],
  ["Wellcast", "Podcast visuals", "https://youtu.be/hhkg03lHxgY", "https://img.youtube.com/vi/hhkg03lHxgY/maxresdefault.jpg"],
  ["Talk Nerdy", "Rumble series", "https://rumble.com/", "https://user-images.githubusercontent.com/122376776/222989350-7a79afb3-3af3-4be3-9f2c-d7fe6f244390.jpg"],
  ["Decal", "Social content", "https://www.facebook.com/", "https://dristevski.com/images/decal.jpg"],
  ["SVC", "Campaign edit", "https://www.facebook.com/", "https://dristevski.com/images/svc.jpg"],
  ["Brummel", "Social campaign", "https://www.instagram.com/", "https://dristevski.com/images/brummel1.jpg"],
  ["UNDP Live", "Event coverage", "https://www.facebook.com/", "https://dristevski.com/images/undp4.jpg"],
  ["Viva", "Commercial edit", "https://youtu.be/xuJZBZtHrOo", "https://img.youtube.com/vi/xuJZBZtHrOo/maxresdefault.jpg"],
  ["Analitika", "Explainer", "https://youtu.be/f7dlK31t4Tw", "https://img.youtube.com/vi/f7dlK31t4Tw/hqdefault.jpg"]
];

const campaignProjects = [
  ["Uslugi.gov.mk", "Public service campaign", "https://www.instagram.com/reel/DD7R6NjIC7Z/", "uslugigovmk.png"],
  ["Fibula Struga", "Travel campaign", "https://www.instagram.com/fibulatravelmk/reel/DKeMobzIBD1/", "fblstrg.png"],
  ["Fibula Teaser", "Campaign teaser", "https://www.instagram.com/fibulatravelmk/reel/DIlCmhuxu6a/", "fibws.png"],
  ["Land of Legends", "Destination campaign", "https://www.instagram.com/fibulatravelmk/reel/DIwJGrovdEX/", "fiblol.png"],
  ["Brainster+ Ani", "Education campaign", "https://www.instagram.com/reel/C2uunjwN9cL/", "bux.png"],
  ["Brainster+", "Flagship campaign", "https://www.instagram.com/reel/C04TzF4ubzk/", "bmini.png"],
  ["Brainster Bilten", "Social format", "https://www.instagram.com/reel/C31_MgpMdVg/", "bbilt.png"],
  ["JobFair Shorts", "Event campaign", "https://www.instagram.com/reel/C9UZrUQsUjp/", "bjf.png"],
  ["Meet the Students", "Profile series", "https://www.instagram.com/brainsternext/reel/C_C9l_2scqc/", "bnpr.png"],
  ["Event Aftermovie", "Live event", "https://www.instagram.com/reel/C5YnrEPsAcm/", "blab.png"],
  ["Early Booking", "Fibula campaign", "https://www.instagram.com/reel/DI3tZuTvA-A/", "fibnp.png"],
  ["Viva", "Product campaign", "https://www.instagram.com/reel/CR650ZcqhqR/", "xuJZBZtHrOo.jpg"],
  ["JobFair 02", "Social campaign", "https://www.instagram.com/reel/C8T-0MvsU4S/", "bsbp.png"],
  ["JobFair 03", "Social campaign", "https://www.instagram.com/reel/C8l5Lg7M6Yz/", "bfl.png"],
  ["JobFair 04", "Social campaign", "https://www.instagram.com/reel/DBv8Djts92l/", "bjf4.png"],
  ["Meet the Students 02", "Profile series", "https://www.instagram.com/brainsternext/reel/C_LQU0zMvpH/", "bnan.png"],
  ["Event Teaser", "Campaign teaser", "https://www.instagram.com/reel/C6L9w3Usep-/", "bsnp.png"],
  ["JobFair Aftermovie", "Event recap", "https://www.instagram.com/reel/C8CEsW1MnVe/", "bjf9.png"]
];

function projectCard([client, title, href, image], index, campaign = false) {
  const src = campaign ? `https://dristevski.com/images/${image}` : image;
  return `
    <a class="video-card tilt-card" href="${href}" target="_blank" rel="noreferrer">
      <div class="media-frame">
        <img src="${src}" alt="${client} - ${title}" loading="lazy" decoding="async">
        <span class="play-button">↗</span>
        <span class="project-type">${campaign ? "CAMPAIGN" : "VIDEO"}</span>
      </div>
      <div class="project-meta">
        <div><p>${client}</p><h4>${title}</h4></div>
      </div>
    </a>`;
}

document.getElementById("video-production-grid").innerHTML = videoProjects.map((item, index) => projectCard(item, index)).join("");
document.getElementById("campaign-grid").innerHTML = campaignProjects.map((item, index) => projectCard(item, index, true)).join("");

document.querySelectorAll("[data-expandable-projects]").forEach((section) => {
  const button = section.querySelector(".projects-show-more");
  const cards = [...section.querySelectorAll(".archive-grid > .video-card")];
  let expanded = false;

  const updateProjectVisibility = () => {
    const initialCount = innerWidth <= 980 ? 3 : 4;
    cards.forEach((card, index) => {
      card.hidden = !expanded && index >= initialCount;
    });
    const hasMore = cards.length > initialCount;
    button.hidden = expanded || !hasMore;
    section.querySelector(".projects-fade").hidden = expanded || !hasMore;
  };

  button.addEventListener("click", () => {
    expanded = true;
    section.classList.add("is-expanded");
    button.setAttribute("aria-expanded", "true");
    updateProjectVisibility();
  });

  addEventListener("resize", updateProjectVisibility);
  updateProjectVisibility();
});

const reelsShowMore = document.getElementById("reels-show-more");
let visibleReels = 3;

function updateVisibleReels() {
  const reelCards = [...reelsGrid.children];
  reelCards.forEach((card, index) => {
    card.hidden = index >= visibleReels;
  });
  reelsShowMore.hidden = visibleReels >= reelCards.length;
}

reelsShowMore.addEventListener("click", () => {
  visibleReels += 3;
  updateVisibleReels();
});

updateVisibleReels();

const nav = document.querySelector(".site-nav");
const progress = document.querySelector(".scroll-progress");
const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
const scrollMotionItems = [...document.querySelectorAll(".section-heading, .archive-header, .subsection-title, .contact-inner")];
let scrollY = window.scrollY;
let scrollTicking = false;

function updateScrollMotion() {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  const ambientProgress = Math.min(1, Math.max(0, scrollY / (innerHeight * .72)));
  const ambientEase = ambientProgress * ambientProgress * (3 - 2 * ambientProgress);
  root.style.setProperty("--ambient-scroll-progress", `${ambientEase}`);
  progress.style.width = `${maximum > 0 ? (scrollY / maximum) * 100 : 0}%`;
  nav.classList.toggle("scrolled", scrollY > 24);

  parallaxItems.forEach((item) => {
    const factor = Number(item.dataset.parallax);
    item.style.transform = `translate3d(0, ${scrollY * factor}px, 0)`;
  });
  scrollMotionItems.forEach((item, index) => {
    const bounds = item.getBoundingClientRect();
    const center = bounds.top + bounds.height / 2 - innerHeight / 2;
    const normalized = Math.max(-1, Math.min(1, center / innerHeight));
    item.style.setProperty("--scroll-x", `${normalized * (index % 2 ? -18 : 18)}px`);
    item.style.setProperty("--scroll-y", `${normalized * 10}px`);
  });
  scrollTicking = false;
}

addEventListener("scroll", () => {
  scrollY = window.scrollY;
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollMotion);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollMotion();

let targetX = innerWidth / 2;
let targetY = innerHeight / 3;
let glowX = targetX;
let glowY = targetY;
let dotX = targetX;
let dotY = targetY;

addEventListener("pointermove", (event) => {
  targetX = event.clientX;
  targetY = event.clientY;
}, { passive: true });

function cursorLoop() {
  glowX += (targetX - glowX) * .07;
  glowY += (targetY - glowY) * .07;
  dotX += (targetX - dotX) * .24;
  dotY += (targetY - dotY) * .24;
  root.style.setProperty("--mouse-x", `${glowX}px`);
  root.style.setProperty("--mouse-y", `${glowY}px`);
  root.style.setProperty("--cursor-x", `${dotX}px`);
  root.style.setProperty("--cursor-y", `${dotY}px`);
  requestAnimationFrame(cursorLoop);
}
cursorLoop();

document.querySelectorAll("a, button, .tilt-card").forEach((element) => {
  element.addEventListener("pointerenter", () => document.body.classList.add("cursor-active"));
  element.addEventListener("pointerleave", () => document.body.classList.remove("cursor-active"));
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const rotateY = ((x / bounds.width) - .5) * 5;
    const rotateX = ((y / bounds.height) - .5) * -5;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
    card.style.setProperty("--rx", `${rotateX}deg`);
    card.style.setProperty("--ry", `${rotateY}deg`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const bounds = item.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) * .14;
    const y = (event.clientY - bounds.top - bounds.height / 2) * .14;
    item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const featuredVideos = document.querySelectorAll(".featured-card video");
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.play().catch(() => {});
    else entry.target.pause();
  });
}, { threshold: .18 });

featuredVideos.forEach((video) => videoObserver.observe(video));

const aiImages = [
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/001.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/002.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/003.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/004.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/005.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/006.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/007.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/008.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/009.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/010.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/011.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/012.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/013.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/014.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/015.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/016.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/017.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/018.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/019.jpg",
  "https://raw.githubusercontent.com/dimidimi00/dimidimi00.github.io/refs/heads/main/images/AIDesign/020.jpg"
];

const carousel = document.getElementById("carousel");
const carouselStage = carousel.parentElement;
const meter = document.querySelector(".carousel-meter span");
const carouselCurrent = document.getElementById("carousel-current");
let carouselIndex = 0;
let dragStart = 0;
let dragOffset = 0;
let isDragging = false;
let autoPlay;

aiImages.forEach((src, index) => {
  const card = document.createElement("div");
  card.className = "carousel-card";
  card.dataset.label = `AI visual / ${String(index + 1).padStart(2, "0")}`;
  card.innerHTML = `<img src="${src}" alt="AI-assisted campaign visual ${index + 1}" loading="${index < 3 ? "eager" : "lazy"}" draggable="false">`;
  carousel.appendChild(card);
});

const carouselCards = [...carousel.children];

function carouselSpacing() {
  return Math.max(90, Math.min(270, carouselStage.clientWidth * .24));
}

function carouselOffset(index) {
  let offset = index - carouselIndex;
  const half = carouselCards.length / 2;
  if (offset > half) offset -= carouselCards.length;
  if (offset < -half) offset += carouselCards.length;
  return offset;
}

function renderCarousel() {
  const spacing = carouselSpacing();
  const dragProgress = dragOffset / spacing;

  carouselCards.forEach((card, index) => {
    const active = index === carouselIndex;
    const position = carouselOffset(index) + dragProgress;
    const distance = Math.abs(position);
    const visible = distance <= 2.35;
    const scale = Math.max(.62, 1 - distance * .16);
    const opacity = visible ? Math.max(.08, 1 - distance * .43) : 0;
    const depth = -distance * 115;
    const rotation = position * -17;

    card.classList.toggle("is-active", active);
    card.setAttribute("aria-hidden", visible ? "false" : "true");
    card.style.zIndex = String(Math.max(0, 10 - Math.round(distance * 3)));
    card.style.transform = `translate(-50%, -50%) translate3d(${position * spacing}px, 0, ${depth}px) rotateY(${rotation}deg) scale(${scale})`;
    card.style.opacity = String(opacity);
    card.style.filter = `brightness(${Math.max(.48, 1 - distance * .2)}) saturate(${Math.max(.55, 1 - distance * .16)})`;
  });
  meter.style.width = `${((carouselIndex + 1) / carouselCards.length) * 100}%`;
  carouselCurrent.textContent = String(carouselIndex + 1).padStart(2, "0");
}

function moveCarousel(direction) {
  carouselIndex = (carouselIndex + direction + carouselCards.length) % carouselCards.length;
  dragOffset = 0;
  renderCarousel();
  restartAutoPlay();
}

function restartAutoPlay() {
  clearInterval(autoPlay);
  if (carouselIndex < carouselCards.length - 1) {
    autoPlay = setInterval(() => moveCarousel(1), 3800);
  }
}

carouselStage.addEventListener("pointerdown", (event) => {
  isDragging = true;
  dragStart = event.clientX;
  carouselStage.classList.add("is-dragging");
  carouselStage.setPointerCapture(event.pointerId);
  clearInterval(autoPlay);
});
carouselStage.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  dragOffset = event.clientX - dragStart;
  renderCarousel();
});
carouselStage.addEventListener("pointerup", (event) => {
  if (!isDragging) return;
  isDragging = false;
  carouselStage.classList.remove("is-dragging");
  const movement = event.clientX - dragStart;
  if (Math.abs(movement) > 45) carouselIndex = (carouselIndex + (movement < 0 ? 1 : -1) + carouselCards.length) % carouselCards.length;
  dragOffset = 0;
  renderCarousel();
  restartAutoPlay();
});
carouselStage.addEventListener("pointercancel", () => {
  isDragging = false;
  carouselStage.classList.remove("is-dragging");
  dragOffset = 0;
  renderCarousel();
  restartAutoPlay();
});
document.getElementById("carousel-prev").addEventListener("click", () => moveCarousel(-1));
document.getElementById("carousel-next").addEventListener("click", () => moveCarousel(1));
addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") moveCarousel(-1);
  if (event.key === "ArrowRight") moveCarousel(1);
});
addEventListener("resize", renderCarousel);
renderCarousel();
restartAutoPlay();
