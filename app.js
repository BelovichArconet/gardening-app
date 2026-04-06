const APP_PIN = "1234";

// STATE
let workType = null;
let bags = 0;
let entries = [];
let storedTaxYear = parseInt(localStorage.getItem("taxYear"));
if (isNaN(storedTaxYear)) storedTaxYear = null;
let customers;

const savedCustomers = localStorage.getItem("customers");

try {
  const parsed = JSON.parse(savedCustomers);
  customers = Array.isArray(parsed) ? parsed : ["Medhurst Care Home"];
} catch {
  customers = ["Medhurst Care Home"];
}
let invoiceCount = parseInt(localStorage.getItem("invoiceCount"));
if (isNaN(invoiceCount)) invoiceCount = 0;
const saved = localStorage.getItem("entries");
if (saved) {
  try {
    const parsed = JSON.parse(saved);
entries = Array.isArray(parsed) ? parsed : [];
  } catch {
    entries = [];
  }
}

// PIN LOGIC
function checkPin() {
  const input = document.getElementById("pinInput").value;
  const error = document.getElementById("pinError");
  console.log("PIN ENTERED:", input);

  if (input === APP_PIN) {
    sessionStorage.setItem("unlocked", "true");
    showHome();
  } else {
    error.textContent = "Incorrect PIN";
  }

  if (input === APP_PIN) {
  sessionStorage.setItem("unlocked", "true");
  document.getElementById("pinInput").value = ""; // 👈 add this
  showHome();
}
}

// NAVIGATION
function showHome() {
  hideAll();

  document.getElementById("pinScreen").classList.add("hidden");
  document.getElementById("homeScreen").classList.remove("hidden");
}

function goToAdd() {
  hideAll();
  document.getElementById("addScreen").classList.remove("hidden");

  document.getElementById("dateInput").valueAsDate = new Date();

  renderCustomers();

  document.getElementById("extraItems").innerHTML = "";

  // ✅ Default selections
  const select = document.getElementById("customerSelect");
if (select.options.length > 0) {
  select.selectedIndex = 0;
}
  workType = null;

document.querySelectorAll(".work-btn").forEach(btn => {
  btn.classList.remove("active");
});
  bags = 0;

  document.getElementById("bagCount").textContent = 0;
  calculateTotal();
}

function goHome() {
  showHome();
}

function hideAll() {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
}

