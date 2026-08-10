const loggedInUser = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
if (!loggedInUser) {
    window.location.href = "dangnhap.html";
} else {
    const currentUser = {
        fullName: loggedInUser.fullName || "Người dùng",
        username: loggedInUser.username || "",
        email: loggedInUser.email || "",
        role: loggedInUser.role || "Người dùng",
        joinDate: loggedInUser.joinDate || "—"
    };
    runApp(currentUser);
}
function getInitials(name) {
    if (!name) return "ND";
    const parts = name.trim().split(/\s+/);
    return parts.slice(-2).map(w => w[0]).join("").toUpperCase();
}
function runApp(currentUser) {
    // STATE
    const PRODUCT_KEY = "expirycheck_products_" + currentUser.username;
    let products = JSON.parse(localStorage.getItem(PRODUCT_KEY)) || [];
    let nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    let editingId = null;
    let currentStatus = "all";
    let currentCategory = "all";
    let currentSearch = ""; 
    function saveProducts() {
        localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
    }
    // HIỂN THỊ THÔNG TIN USER
    function renderCurrentUser() {
        const initials = getInitials(currentUser.fullName);
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        set("headerGreeting", "Xin chào, " + currentUser.fullName.toUpperCase());
        set("uinfoAvatar", initials);
        set("uinfoName", currentUser.fullName);
        set("uinfoUsername", currentUser.username);
        set("uinfoEmail", currentUser.email);
        set("uinfoRole", currentUser.role);
        set("uinfoJoinDate", currentUser.joinDate);
    }
    // TÍNH TRẠNG THÁI HẠN
    function getStatus(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expireDate = new Date(dateString);
        expireDate.setHours(0, 0, 0, 0);
        const diff = Math.round((expireDate - today) / 86400000);
        if (diff < 0) return "bad";
        if (diff <= 5) return "warn";
        return "ok";
    }
    // TÊN TRẠNG THÁI
    function statusLabel(status) {
        if (status === "bad") return "Hết hạn";
        if (status === "warn") return "Gần hết hạn";
        return "Còn hạn";
    }
    // ĐỊNH DẠNG NGÀY
    function formatDate(dateString) {
        if (!dateString) return "";
        const parts = dateString.split("-");
        if (parts.length !== 3) return dateString;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    // HIỂN THỊ DANH MỤC
    function renderCategories() {
        const select = document.getElementById("categoryFilter");
        if (!select) return;
        const categories = [...new Set(products.map(p => p.category))].sort();
        select.innerHTML = `<option value="all">Tất cả danh mục</option>`;
        categories.forEach(category => {
            select.innerHTML += `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
        });
        select.value = currentCategory;
    }
    // HIỂN THỊ THỐNG KÊ
    function renderStats() {
        const counts = { ok: 0, warn: 0, bad: 0 };
        products.forEach(p => counts[getStatus(p.date)]++);
        const total = products.length;
        const stats = document.getElementById("statsRow");
        if (stats) {
            stats.innerHTML = `
                <div class="stat-card total"><div class="bar"></div><div class="label">Tổng sản phẩm</div><div class="value">${total}</div></div>
                <div class="stat-card ok"><div class="bar"></div><div class="label">Còn hạn</div><div class="value">${counts.ok}</div></div>
                <div class="stat-card warn"><div class="bar"></div><div class="label">Gần hết hạn (≤5 ngày)</div><div class="value">${counts.warn}</div></div>
                <div class="stat-card bad"><div class="bar"></div><div class="label">Đã hết hạn</div><div class="value">${counts.bad}</div></div>
            `;
        }
        const userCount = document.getElementById("uinfoCount");
        if (userCount) userCount.textContent = total;
    }
    // HIỂN THỊ BẢNG SẢN PHẨM
    function renderTable() {
        const search = currentSearch.toLowerCase();
        let list = products.filter(p => {
            const status = getStatus(p.date);
            const matchStatus = currentStatus === "all" || status === currentStatus;
            const matchCategory = currentCategory === "all" || p.category === currentCategory;
            const matchSearch = p.name.toLowerCase().includes(search);
            return matchStatus && matchCategory && matchSearch;
        });
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        const tbody = document.getElementById("tableBody");
        const empty = document.getElementById("emptyState");
        if (!tbody || !empty) return;
        if (list.length === 0) {
            tbody.innerHTML = "";
            empty.style.display = "block";
            empty.innerHTML = products.length === 0
                ? `<i class="fa-regular fa-clipboard"></i><div>Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu quản lý.</div>`
                : `<i class="fa-solid fa-magnifying-glass"></i><div>Không tìm thấy sản phẩm phù hợp.</div>`;
            return;
        }
        empty.style.display = "none";
        tbody.innerHTML = list.map(product => {
            const status = getStatus(product.date);
            return `
                <tr>
                    <td><div class="prod-name">${escapeHtml(product.name)}</div></td>
                    <td><span class="prod-cat">${escapeHtml(product.category)}</span></td>
                    <td>${product.qty}</td>
                    <td>${formatDate(product.date)}</td>
                    <td><span class="badge ${status}">${statusLabel(status)}</span></td>
                    <td>
                        <div class="row-actions">
                            <button class="icon-btn" title="Sửa" onclick="openEdit(${product.id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn danger" title="Xóa" onclick="deleteProduct(${product.id})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }
    function renderAll() {
        renderCategories();
        renderStats();
        renderTable();
    }
    let toastTimer;
    function showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    }
    // TÌM KIẾM
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", e => {
            currentSearch = e.target.value;
            renderTable();
        });
    }
    // LỌC DANH MỤC
    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) {
        categoryFilter.addEventListener("change", e => {
            currentCategory = e.target.value;
            renderTable();
        });
    }
    // LỌC TRẠNG THÁI
    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".chip").forEach(item => item.classList.remove("active"));
            chip.classList.add("active");
            currentStatus = chip.dataset.status;
            renderTable();
        });
    });
    // MODAL THÊM SẢN PHẨM
    const productOverlay = document.getElementById("productOverlay");
    const addBtn = document.getElementById("addBtn");
    if (addBtn) addBtn.addEventListener("click", openAdd);
    const closeProductModalBtn = document.getElementById("closeProductModal");
    if (closeProductModalBtn) closeProductModalBtn.addEventListener("click", closeProductModal);
    const cancelProduct = document.getElementById("cancelProduct");
    if (cancelProduct) cancelProduct.addEventListener("click", closeProductModal);
    if (productOverlay) {
        productOverlay.addEventListener("click", e => {
            if (e.target === productOverlay) closeProductModal();
        });
    }
    // MỞ FORM THÊM
    function openAdd() {
        editingId = null;
        document.getElementById("modalTitle").textContent = "Thêm sản phẩm";
        document.getElementById("f_name").value = "";
        document.getElementById("f_category").value = "";
        document.getElementById("f_qty").value = "";
        document.getElementById("f_date").value = new Date().toISOString().slice(0, 10);
        productOverlay.classList.add("show");
        document.getElementById("f_name").focus();
    }
    // MỞ FORM SỬA
    window.openEdit = function (id) {
        const product = products.find(item => item.id === id);
        if (!product) return;
        editingId = id;
        document.getElementById("modalTitle").textContent = "Sửa sản phẩm";
        document.getElementById("f_name").value = product.name;
        document.getElementById("f_category").value = product.category;
        document.getElementById("f_qty").value = product.qty;
        document.getElementById("f_date").value = product.date;
        productOverlay.classList.add("show");
    };
    //  XÓA SẢN PHẨM
    window.deleteProduct = function (id) {
        const product = products.find(item => item.id === id);
        if (!product) return;
        if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
        products = products.filter(item => item.id !== id);
        saveProducts();
        renderAll();
        showToast("Đã xóa sản phẩm");
    };
    // ĐÓNG MODAL SẢN PHẨM
    function closeProductModal() {
        if (productOverlay) productOverlay.classList.remove("show");
    }
    // LƯU SẢN PHẨM
    const saveProduct = document.getElementById("saveProduct");
    if (saveProduct) {
        saveProduct.addEventListener("click", () => {
            const name = document.getElementById("f_name").value.trim();
            const category = document.getElementById("f_category").value.trim();
            const qty = parseInt(document.getElementById("f_qty").value, 10);
            const date = document.getElementById("f_date").value;
            if (!name || !category || !date || isNaN(qty) || qty < 0) {
                showToast("Vui lòng điền đầy đủ và hợp lệ thông tin");
                return;
            }
            if (editingId !== null) {
                const product = products.find(item => item.id === editingId);
                if (product) {
                    product.name = name;
                    product.category = category;
                    product.qty = qty;
                    product.date = date;
                    saveProducts();
                    showToast("Đã cập nhật sản phẩm");
                }
            } else {
                products.push({ id: nextId++, name, category, qty, date });
                saveProducts();
                showToast("Đã thêm sản phẩm mới");
            }
            closeProductModal();
            renderAll();
        });
    }
    // MODAL USER
    const userOverlay = document.getElementById("userOverlay");
    const userChip = document.getElementById("userChip");
    if (userChip && userOverlay) {
        userChip.addEventListener("click", () => userOverlay.classList.add("show"));
    }
    const closeUserModal = document.getElementById("closeUserModal");
    if (closeUserModal) {
        closeUserModal.addEventListener("click", () => userOverlay.classList.remove("show"));
    }
    const closeUserBtn2 = document.getElementById("closeUserBtn2");
    if (closeUserBtn2) {
        closeUserBtn2.addEventListener("click", () => userOverlay.classList.remove("show"));
    }
    if (userOverlay) {
        userOverlay.addEventListener("click", e => {
            if (e.target === userOverlay) userOverlay.classList.remove("show");
        });
    }
    // ĐĂNG XUẤT
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (typeof logoutUser === "function") logoutUser();
            window.location.href = "dangnhap.html";
        });
    }
    renderCurrentUser();
    renderAll();
}