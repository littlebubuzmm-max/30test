// ===============================
// 🔗 URL ของ Cloudflare Worker
// ===============================
const COUNTER_API_NEXT = "https://cert-worker.littlebubuzmm.workers.dev/next";
const COUNTER_API_RESET = "https://cert-worker.littlebubuzmm.workers.dev/reset";
const SHEET_URL = "https://api.sheetbest.com/sheets/8fb1012f-f2fc-456c-80dd-55fb69f832bc";

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

document.addEventListener("DOMContentLoaded", () => {
  hideLoading();
});

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
  try {
    const res = await fetch(COUNTER_API_NEXT, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error("ไม่สามารถขอเลขได้");
    const data = await res.json();
    return String(data.number).padStart(3, "0");
  } catch (err) {
    console.error("genNumber error:", err);
    throw new Error("ไม่สามารถเชื่อมต่อ Worker ได้");
  }
}

// ===============================
// 🎨 วาดใบเกียรติบัตร
// ===============================
function drawCertificate(name, number) {
  return new Promise((resolve, reject) => {
    const canvas = document.getElementById("certCanvas");
    if (!canvas) return reject("ไม่พบ canvas");
    const ctx = canvas.getContext("2d");

    const bg = new Image();
    bg.src = "cer30test.png";

    bg.onload = async () => {
      await document.fonts.ready;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // ชื่อ
      ctx.font = "700 52px 'IBM Plex Sans Thai'";
      ctx.fillStyle = "#b76f1b";
      ctx.textAlign = "center";
      ctx.fillText(name, canvas.width / 2, 280);

      // เลขไทย
      ctx.font = "22px 'Roboto'";
      ctx.textAlign = "right";
      ctx.fillText(toThaiNumber(number), canvas.width - 130, 70);

      resolve();
    };

    bg.onerror = () => reject("โหลดภาพไม่สำเร็จ");
  });
}

// ===============================
// 🚀 สร้างใบเกียรติบัตร
// ===============================
async function generateCert() {
  const nameInput = document.getElementById("nameInput");
  const title = document.getElementById("title");
  const downloadBtn = document.getElementById("downloadBtn");
  const generateBtn = document.getElementById("generateBtn");

  if (!nameInput || !title) return alert("HTML ไม่ถูกต้อง");

  const name = nameInput.value.trim();
  if (!name) return alert("กรุณากรอกชื่อ");

  showLoading();

  try {
    const number = await genNumber();
    await drawCertificate(name, number);
    hideLoading();

    title.innerText = "สร้างเรียบร้อยแล้ว!";
    if (nameInput) nameInput.style.display = "none";
    if (generateBtn) generateBtn.style.display = "none";
    if (downloadBtn) downloadBtn.style.display = "block";

    // บันทึกลง Sheet
    await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        number,
        date: new Date().toLocaleString("th-TH"),
        device: navigator.platform,
        userAgent: navigator.userAgent
      })
    });

  } catch (err) {
    hideLoading();
    alert("เกิดข้อผิดพลาด: " + err.message);
    console.error(err);
  }
}

// ===============================
// 🔄 รีเซ็ตเลข (ตรวจสอบก่อนว่ามีปุ่ม)
async function resetNumber() {
  const resetBtn = document.getElementById("resetBtn");
  if (!resetBtn) return; // ไม่มีปุ่มก็ไม่ทำอะไร

  showLoading();
  try {
    const res = await fetch(COUNTER_API_RESET, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (data.number) {
      alert("รีเซ็ตสำเร็จ! เลขเริ่มต้น: " + data.number);

      await fetch(SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "__RESET__",
          number: "",
          date: new Date().toLocaleString("th-TH"),
          device: "ADMIN",
          userAgent: "RESET"
        })
      });
    } else {
      alert("เกิดข้อผิดพลาดในการรีเซ็ต");
    }
  } catch (err) {
    alert("เกิดข้อผิดพลาด: " + err.message);
    console.error(err);
  } finally {
    hideLoading();
  }
}

// ===============================
// ⬇ ดาวน์โหลด
// ===============================
function downloadCert() {
  const canvas = document.getElementById("certCanvas");
  if (!canvas) return alert("ไม่พบ canvas");
  const link = document.createElement("a");
  link.download = "certificate.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
