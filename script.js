// script.js - جميع وظائف النظام مع تعليقات توضيحية

// --- قاعدة البيانات (IndexedDB) ---
// إنشاء قاعدة البيانات وتخزين المخزون والعمليات
let db;
const dbName = "yarnInventoryDB";
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

// عند حدوث خطأ في فتح قاعدة البيانات
request.onerror = (event) => {
    console.error("خطأ في فتح قاعدة البيانات:", event.target.error);
};

// عند الحاجة لترقية قاعدة البيانات (إنشاء الجداول)
request.onupgradeneeded = (event) => {
    db = event.target.result;
    // إنشاء جدول المخزون
    if (!db.objectStoreNames.contains('inventory')) {
        const inventoryStore = db.createObjectStore('inventory', { keyPath: 'itemKey' });
        inventoryStore.createIndex('type', 'type', { unique: false });
        inventoryStore.createIndex('color', 'color', { unique: false });
        inventoryStore.createIndex('number', 'number', { unique: false });
    }
    // إنشاء جدول العمليات
    if (!db.objectStoreNames.contains('operations')) {
        const operationsStore = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
        operationsStore.createIndex('date', 'date', { unique: false });
        operationsStore.createIndex('itemKey', 'itemKey', { unique: false });
    }
};

// عند نجاح فتح قاعدة البيانات
request.onsuccess = (event) => {
    db = event.target.result;
    console.log("تم فتح قاعدة البيانات بنجاح");
    loadInitialData();
};

// --- تحميل البيانات الأولية من قاعدة البيانات ---
function loadInitialData() {
    const tx = db.transaction(['inventory', 'operations'], 'readonly');
    const inventoryStore = tx.objectStore('inventory');
    const operationsStore = tx.objectStore('operations');
    
    const inventoryRequest = inventoryStore.getAll();
    const operationsRequest = operationsStore.getAll();
    
    inventoryRequest.onsuccess = () => {
        inventory = {};
        inventoryRequest.result.forEach(item => {
            inventory[item.itemKey] = item;
        });
        renderInventory();
    };
    
    operationsRequest.onsuccess = () => {
        operations = operationsRequest.result;
        const today = document.getElementById('filterDate').value || new Date().toISOString().split('T')[0];
        renderOperations(today);
    };
}

// --- عرض نافذة إضافة عملية جديدة ---
function showAddForm() {
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('date').valueAsDate = new Date();
}

// --- إغلاق نافذة إضافة العملية ---
function closeForm() {
    document.getElementById('addForm').style.display = 'none';
    document.getElementById('yarnForm').reset();
}

// --- تحميل وعرض العمليات ---
let operations = [];

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('yarnForm');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
    filterOperations();
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('type').value;
        const color = document.getElementById('color').value;
        const number = document.getElementById('number').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const date = document.getElementById('date').value;
        const operation = document.getElementById('operation').value;
        
        const itemKey = `${type}-${color}-${number}`;
        
        const tx = db.transaction(['inventory', 'operations'], 'readwrite');
        const inventoryStore = tx.objectStore('inventory');
        const operationsStore = tx.objectStore('operations');
        
        const getRequest = inventoryStore.get(itemKey);
        
        getRequest.onsuccess = () => {
            const existingItem = getRequest.result;
            const previousWeight = existingItem ? existingItem.weight : 0;
            let newWeight = previousWeight;
            
            if (operation === 'add') {
                newWeight += weight;
            } else {
                if (previousWeight < weight) {
                    alert('خطأ: الكمية المطلوب سحبها أكبر من المخزون المتوفر');
                    return;
                }
                newWeight -= weight;
            }
            
            const inventoryItem = {
                itemKey,
                type,
                color,
                number,
                weight: newWeight
            };
            
            inventoryStore.put(inventoryItem);
            
            const operationItem = {
                date,
                itemKey,
                type,
                color,
                number,
                previousWeight,
                addedWeight: operation === 'add' ? weight : 0,
                subtractedWeight: operation === 'subtract' ? weight : 0,
                newWeight,
                operation
            };
            
            operationsStore.add(operationItem);
        };
        
        tx.oncomplete = () => {
            loadInitialData();
            closeForm();
        };
    });
});

// --- عرض جدول المخزون ---
function renderInventory() {
    const tbody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    Object.values(inventory).forEach(item => {
        if (item.weight !== 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.type}</td>
                <td>${item.color}</td>
                <td>${item.number}</td>
                <td>${item.weight.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        }
    });
}

