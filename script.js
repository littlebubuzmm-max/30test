

// ✅ ตั้งค่า API (sheet.best)

const SHEET_URL =
"https://api.sheetbest.com/sheets/8fb1012f-f2fc-456c-80dd-55fb69f832bc"

// ✅ Loading Modal

function showLoading() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.style.display = "flex";
}

function hideLoading() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.style.display = "none";
}
function toThaiNumber(input) { const thai = ["๐","๑","๒","๓","๔","๕","๖","๗","๘","๙"]; return input.toString().replace(/\d/g, d => thai[d]); }
// ปิด loading แน่นอนตอนรีเฟรชหน้า
document.addEventListener("DOMContentLoaded", hideLoading);


//  อ่านเลขล่าสุด (รองรับ RESET)

async function getLastNumber() {
  const res = await fetch(SHEET_URL);
  const rows = await res.json();
  if (rows.length === 0) return 0;

  let lastResetIndex = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].name === "__RESET__") {
      lastResetIndex = i;
      break;
    }
  }

  for (let i = rows.length - 1; i > lastResetIndex; i--) {
    const n = parseInt(rows[i].number);
    if (!isNaN(n)) return n;
  }

  return 0;
}

// =======================================
// ✅ สร้างเลขรันใหม่
// =======================================
async function genNumber() {
  const lastNum = await getLastNumber();
  return String(lastNum + 1).padStart(3, "0");
}

// =======================================
// 🎨 วาดใบเกียรติบัตร (Promise)
// =======================================
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

      // ชื่อ
      ctx.font = "700 52px 'IBM Plex Sans Thai'";
      ctx.fillStyle = "#b76f1b";
      ctx.textAlign = "center";
      ctx.fillText(name, canvas.width / 2, 280);

      // เลขที่
      const numberThai = toThaiNumber(number);
      ctx.font = "22px 'Roboto'";
      ctx.textAlign = "right";
      ctx.fillText(numberThai, canvas.width - 130, 70);

      resolve();
    };

    bg.onerror = () => reject("โหลดภาพ cer30test.png ไม่สำเร็จ");
  });
}

// =======================================
// ✅ สร้างเกียรติบัตร (MAIN)
// =======================================
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

    // ✅ รอจนวาดใบเซอร์เสร็จ
    await drawCertificate(name, number);

    // ✅ ปิด loading ทันที
    hideLoading();

    // ===============================
    // ✅ ปรับหน้าจอหลังสร้างเสร็จ
    // ===============================
    title.innerText = "สร้างเรียบร้อยแล้ว !";
    nameInput.style.display = "none";
    generateBtn.style.display = "none";
    downloadBtn.style.display = "block";

    // ===============================
    // 🔥 บันทึกข้อมูล (ไม่ await)
    // ===============================
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



// =======================================
// ⬇ ดาวน์โหลด PNG
// =======================================
function downloadCert() {
  const canvas = document.getElementById("certCanvas");
  const link = document.createElement("a");
  link.download = "cer30test.png";
  link.href = canvas.toDataURL("image/jpeg");
  link.click();
}

// =======================================
// 🔥 ADMIN: รีเซ็ตเลขรัน
// =======================================
async function resetData() {
  if (!confirm("ต้องการรีเซ็ตเลขรันกลับเป็น 001 ใช่หรือไม่?")) return;

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

  alert("รีเซ็ตเรียบร้อย");
}
