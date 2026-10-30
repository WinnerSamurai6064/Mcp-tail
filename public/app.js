const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const count = document.getElementById("count");
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");

async function load() {
  try {
    const files = await (await fetch("manifest.json")).json();
    count.textContent = `${files.length} image${files.length === 1 ? "" : "s"}`;
    empty.hidden = files.length > 0;
    files.forEach((f) => {
      const img = document.createElement("img");
      img.src = `images/${encodeURIComponent(f)}`;
      img.alt = f;
      img.loading = "lazy";
      img.onclick = () => { lbImg.src = img.src; lb.hidden = false; };
      grid.appendChild(img);
    });
  } catch {
    empty.hidden = false;
  }
}

lb.onclick = () => { lb.hidden = true; };
load();
