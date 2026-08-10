let html5QrcodeScanner = null;
function switchTab(type) {
    const btnScan = document.getElementById('btn-tab-scan');
    const btnManual = document.getElementById('btn-tab-manual');
    const scannerContainer = document.getElementById('scanner-container');

    if (type === 'scan') {
        btnScan.classList.add('active');
        btnManual.classList.remove('active');
        scannerContainer.style.display = 'block';
        startCameraScanner();
    } else {
        btnManual.classList.add('active');
        btnScan.classList.remove('active');
        scannerContainer.style.display = 'none';
        stopCameraScanner();
    }
}
async function startCameraScanner() {

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("reader");
    }

    try {
        await html5QrcodeScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: 250
            },
            onScanSuccess,
            onScanFailure
        );
    } catch (err) {
        console.log(err);
        alert("Không thể mở camera!");
    }

}
function stopCameraScanner() {

    if (html5QrcodeScanner) {

        html5QrcodeScanner.stop()
            .then(() => {
                html5QrcodeScanner.clear();
            })
            .catch(err => console.log(err));

    }

}
function onScanSuccess(decodedText, decodedResult) {
    alert("Quét mã sản phẩm thành công!");
    
    // Tự động giải mã và điền thông tin tượng trưng vào form
    document.getElementById('prodName').value = "Sản phẩm mã QR (" + decodedText.substring(0, 8) + ")";
    document.getElementById('prodHSD').value = "2026-12-31"; 
    
    switchTab('manual');
    stopCameraScanner();
}


function onScanFailure(error) {
    // Thực thi logic bổ sung khi quét trượt nếu cần
}
function checkExpiryDate() {
    const name = document.getElementById('prodName').value.trim() || "Sản phẩm";
    const nsx = document.getElementById('prodNSX').value;
    const hsd = document.getElementById('prodHSD').value;
    const resultBox = document.getElementById('resultBox');

    if (!hsd) {
        alert("Vui lòng nhập ngày hết hạn!");
        return;
    }

    const today = new Date();
    const hsdDate = new Date(hsd);
    
    // Reset giờ về 00:00:00 để so sánh chính xác theo ngày độc lập
    today.setHours(0,0,0,0);
    hsdDate.setHours(0,0,0,0);// Kiểm tra tính logic giữa NSX và HSD
    if (nsx) {
        const nsxDate = new Date(nsx);
        if (nsxDate > hsdDate) {
            alert("Lỗi dữ liệu: Ngày sản xuất không thể lớn hơn ngày hết hạn!");
            return;
        }
    }

    // Tính số ngày chênh lệch
    const diffTime = hsdDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Hết hạn
    if(diffDays < 0) {
        resultBox.className = "result-alert show expired";
        resultBox.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <b>${name}</b> đã <b>HẾT HẠN SỬ DỤNG</b> cách đây <b> ${Math.abs(diffDays)} ngày </b>.
            `;
    }

    // Sắp hết hạn
    else if (diffDays <= 30) {
        resultBox.className = "result-alert show warning";
        resultBox.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <b>${name}</b> đã <b>SẮP HẾT HẠN SỬ DỤNG</b> Thời gian còn lại <b> ${diffDays} ngày </b>.
            `;
    }
    else {
        resultBox.className = "result-alert show safe";
        resultBox.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <b>${name} còn hạn. </b> thời gian còn lại <b> ${diffDays} ngày</b>.
            `;
    }
}
// =============================
// LƯU SẢN PHẨM VÀO TÍNH NĂNG
// =============================

const PRODUCT_KEY = "expirycheck_products";

let productToSave = null;


// Hàm lấy danh sách sản phẩm đã lưu
function getSavedProducts() {
    return JSON.parse(
        localStorage.getItem(PRODUCT_KEY)
    ) || [];
}


// Hàm lưu danh sách sản phẩm
function saveProducts(products) {
    localStorage.setItem(
        PRODUCT_KEY,
        JSON.stringify(products)
    );
}


// =============================
// SAU KHI KIỂM TRA HSD
// =============================

// Hàm này dùng để lưu sản phẩm
function prepareProductToSave() {

    const name = document.getElementById("prodName").value.trim();
    const nsx = document.getElementById("prodNSX").value;
    const hsd = document.getElementById("prodHSD").value;

    if (!name || !hsd) {
        alert("Vui lòng nhập tên sản phẩm và ngày hết hạn!");
        return;
    }

    productToSave = {
        id: Date.now(),
        name: name,
        category: "Sản phẩm",
        qty: 1,
        nsx: nsx,
        date: hsd
    };

    const products = getSavedProducts();

    products.push(productToSave);

    saveProducts(products);

    alert("Đã lưu sản phẩm vào Tính Năng!");

    document.getElementById("saveProductBtn").style.display = "none";
}


// Nút lưu sản phẩm
document.addEventListener("DOMContentLoaded", function () {

    const saveBtn =
        document.getElementById("saveProductBtn");

    if (saveBtn) {
        saveBtn.addEventListener(
            "click",
            prepareProductToSave
        );
    }

});
function saveCheckedProduct() {

    const name = document.getElementById("prodName").value.trim();
    const nsx = document.getElementById("prodNSX").value;
    const hsd = document.getElementById("prodHSD").value;

    // Kiểm tra dữ liệu
    if (!name || !hsd) {
        alert("Vui lòng nhập tên sản phẩm và ngày hết hạn!");
        return;
    }

    // Lấy sản phẩm cũ
    let products = JSON.parse(
        localStorage.getItem("expirycheck_products")
    ) || [];

    // Tạo sản phẩm mới
    const product = {
        id: Date.now(),
        name: name,
        category: "Sản phẩm",
        qty: 1,
        date: hsd,
        nsx: nsx
    };

    // Thêm vào danh sách
    products.push(product);

    // Lưu
    localStorage.setItem(
        "expirycheck_products",
        JSON.stringify(products)
    );

    alert("Đã lưu sản phẩm!");

}