// WORK TYPE
function setWorkType(type) {
  workType = type;

  // reset styles
  document.querySelectorAll(".work-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  // highlight selected
  const btn = document.getElementById(type + "Btn");
if (btn) btn.classList.add("active");

  calculateTotal();
}

// BAGS
function changeBags(amount) {
  bags += amount;
  if (bags < 0) bags = 0;

  document.getElementById("bagCount").textContent = bags;
  calculateTotal();
}

// CALCULATE TOTAL
function calculateTotal() {
  let total = 0;

  if (!workType) {
  document.getElementById("total").textContent = 0;
  return;
}

if (workType === "full") total += 140;
if (workType === "half") total += 70;

  total += bags * 10;

  // ✅ loop through ALL extra inputs
  document.querySelectorAll(".extra-price").forEach(input => {
    total += parseFloat(input.value) || 0;
  });

  document.getElementById("total").textContent = total;
}

// SAVE (for now just logs)
function saveDay() {
  if (!workType) {
    alert("Please select work type");
    return;
  }

  const customer = document.getElementById("customerSelect").value;
  const date = document.getElementById("dateInput").value;

if (!customer) {
  alert("Please select a customer");
  return;
}

if (!date) {
  alert("Please select a date");
  return;
}

const extraItems = [];

document.querySelectorAll("#extraItems div").forEach(div => {
const nameInput = div.querySelector(".extra-name");
const priceInput = div.querySelector(".extra-price");

if (!nameInput || !priceInput) return;

const name = nameInput.value.trim();
const price = parseFloat(priceInput.value) || 0;

  if (name && price > 0) {
    extraItems.push({ name, price });
  }
});

  let total = 0;

  if (workType === "full") total += 140;
  if (workType === "half") total += 70;

  total += bags * 10;
  extraItems.forEach(item => {
  total += item.price;
});

  const entry = {
    date,
    workType,
    bags,
    extraItems,
    total,
    customer
  };

  entries.push(entry);
  localStorage.setItem("entries", JSON.stringify(entries));

  renderEntries();

  alert("Work day saved");

document.getElementById("extraItems").innerHTML = "";

  workType = null;

document.querySelectorAll(".work-btn").forEach(btn => {
  btn.classList.remove("active");
});

  bags = 0;
  document.getElementById("bagCount").textContent = 0;
  calculateTotal();

  goHome();
}

//New function
function renderEntries() {
  const list = document.getElementById("entriesList");
  const totalEl = document.getElementById("invoiceTotal");

  list.innerHTML = "";

  let total = 0;

  entries.forEach((entry, index) => {
    let text = `${formatDate(entry.date)} - ${
      entry.workType === "full" ? "Full Day" : "Half Day"
    } - £${entry.workType === "full" ? 140 : 70}`;

    if (entry.bags > 0) {
      text += ` | ${entry.bags} bags (£${entry.bags * 10})`;
    }

    // ✅ NEW extras (correct place)
    if (entry.extraItems && entry.extraItems.length > 0) {
      entry.extraItems.forEach(item => {
        text += ` | ${item.name} (£${item.price})`;
      });
    }

    const div = document.createElement("div");
    div.className = "entry";

    const span = document.createElement("span");
    span.textContent = text;

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.onclick = () => deleteEntry(index);

    div.appendChild(span);
    div.appendChild(delBtn);

    list.appendChild(div);

    total += entry.total;
  });

  totalEl.textContent = total;
}

//New function 2
function deleteEntry(index) {
  const confirmDelete = confirm("Delete this entry?");

  if (!confirmDelete) return;

  entries.splice(index, 1);

  localStorage.setItem("entries", JSON.stringify(entries));

  renderEntries();
}

function addExtraItem() {
  const container = document.getElementById("extraItems");

  const div = document.createElement("div");

  div.innerHTML = `
    <input type="text" placeholder="Item (e.g. Flowers)" class="extra-name" oninput="calculateTotal()">
    <input 
  type="text" 
  inputmode="decimal"
  placeholder="Price (£)" 
  class="extra-price" 
  oninput="calculateTotal()"
>
    <button onclick="this.parentElement.remove(); calculateTotal()">❌</button>
  `;

  container.appendChild(div);
}

function getTaxYearFromDate(date) {
  const year = date.getFullYear();
  const april6 = new Date(year, 3, 6);

  if (date >= april6) {
    return year;
  } else {
    return year - 1;
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getInvoiceNumber() {
  const latestDate = entries.reduce((latest, e) => {
  const d = new Date(e.date);
  return d > latest ? d : latest;
}, new Date(entries[0].date));

const currentTaxYear = getTaxYearFromDate(latestDate);

  if (storedTaxYear != currentTaxYear) {
    // New tax year → reset counter
    invoiceCount = 0;
    storedTaxYear = currentTaxYear;

    localStorage.setItem("taxYear", storedTaxYear);
  }

  invoiceCount++;

  localStorage.setItem("invoiceCount", invoiceCount);

  return `${currentTaxYear}-${String(invoiceCount).padStart(3, "0")}`;
}

function renderCustomers() {
  const select = document.getElementById("customerSelect");
  select.innerHTML = "";

  customers.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    select.appendChild(option);
  });
}

function addNewCustomer() {
  const name = prompt("Enter customer name:");
  if (!name || !name.trim()) return;

const cleanName = name.trim();

// ✅ Prevent duplicates (case insensitive)
if (customers.some(c => c.toLowerCase() === cleanName.toLowerCase())) {
  alert("Customer already exists");
  return;
}

customers.push(cleanName);

localStorage.setItem("customers", JSON.stringify(customers));

renderCustomers();

document.getElementById("customerSelect").value = cleanName;
}

function clearInvoice() {
  entries = [];
  localStorage.removeItem("entries");
}

function getTaxYear() {
  const now = new Date();
  const year = now.getFullYear();

  const april6 = new Date(year, 3, 6); // April = month 3

  if (now >= april6) {
    return year;
  } else {
    return year - 1;
  }
}

function deleteCustomer() {
  if (customers.length <= 1) {
  alert("At least one customer is required");
  return;
}
  const name = document.getElementById("customerSelect").value;

  const confirmDelete = confirm(`Delete ${name}?`);

  if (!confirmDelete) return;

  customers = customers.filter(c => c !== name);

  localStorage.setItem("customers", JSON.stringify(customers));

  renderCustomers();
}

//PDF GENERATION
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const invoiceNumber = getInvoiceNumber();

  if (entries.length === 0) {
  alert("No entries to invoice");
  return;
}

const confirmGenerate = confirm("Generate invoice and clear entries?");

if (!confirmGenerate) return;

  let y = 10;

  const colDesc = 10;
const colPrice = 150;
const colSubtotal = 200;

  const today = new Date().toLocaleDateString("en-GB");

  // HEADER
 doc.setFontSize(20);
doc.setFont(undefined, "bold");
doc.text("INVOICE", 10, y);

doc.setFont(undefined, "normal");
doc.setFontSize(10);

doc.setFontSize(10);
doc.text("JB Gardening & Tree Care", 200, y, { align: "right" });
doc.text(`Invoice No: ${invoiceNumber}`, 200, y + 6, { align: "right" });
doc.text(`Date: ${today}`, 200, y + 12, { align: "right" });

y += 15;

  // CUSTOMER + DATE
  doc.setFontSize(12);
  doc.text("Invoice To:", 10, y);
  const customerName = entries.length > 0 ? entries[0].customer : "Customer";
doc.setFontSize(12);
doc.text(customerName, 10, y + 6);
doc.setFontSize(10);

  y += 15;

  doc.setDrawColor(200);
doc.line(10, y, 200, y);
y += 8;

  // ENTRIES
doc.setFont(undefined, "bold");
doc.setFontSize(11);

doc.text("Description", colDesc, y);
doc.text("Price (£)", colPrice, y, { align: "right" });
doc.text("Subtotal (£)", colSubtotal, y, { align: "right" });

doc.setFont(undefined, "normal");
doc.setFontSize(10);

y += 5;

// Header line
doc.setDrawColor(160);
doc.setLineWidth(0.3);
doc.line(10, y, 200, y);

doc.setDrawColor(200);
doc.setLineWidth(0.2);

y += 5;

const tableStartY = y;

  let runningTotal = 0;

  const sortedEntries = [...entries].sort((a, b) => {
  return new Date(a.date) - new Date(b.date);
});

let previousDate = null;

sortedEntries.forEach(entry => {
  const date = formatDate(entry.date);
  const currentDate = new Date(entry.date).toDateString();

  // ✅ Add separator ONLY when date changes
  if (previousDate && currentDate !== previousDate) {
    y += 4;

    doc.setDrawColor(200);
    doc.line(10, y, 200, y);

    y += 5;
  }

  // FULL DAY
  if (entry.workType === "full") {
    const price = 140;
    runningTotal += price;

    doc.text(`${date} - Full Day - General gardening`, 10, y);
    doc.text(`£${price}`, colPrice, y, { align: "right" });
doc.text(`£${runningTotal}`, colSubtotal, y, { align: "right" });

    y += 5;
  }

  // HALF DAY
  if (entry.workType === "half") {
    const price = 70;
    runningTotal += price;

    doc.text(`${date} - Half Day - General gardening`, 10, y);
    doc.text(`£${price}`, colPrice, y, { align: "right" });
doc.text(`£${runningTotal}`, colSubtotal, y, { align: "right" });

    y += 5;
  }

  // BAGS
  if (entry.bags > 0) {
    const price = entry.bags * 10;
    runningTotal += price;

    doc.text(`${date} - ${entry.bags} bags of green waste`, 10, y);
    doc.text(`£${price}`, colPrice, y, { align: "right" });
doc.text(`£${runningTotal}`, colSubtotal, y, { align: "right" });

    y += 5;
  }

  // EXTRAS
  if (entry.extraItems && entry.extraItems.length > 0) {
    entry.extraItems.forEach(item => {
      const price = item.price;
      runningTotal += price;

      doc.text(`${date} - ${item.name}`, 10, y);
      doc.text(`£${price}`, colPrice, y, { align: "right" });
doc.text(`£${runningTotal}`, colSubtotal, y, { align: "right" });

      y += 5;
    });
  }

  previousDate = currentDate;
});

    doc.setDrawColor(220);
doc.line(colPrice + 2, tableStartY - 4, colPrice + 2, y);
doc.line(colSubtotal + 2, tableStartY - 4, colSubtotal + 2, y);

  y += 10;

  // TOTAL
  doc.setFontSize(16);
  doc.setDrawColor(150);
doc.line(130, y - 6, 200, y - 6);

doc.setFont(undefined, "bold");
doc.setFontSize(14);

doc.text("Total:", colPrice, y, { align: "right" });
doc.text(`£${runningTotal}`, colSubtotal, y, { align: "right" });

doc.setFont(undefined, "normal");

  y += 15;

  // PAYMENT DETAILS
doc.text("Payment details:", 10, y);

y += 6;
doc.text("J Bellas", 10, y);

y += 6;
doc.text("Account Number: 7346798", 10, y);

y += 6;
doc.text("Sort Code: 20-60-58", 10, y);

y += 10;
doc.setTextColor(255, 0, 0);
doc.text("All payments to be made within 7 days", 10, y);

doc.setTextColor(0, 0, 0); // reset

  doc.save("invoice.pdf");
  clearInvoice();
renderEntries();
}

// AUTO UNLOCK
document.addEventListener("DOMContentLoaded", () => {
  hideAll();

  if (sessionStorage.getItem("unlocked") === "true") {
    showHome();
    renderEntries();
  } else {
    document.getElementById("pinScreen").classList.remove("hidden");
  }
});
