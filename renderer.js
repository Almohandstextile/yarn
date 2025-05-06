// الأصناف الأساسية
const DEFAULT_TYPES = ['بولستر', 'فلات', 'قصب', 'شانيل', 'ليكرا'];

// --- تبديل الثيم ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeToggleIcon = document.getElementById('themeToggleIcon');

function setTheme(dark) {
  if (dark) {
    document.body.classList.add('dark-theme');
    if (themeToggleIcon) themeToggleIcon.className = 'fa-solid fa-sun';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    if (themeToggleIcon) themeToggleIcon.className = 'fa-solid fa-moon';
    localStorage.setItem('theme', 'light');
  }
}

if (themeToggleBtn) {
  themeToggleBtn.onclick = function() {
    const isDark = document.body.classList.contains('dark-theme');
    setTheme(!isDark);
  };
}

// عند تحميل الصفحة: استرجع الثيم من localStorage
window.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme');
  setTheme(savedTheme === 'dark');
});

function getAllTypes() {
  // استرجع الأصناف من LocalStorage أو أعد الأصناف الافتراضية
  let types = JSON.parse(localStorage.getItem('yarn_types') || '[]');
  // أضف الأصناف الافتراضية إذا لم تكن موجودة
  DEFAULT_TYPES.forEach(type => {
    if (!types.includes(type)) types.push(type);
  });
  return types;
}

function saveAllTypes(types) {
  localStorage.setItem('yarn_types', JSON.stringify(types));
}