// --- عرض جدول العمليات اليومية ---
function renderOperations(filterDate = '') {
    const tbody = document.getElementById('operationsTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    let filteredOperations = operations;
    if (filterDate) {
        filteredOperations = operations.filter(op => op.date === filterDate);
    }

    // ترتيب العمليات من الأقدم إلى الأحدث بناءً على التاريخ
    filteredOperations.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredOperations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 20px;">
                لا توجد عمليات في هذا التاريخ
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    filteredOperations.forEach(op => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${op.type}</td>
            <td>${op.color}</td>
            <td>${op.number}</td>
            <td>${op.previousWeight.toFixed(2)}</td>
            <td class="operation-add">${op.addedWeight > 0 ? op.addedWeight.toFixed(2) : '-'}</td>
            <td class="operation-subtract">${op.subtractedWeight > 0 ? op.subtractedWeight.toFixed(2) : '-'}</td>
            <td>${op.newWeight.toFixed(2)}</td>
            <td>
                <button onclick="editOperation('${op.type}','${op.color}','${op.number}')">تعديل</button>
                <button onclick="deleteOperation('${op.type}','${op.color}','${op.number}')">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- تنسيق التاريخ ---
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// --- تصفية العمليات حسب التاريخ ---
function filterOperations() {
    const filterDate = document.getElementById('filterDate').value;
    if (!filterDate) {
        alert('الرجاء اختيار تاريخ للتصفية');
        return;
    }
    renderOperations(filterDate);
}

// --- تبديل التبويبات بين المخزون والعمليات اليومية ---
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'inventory') {
        document.getElementById('inventory-list').classList.add('active');
    } else if (tabName === 'daily') {
        document.getElementById('daily-operations').classList.add('active');
        const filterDate = document.getElementById('filterDate').value;
        renderOperations(filterDate);
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    if (tabName === 'inventory') {
        document.querySelector('.tab-button[onclick*="inventory"]').classList.add('active');
    } else if (tabName === 'daily') {
        document.querySelector('.tab-button[onclick*="daily"]').classList.add('active');
    }
}

// --- تعديل عملية ---
function editOperation(type, color, number) {
    alert('تعديل العملية للصنف: ' + type + ', اللون: ' + color + ', النمرة: ' + number);
    // هنا تضع منطق التعديل لاحقًا
}

// --- حذف عملية ---
function deleteOperation(type, color, number) {
    if (confirm('هل أنت متأكد من حذف العملية؟')) {
        const filterDate = document.getElementById('filterDate').value;
        const tx = db.transaction(['operations', 'inventory'], 'readwrite');
        const operationsStore = tx.objectStore('operations');
        const inventoryStore = tx.objectStore('inventory');
        const index = operationsStore.index('itemKey');
        const itemKey = `${type}-${color}-${number}`;
        const request = index.getAllKeys(IDBKeyRange.only(itemKey));

        request.onsuccess = function() {
            const keys = request.result;
            let deleted = false;
            let totalAdded = 0;
            let totalSubtracted = 0;

            const getOpsReq = index.getAll(IDBKeyRange.only(itemKey));
            getOpsReq.onsuccess = function() {
                const ops = getOpsReq.result;
                ops.forEach(op => {
                    totalAdded += op.addedWeight || 0;
                    totalSubtracted += op.subtractedWeight || 0;
                });

                keys.forEach(key => {
                    operationsStore.delete(key);
                    deleted = true;
                });

                const invReq = inventoryStore.get(itemKey);
                invReq.onsuccess = function() {
                    const item = invReq.result;
                    if (item) {
                        let newWeight = item.weight - totalAdded + totalSubtracted;
                        if (newWeight < 0) newWeight = 0;
                        if (newWeight === 0) {
                            inventoryStore.delete(itemKey);
                        } else {
                            item.weight = newWeight;
                            inventoryStore.put(item);
                        }
                    }
                };
            };

            tx.oncomplete = function() {
                if (deleted) {
                    loadInitialData();
                    renderOperations(filterDate);
                }
            };
        };
    }
    alert('تم حذف العملية للصنف: ' + type + ', اللون: ' + color + ', النمرة: ' + number);
}

// --- حذف جميع العمليات ---
function deleteAllOperations() {
    if (confirm('هل أنت متأكد أنك تريد حذف كل العمليات؟ سيتم حذف كل العمليات والمخزون نهائياً!')) {
        const tx = db.transaction(['operations', 'inventory'], 'readwrite');
        const operationsStore = tx.objectStore('operations');
        const inventoryStore = tx.objectStore('inventory');
        const clearOperations = operationsStore.clear();
        const clearInventory = inventoryStore.clear();

        clearOperations.onsuccess = function() {
            clearInventory.onsuccess = function() {
                loadInitialData();
                renderOperations();
                alert('تم حذف كل العمليات والمخزون بنجاح.');
            };
            clearInventory.onerror = function() {
                alert('حدث خطأ أثناء حذف بيانات المخزون.');
            };
        };
        clearOperations.onerror = function() {
            alert('حدث خطأ أثناء حذف بيانات العمليات.');
        };
    }
}

// --- حذف جميع البيانات ---
function deleteAllData() {
    if (confirm('هل أنت متأكد أنك تريد حذف كل البيانات؟ سيتم حذف كل المخزون والعمليات نهائياً!')) {
        const tx = db.transaction(['inventory', 'operations'], 'readwrite');
        const inventoryStore = tx.objectStore('inventory');
        const operationsStore = tx.objectStore('operations');
        const clearInventory = inventoryStore.clear();
        const clearOperations = operationsStore.clear();

        clearInventory.onsuccess = function() {
            clearOperations.onsuccess = function() {
                loadInitialData();
                renderOperations();
                alert('تم حذف كل البيانات بنجاح.');
            };
            clearOperations.onerror = function() {
                alert('حدث خطأ أثناء حذف بيانات العمليات.');
            };
        };
        clearInventory.onerror = function() {
            alert('حدث خطأ أثناء حذف بيانات المخزون.');
        };
    }
}

// --- إنشاء PDF باستخدام jsPDF ---
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // تأكد من أن بيانات الخط مشفرة بشكل صحيح
    const fontData = "base64_encoded_font_data_here"; // تأكد من أن هذه البيانات صحيحة

    // تحميل الخط العربي
    doc.addFileToVFS("Amiri-Regular.ttf", fontData);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    doc.setFontSize(18);
    doc.text('المخزون الكلي', 14, 22);

    const inventoryTable = document.getElementById('inventoryTable');
    const rows = inventoryTable.getElementsByTagName('tr');
    let data = [];

    for (let i = 1; i < rows.length; i++) { // البدء من 1 لتخطي العنوان
        const cells = rows[i].getElementsByTagName('td');
        const rowData = [];
        for (let j = 0; j < cells.length; j++) {
            rowData.push(cells[j].innerText);
        }
        data.push(rowData);
    }

    doc.autoTable({
        head: [['الصنف', 'اللون', 'النمرة', 'الكمية المتاحة']],
        body: data,
        startY: 30,
        styles: {
            font: "Amiri",
            fontStyle: "normal",
            halign: "center",
            valign: "middle",
            fillColor: [211, 211, 211],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
        },
        theme: 'grid',
    });

    doc.save('المخزون_الكلي.pdf');
}

// --- التنقل بين الأيام ---
function previousDay() {
    const filterDateInput = document.getElementById('filterDate');
    const currentDate = new Date(filterDateInput.value);
    currentDate.setDate(currentDate.getDate() - 1);
    filterDateInput.value = currentDate.toISOString().split('T')[0];
    filterOperations();
}

function nextDay() {
    const filterDateInput = document.getElementById('filterDate');
    const currentDate = new Date(filterDateInput.value);
    currentDate.setDate(currentDate.getDate() + 1);
    filterDateInput.value = currentDate.toISOString().split('T')[0];
    filterOperations();
}

// --- تبديل الثيم (داكن/فاتح) ---
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

function toggleTheme() {
    const current = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', current);
    applyTheme();
}

document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
});

// --- إنشاء PDF للطباعة (أبيض وأسود) ---
function downloadTablePDF() {
    const table = document.getElementById('inventoryTable');
    // أضف كلاس خاص للطباعة
    table.classList.add('print-pdf-table');
    // إعدادات html2pdf
    const opt = {
        margin: 0.5,
        filename: 'المخزون_للطباعة.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'cm', format: 'a4' }
    };
    html2pdf().set(opt).from(table).save().then(() => {
        table.classList.remove('print-pdf-table');
    });
}

