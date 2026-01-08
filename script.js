// ===============================
// 🔗 URL ของ Cloudflare Worker
// ===============================
const COUNTER_API = "https://cert-worker.littlebubuzmm.workers.dev";
const workerUrl = "https://cert-worker.littlebubuzmm.workers.dev";
// ===============================
// 🔗 Sheet สำหรับบันทึกข้อมูล
// ===============================
const SHEET_URL =
  "https://api.sheetbest.com/sheets/8fb1012f-f2fc-456c-80dd-55fb69f832bc";

// ===============================
// ⏳ Loading modal
// ===============================
function showLoading() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.style.display = "flex";
}

function hideLoading() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", hideLoading);

// ===============================
// 🔢 แปลงเลขเป็นไทย
// ===============================
function toThaiNumber(input) {
  const thai = ["๐","๑","๒","๓","๔","๕","๖","๗","๘","๙"];
  return input.toString().replace(/\d/g, d => thai[d]);
}

// ===============================
// 🔢 ขอเลขใหม่จาก Worker
// ===============================
async function genNumber() {
  const res = await fetch(COUNTER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "next" })
  });

  if (!res.ok) throw new Error("Cannot get number");

  const data = await res.json();
  return String(data.number).padStart(3, "0");
}

// ===============================
// 🎨 วาดใบเกียรติบัตร
// ===============================
function drawCertificate(name, number) {
  return new Promise((resolve, reject) => {
    const canvas = document.getElementById("certCanvas");
    const ctx = canvas.getContext("2d");

    const bg = new Image();
    bg.src = "cer30test.png";

    bg.onload = async () => {
      await document.fonts.ready;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      ctx.font = "700 52px 'IBM Plex Sans Thai'";
      ctx.fillStyle = "#b76f1b";
      ctx.textAlign = "center";
      ctx.fillText(name, canvas.width / 2, 280);

      const numberThai = toThaiNumber(number);
      ctx.font = "22px 'Roboto'";
      ctx.textAlign = "right";
      ctx.fillText(numberThai, canvas.width - 130, 70);

      resolve();
    };

    bg.onerror = () => reject("โหลดภาพไม่สำเร็จ");
  });
}

// ===============================
// 🚀 MAIN
// ===============================
async function generateCert() {
  const nameInput = document.getElementById("nameInput");
  const generateBtn = document.getElementById("generateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const title = document.getElementById("title");

  const name = nameInput.value.trim();
  if (!name) {
    alert("กรุณากรอกชื่อ");
    return;
  }

  showLoading();

  try {
    const number = await genNumber();
    await drawCertificate(name, number);

    hideLoading();

    title.innerText = "สร้างเรียบร้อยแล้ว !";
    nameInput.style.display = "none";
    generateBtn.style.display = "none";
    downloadBtn.style.display = "block";

    // บันทึกลง Google Sheet (ไม่ await)
    fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        number,
        date: new Date().toLocaleString("th-TH"),
        device: navigator.platform,
        userAgent: navigator.userAgent
      })
    }).catch(console.error);

  } catch (err) {
    hideLoading();
    alert("เกิดข้อผิดพลาด");
    console.error(err);
  }
}

async function resetNumber() {
  const response = await fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset" })
  });

  const data = await response.json();
  if (data.success) {
    alert("Reset สำเร็จ! เลขใหม่: " + data.number);
  } else {
    alert("เกิดข้อผิดพลาด");
  }
  await fetch(SHEET_URL,{
          method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "__RESET__",
        number: "",
        date: new Date().toLocaleString("th-TH"),
        device: "ADMIN",
        userAgent: "RESET"
      })

  })
}

// ผูกปุ่ม reset
document.getElementById("resetBtn").addEventListener("click", resetNumber);


// ===============================
// ⬇ ดาวน์โหลด
// ===============================
function downloadCert() {
  const canvas = document.getElementById("certCanvas");
  const link = document.createElement("a");
  link.download = "cer30test.png";
  link.href = canvas.toDataURL("image/jpeg");
  link.click();
}