function renderTypesAside(selectedType) {
  const types = DEFAULT_TYPES;
  const icons = {
    'بولستر': 'fa-circle',
    'فلات': 'fa-layer-group',
    'قصب': 'fa-leaf',
    'شانيل': 'fa-feather',
    'ليكرا': 'fa-bolt'
  };
  const aside = document.getElementById('typesListAside');
  aside.innerHTML = '';
  types.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'type-btn' + (type === selectedType ? ' active' : '');
    btn.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${type}</span>`;
    btn.onclick = () => selectTypeAside(type);
    aside.appendChild(btn);
  });
}

function renderTypesFilter(selectedType) {
  const types = getAllTypes();
  const filter = document.getElementById('filterType');
  if (!filter) return;
  filter.innerHTML = '<option value="">كل الأصناف</option>';
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    if (type === selectedType) opt.selected = true;
    filter.appendChild(opt);
  });
}

function renderTypesAutocomplete(selectedType) {
  const types = getAllTypes();
  const datalist = document.getElementById('typesList');
  if (!datalist) return;
  datalist.innerHTML = '';
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    datalist.appendChild(opt);
  });
  // عيّن القيمة إذا محددة
  if (selectedType) {
    document.getElementById('mainType').value = selectedType;
  }
}

function addNewType() {
  const input = document.getElementById('newTypeInput');
  let val = input.value.trim();
  if (!val) return;
  let types = getAllTypes();
  if (!types.includes(val)) {
    types.push(val);
    saveAllTypes(types);
    showToast('تمت إضافة الصنف الجديد!', 'success');
    renderTypesAside(val);
    renderTypesFilter(val);
    renderTypesAutocomplete(val);
    selectTypeAside(val);
  } else {
    showToast('الصنف موجود بالفعل', 'error');
  }
  input.value = '';
}

function selectTypeAside(type) {
  // فعّل الزر
  renderTypesAside(type);
  renderTypesFilter(type);
  renderTypesAutocomplete(type);
  // عيّن في النموذج
  document.getElementById('mainType').value = type;
  // فعّل الفلتر
  document.getElementById('filterType').value = type;
  // حدث نص زر القائمة المنسدلة المخصصة
  const customDropdown = document.getElementById('customDropdownFilter');
  if (customDropdown) {
    const btn = customDropdown.querySelector('.dropdown-toggle');
    const items = customDropdown.querySelectorAll('.dropdown-menu li');
    let found = false;
    items.forEach(item => {
      if (item.getAttribute('data-value') === type) {
        btn.innerHTML = item.textContent + ' <i class="fa fa-chevron-down"></i>';
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        found = true;
      }
    });
    // إذا لم يوجد، اختر "كل الأصناف"
    if (!found) {
      const allItem = customDropdown.querySelector('.dropdown-menu li[data-value=""]');
      if (allItem) {
        btn.innerHTML = allItem.textContent + ' <i class="fa fa-chevron-down"></i>';
        items.forEach(i => i.classList.remove('active'));
        allItem.classList.add('active');
      }
    }
  }
  // أعد رسم الجدول
  renderYarnList();
}

// عند تغيير الفلتر من القائمة المنسدلة
if (document.getElementById('filterType')) {
  document.getElementById('filterType').onchange = function() {
    let type = this.value;
    renderTypesAside(type);
    renderTypesAutocomplete(type);
    if (type) document.getElementById('mainType').value = type;
    renderYarnList();
  };
}

// عند تحميل الصفحة: عرض الأصناف وتفعيل أول صنف
window.addEventListener('DOMContentLoaded', function() {
  renderTypesAside(DEFAULT_TYPES[0]);
  renderTypesFilter(DEFAULT_TYPES[0]);
  renderTypesAutocomplete(DEFAULT_TYPES[0]);
  document.getElementById('mainType').value = DEFAULT_TYPES[0];
  document.getElementById('filterType').value = DEFAULT_TYPES[0];
  renderYarnList();
});

// عدل دالة addYarn لتخزين الصنف الجديد تلقائياً
function addYarn() {
  const mainType = document.getElementById('mainType').value.trim();
  const weight = parseFloat(document.getElementById('weight').value);
  const count = parseInt(document.getElementById('count').value);
  const date = document.getElementById('date').value;
  const actionType = document.getElementById('actionType').value;

  if (!mainType || isNaN(weight) || isNaN(count) || !date || !actionType) {
    showToast('يرجى ملء جميع الحقول', 'error');
    return;
  }

  // أضف الصنف الجديد للقائمة إن لم يكن موجوداً
  let types = getAllTypes();
  if (!types.includes(mainType)) {
    types.push(mainType);
    saveAllTypes(types);
    renderTypesAside(mainType);
    renderTypesFilter(mainType);
    renderTypesAutocomplete(mainType);
  }

  let yarns = JSON.parse(localStorage.getItem('yarns_' + mainType) || '[]');
  yarns.push({ name: mainType, weight, count, date, actionType });
  localStorage.setItem('yarns_' + mainType, JSON.stringify(yarns));

  renderYarnList();

  showToast('تمت إضافة العملية بنجاح!', 'success');
  document.getElementById('weight').value = '';
  document.getElementById('count').value = '';
  document.getElementById('date').value = '';
}

// عدل renderYarnList ليأخذ الفلاتر في الاعتبار
function renderYarnList() {
  const filterType = document.getElementById('filterType') ? document.getElementById('filterType').value : '';
  const filterDate = document.getElementById('filterDate') ? document.getElementById('filterDate').value : '';
  const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
  const tableBody = document.querySelector('#yarnGrid tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  let types = getAllTypes();
  let allYarns = [];
  types.forEach(type => {
    let yarns = JSON.parse(localStorage.getItem('yarns_' + type) || '[]');
    yarns.forEach(yarn => allYarns.push({ ...yarn, name: type }));
  });

  let filtered = allYarns;
  if (filterType) filtered = filtered.filter(y => y.name === filterType);
  if (filterDate) filtered = filtered.filter(y => y.date === filterDate);
  if (search) filtered = filtered.filter(y => y.name.includes(search));

  // تجميع العمليات لكل اسم صنف وتاريخ
  let summaryMap = {};
  filtered.forEach(yarn => {
    let key = yarn.name + '|' + yarn.date;
    if (!summaryMap[key]) summaryMap[key] = { addWeight: 0, subWeight: 0, addCount: 0, subCount: 0, date: yarn.date, name: yarn.name };
    let weight = isNaN(parseFloat(yarn.weight)) ? 0 : parseFloat(yarn.weight);
    let count = isNaN(parseInt(yarn.count)) ? 0 : parseInt(yarn.count);
    if (yarn.actionType === 'إضافة') {
      summaryMap[key].addWeight += weight;
      summaryMap[key].addCount += count;
    } else if (yarn.actionType === 'سحب') {
      summaryMap[key].subWeight += weight;
      summaryMap[key].subCount += count;
    }
  });

  Object.keys(summaryMap).forEach(key => {
    const s = summaryMap[key];
    const balanceWeight = s.addWeight - s.subWeight;
    const balanceCount = s.addCount - s.subCount;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.date || '-'}</td>
      <td>${s.name}</td>
      <td>${s.addWeight}</td>
      <td>${s.subWeight}</td>
      <td>${balanceWeight}</td>
      <td>${s.addCount}</td>
      <td>${s.subCount}</td>
      <td>${balanceCount}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// زر عرض الكل
function clearFilters() {
  document.getElementById('filterType').value = '';
  document.getElementById('filterDate').value = '';
  document.getElementById('searchInput').value = '';
  renderTypesAside('');
  renderTypesAutocomplete('');
  renderYarnList();
}

// زر الطباعة
function printReport() {
  printSummaryReport();
}

function getYarnTable(type) {
  return JSON.parse(localStorage.getItem('yarns_' + type) || '[]');
}

function setYarnTable(type, data) {
  localStorage.setItem('yarns_' + type, JSON.stringify(data));
}

// تعريف المتغير الحالي للصنف
let currentType = 'بولستر';

// دالة التبديل بين التبويبات
function switchType(type) {
  currentType = type;
  document.getElementById('mainType').value = type;
  // تفعيل الزر الحالي
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === type) btn.classList.add('active');
  });
  renderYarnList();
}

// عند تحميل الصفحة اختر أول صنف افتراضيًا
document.addEventListener('DOMContentLoaded', function() {
  switchType(currentType);
});

// عند تحميل الصفحة أول مرة
renderYarnList();

function resetDatabase() {
  showResetModal();
}

const MIN_WEIGHT_ALERT = 10; // مثال: أقل من 10 كجم يعطي تنبيه

// Toast Notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// بحث وتصفية الجدول
function filterTable() {
  const input = document.getElementById('searchInput');
  const filter = input.value.trim();
  const table = document.getElementById('yarnGrid');
  const trs = table.querySelectorAll('tbody tr');
  trs.forEach(tr => {
    // العمود الثالث هو اسم الصنف الفرعي
    const subNameCell = tr.children[2];
    if (!filter || (subNameCell && subNameCell.textContent.includes(filter))) {
      tr.style.display = '';
    } else {
      tr.style.display = 'none';
    }
  });
}

// Modal لإعادة الضبط
function showResetModal() {
  document.getElementById('resetModal').style.display = 'flex';
}
function closeResetModal() {
  document.getElementById('resetModal').style.display = 'none';
}
function confirmResetDatabase() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('yarns_')) localStorage.removeItem(key);
  });
  closeResetModal();
  showToast('تم حذف جميع البيانات القديمة بنجاح!', 'success');
  renderYarnList();
}

function printSummaryReport() {
  const types = DEFAULT_TYPES;
  let allRows = [];
  types.forEach(type => {
    let yarns = JSON.parse(localStorage.getItem('yarns_' + type) || '[]');
    let subMap = {};
    yarns.forEach(yarn => {
      let subName = yarn.subName || yarn.subname || yarn.fullName || yarn.name || type;
      if (!subMap[subName]) subMap[subName] = { addWeight: 0, subWeight: 0, addCount: 0, subCount: 0 };
      let weight = isNaN(parseFloat(yarn.weight)) ? 0 : parseFloat(yarn.weight);
      let count = isNaN(parseInt(yarn.count)) ? 0 : parseInt(yarn.count);
      if (yarn.actionType === 'إضافة') {
        subMap[subName].addWeight += weight;
        subMap[subName].addCount += count;
      } else if (yarn.actionType === 'سحب') {
        subMap[subName].subWeight += weight;
        subMap[subName].subCount += count;
      }
    });
    let subRows = Object.keys(subMap).map(subName => {
      const s = subMap[subName];
      const balanceWeight = s.addWeight - s.subWeight;
      const balanceCount = s.addCount - s.subCount;
      return {
        mainType: type,
        subName: subName,
        weight: balanceWeight,
        count: balanceCount
      };
    });
    allRows.push({
      mainType: type,
      subRows: subRows
    });
  });

  // بناء HTML الجدول
  let html = `
    <html dir="rtl"><head>
      <title>تقرير الأصناف والفئات</title>
      <style>
        body { font-family: 'Cairo', Arial, Tahoma, sans-serif; background: #fff; color: #23272f; }
        h2 { text-align: center; color: #1a73e8; margin-top: 24px; }
        table { width: 90%; margin: 30px auto; border-collapse: collapse; font-size: 1.08em; box-shadow: 0 2px 16px #eee; }
        th, td { border: 1.5px solid #1a73e8; padding: 12px 16px; text-align: center; }
        th { background: #1a73e8; color: #fff; position: sticky; top: 0; z-index: 2; }
        tr.type-header td { background: #e3f0fd; color: #1a73e8; font-weight: bold; font-size: 1.08em; border-bottom: 2.5px solid #1a73e8; }
        tr.no-data td { color: #d32f2f; font-weight: bold; background: #fff0f0; }
        tr:nth-child(even) td:not(.type-header) { background: #f2f8fc; }
      </style>
    </head><body>
      <h2>تقرير ملخص الأصناف والفئات</h2>
      <table>
        <thead>
          <tr>
            <th>الصنف الرئيسي</th>
            <th>الصنف الفرعي</th>
            <th>الكمية (وزن)</th>
            <th>الكمية (عدد)</th>
          </tr>
        </thead>
        <tbody>
          ${
            allRows.every(group => group.subRows.length === 0)
            ? `<tr class='no-data'><td colspan='4'>لا يوجد بيانات</td></tr>`
            : allRows.map(group =>
                group.subRows.length === 0
                ? ''
                : group.subRows.map((r, idx) => `
                  <tr>
                    <td>${idx === 0 ? group.mainType : ''}</td>
                    <td>${r.subName}</td>
                    <td>${r.weight}</td>
                    <td>${r.count}</td>
                  </tr>
                `).join('')
              ).join('')
          }
        </tbody>
      </table>
    </body></html>
  `;
  let win = window.open('', '', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// --- Modal إضافة عملية جديدة ---
const addOperationBtn = document.getElementById('addOperationBtn');
const addOperationModal = document.getElementById('addOperationModal');
const closeAddOperationModal = document.getElementById('closeAddOperationModal');
const addOperationForm = document.getElementById('addOperationForm');

if (addOperationBtn && addOperationModal && closeAddOperationModal && addOperationForm) {
  addOperationBtn.onclick = () => {
    addOperationModal.style.display = 'flex';
    fillAddOperationForm();
  };
  closeAddOperationModal.onclick = () => {
    addOperationModal.style.display = 'none';
  };
  window.addEventListener('click', (e) => {
    if (e.target === addOperationModal) addOperationModal.style.display = 'none';
  });
}

function fillAddOperationForm() {
  // احصل على الصنف الحالي المختار
  let currentType = document.getElementById('mainType') ? document.getElementById('mainType').value : DEFAULT_TYPES[0];
  addOperationForm.innerHTML = `
    <div class="form-row">
      <label for="modalMainType">الصنف :</label>
      <select id="modalMainType" required>
        <option value="بولستر" ${currentType === 'بولستر' ? 'selected' : ''}>بولستر</option>
        <option value="فلات" ${currentType === 'فلات' ? 'selected' : ''}>فلات</option>
        <option value="قصب" ${currentType === 'قصب' ? 'selected' : ''}>قصب</option>
        <option value="شانيل" ${currentType === 'شانيل' ? 'selected' : ''}>شانيل</option>
        <option value="ليكرا" ${currentType === 'ليكرا' ? 'selected' : ''}>ليكرا</option>
      </select>
    </div>
    <div class="form-row">
      <label for="modalSubType">اسم الصنف :</label>
      <input type="text" id="modalSubType" placeholder="مثلاً: اسم الصنف الفرعي" required>
    </div>
    <div class="form-row">
      <label for="modalWeight">الوزن (كجم):</label>
      <input type="number" id="modalWeight" step="0.01" min="0" required>
    </div>
    <div class="form-row">
      <label for="modalCount">العدد (كونة):</label>
      <input type="number" id="modalCount" step="1" min="0" required>
    </div>
    <div class="form-row">
      <label for="modalDate">التاريخ:</label>
      <input type="date" id="modalDate" required value="${new Date().toISOString().slice(0,10)}">
    </div>
    <div class="form-row">
      <label for="modalActionType">نوع العملية:</label>
      <select id="modalActionType" required>
        <option value="إضافة">إضافة</option>
        <option value="سحب">سحب</option>
      </select>
    </div>
    <button type="submit" class="main-btn"><i class="fa-solid fa-plus"></i> حفظ العملية</button>
  `;
  // اربط تغيير الصنف في المودال ليؤثر على كل الصفحة
  const modalMainType = document.getElementById('modalMainType');
  if (modalMainType) {
    modalMainType.addEventListener('change', function() {
      selectTypeAside(this.value);
    });
  }
}

addOperationForm && addOperationForm.addEventListener('submit', function(e) {
  e.preventDefault();
  // اجمع البيانات
  const mainType = document.getElementById('modalMainType').value;
  const subType = document.getElementById('modalSubType').value;
  const weight = parseFloat(document.getElementById('modalWeight').value);
  const count = parseInt(document.getElementById('modalCount').value);
  const date = document.getElementById('modalDate').value;
  const actionType = document.getElementById('modalActionType').value;
  if (!mainType || !subType || isNaN(weight) || isNaN(count) || !date || !actionType) {
    showToast('يرجى ملء جميع الحقول', 'error');
    return;
  }
  // أضف العملية
  let yarns = JSON.parse(localStorage.getItem('yarns_' + mainType) || '[]');
  yarns.push({ name: subType, weight, count, date, actionType });
  localStorage.setItem('yarns_' + mainType, JSON.stringify(yarns));
  showToast('تمت إضافة العملية بنجاح', 'success');
  addOperationModal.style.display = 'none';
  // تحديث الجدول
  if (typeof renderYarnList === 'function') renderYarnList();
});

// عند تحميل الصفحة: حذف 'بولستر اسود' من قائمة الأصناف إن وجدت
(function removePolysterBlack() {
  let types = JSON.parse(localStorage.getItem('yarn_types') || '[]');
  const idx = types.indexOf('بولستر اسود');
  if (idx !== -1) {
    types.splice(idx, 1);
    localStorage.setItem('yarn_types', JSON.stringify(types));
  }
})();

// --- كود القائمة المنسدلة المخصصة للفلاتر ---
document.addEventListener('DOMContentLoaded', function() {
  const customDropdown = document.getElementById('customDropdownFilter');
  if (customDropdown) {
    const btn = customDropdown.querySelector('.dropdown-toggle');
    const menu = customDropdown.querySelector('.dropdown-menu');
    const items = menu.querySelectorAll('li');
    items.forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        // غير نص الزر
        btn.innerHTML = this.textContent + ' <i class="fa fa-chevron-down"></i>';
        // فعّل العنصر
        items.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        // غير قيمة الفلتر المختار
        const selectedType = this.getAttribute('data-value');
        // حدث الـ aside ليعكس الاختيار
        if (typeof selectTypeAside === 'function') {
          selectTypeAside(selectedType);
        }
        // أعد رسم الجدول
        if (typeof renderYarnList === 'function') renderYarnList();
        // أغلق القائمة (اختياري)
        menu.style.display = 'none';
        setTimeout(() => { menu.style.display = ''; }, 200);
      });
    });
    // إعادة فتح القائمة عند hover
    customDropdown.addEventListener('mouseenter', function() {
      menu.style.display = 'block';
      menu.style.opacity = '1';
      menu.style.pointerEvents = 'auto';
    });
    customDropdown.addEventListener('mouseleave', function() {
      menu.style.display = '';
      menu.style.opacity = '';
      menu.style.pointerEvents = '';
    });
  }
});

// --- فتح تقويم التاريخ عند الضغط على أي جزء من الحقل ---
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input[type="date"], .filter-date').forEach(function(dateInput) {
    dateInput.addEventListener('mousedown', function(e) {
      // افتح التقويم دائماً عند أي ضغطة
      this.showPicker && this.showPicker();
    });
    // دعم بعض المتصفحات القديمة
    dateInput.addEventListener('focus', function(e) {
      this.showPicker && this.showPicker();
    });
  });
});