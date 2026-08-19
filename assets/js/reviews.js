const reviewsCollection = db.collection("reviews");

db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  console.warn("Không bật được cache offline Firestore:", err.code);
});

let currentReviews = [];

function showReviewsLoading() {
  const summaryEl = document.getElementById("reviewSummary");
  const listEl = document.getElementById("reviewList");

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="review-summary-left">
        <div class="review-summary-score">···</div>
      </div>
      <div class="review-summary-right">
        <div class="review-summary-stat">
          <i class="fa-solid fa-spinner fa-spin"></i>
          Đang tải đánh giá...
        </div>
      </div>
    `;
  }

  if (listEl) {
    listEl.innerHTML = `
      <div class="review-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Đang tải đánh giá...</p>
      </div>
    `;
  }
}

const SEED_REVIEWS = [
  {
    id: "seed-1",
    username: null,
    fullName: "Nguyễn Thị Mai",
    rating: 5,
    comment:
      "Ứng dụng rất tiện lợi, mình không còn quên hạn sử dụng của thực phẩm trong tủ lạnh nữa. Giao diện dễ dùng!",
    date: "2026-06-12T09:30:00.000Z",
    isSeed: true,
  },
  {
    id: "seed-2",
    username: null,
    fullName: "Trần Văn Hùng",
    rating: 4,
    comment:
      "Tính năng quét mã vạch khá nhanh và chính xác. Mong sẽ có thêm nhắc nhở qua email trong thời gian tới.",
    date: "2026-06-05T14:10:00.000Z",
    isSeed: true,
  },
  {
    id: "seed-3",
    username: null,
    fullName: "Lê Thị Hoa",
    rating: 5,
    comment:
      "Từ ngày dùng ExpiryCheck mình quản lý được cả tủ mỹ phẩm lẫn thực phẩm, tiết kiệm được kha khá tiền vì không mua trùng đồ sắp hết hạn.",
    date: "2026-05-28T18:45:00.000Z",
    isSeed: true,
  },
  {
    id: "seed-4",
    username: null,
    fullName: "Phạm Minh Tuấn",
    rating: 4,
    comment:
      "Giao diện đẹp, dễ nhìn. Thỉnh thoảng nhập thủ công hơi mất thời gian nhưng nhìn chung rất hài lòng.",
    date: "2026-05-20T08:00:00.000Z",
    isSeed: true,
  },
];

function getDisplayReviews() {
  return currentReviews.concat(SEED_REVIEWS);
}

function getInitials(name) {
  if (!name) return "ND";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatReviewDate(iso) {
  if (!iso) return "";

  const d = new Date(iso);

  return d.toLocaleDateString("vi-VN");
}

function starsToHtml(rating) {
  const full = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);

  return full + empty;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function showReviewMsg(el, text, type) {
  if (!el) return;

  el.textContent = text;
  el.className = "review-form-msg show " + type;
}

function initReviewsListener() {
  showReviewsLoading();

  reviewsCollection.orderBy("date", "desc").onSnapshot(
    (snapshot) => {
      currentReviews = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      renderReviewSummary(getDisplayReviews());
      renderReviewForm(currentReviews);
      renderReviewList(getDisplayReviews());
    },
    (error) => {
      console.error("Lỗi tải đánh giá từ Firestore:", error);

      const listEl = document.getElementById("reviewList");
      if (listEl) {
        listEl.innerHTML = `
          <div class="review-empty">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>Không thể tải đánh giá lúc này. Vui lòng thử lại sau.</p>
          </div>
        `;
      }
    }
  );
}

function renderReviewSummary(reviews) {
  const el = document.getElementById("reviewSummary");
  if (!el) return;

  const count = reviews.length;

  if (count === 0) {
    el.innerHTML = `
      <div class="review-summary-left">
        <div class="review-summary-score">—<span class="review-summary-max">/5</span></div>
        <div class="review-summary-stars">☆☆☆☆☆</div>
        <div class="review-summary-count">Chưa có đánh giá</div>
      </div>
      <div class="review-summary-right">
        <div class="review-summary-stat">
          <i class="fa-solid fa-comment-dots"></i>
          Hãy là người đầu tiên đánh giá ExpiryCheck
        </div>
      </div>
    `;
    return;
  }

  const totalScore = reviews.reduce(
    (sum, r) => sum + Number(r.rating || 0),
    0
  );
  const avg = totalScore / count;
  const avgRounded = Math.round(avg * 10) / 10;
  const fullStars = Math.round(avg);
  const positiveCount = reviews.filter((r) => Number(r.rating) >= 4).length;
  const positivePercent = Math.round((positiveCount / count) * 100);

  el.innerHTML = `
    <div class="review-summary-left">
      <div class="review-summary-score">${avgRounded}<span class="review-summary-max">/5</span></div>
      <div class="review-summary-stars">${starsToHtml(fullStars)}</div>
      <div class="review-summary-count">Dựa trên ${count} đánh giá</div>
    </div>
    <div class="review-summary-right">
      <div class="review-summary-stat">
        <i class="fa-solid fa-circle-check"></i>
        ${positivePercent}% người dùng hài lòng (4 sao trở lên)
      </div>
      <div class="review-summary-stat">
        <i class="fa-solid fa-users"></i>
        ${count} lượt đánh giá từ cộng đồng
      </div>
    </div>
  `;
}

function renderReviewForm(realReviews) {
  const wrap = document.getElementById("reviewFormWrap");
  if (!wrap) return;

  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  // Chưa đăng nhập
  if (!user) {
    wrap.innerHTML = `
      <div class="review-login-prompt">
        <i class="fa-solid fa-lock"></i>
        <span>Vui lòng <a href="dangnhap.html">đăng nhập</a> để gửi đánh giá của bạn.</span>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <form class="review-form" id="newReviewForm">
      <h3>Viết đánh giá của bạn</h3>

      <div class="star-rating" id="newReviewStars">
        <input type="radio" name="newRating" id="newStar5" value="5" />
        <label for="newStar5"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="newRating" id="newStar4" value="4" />
        <label for="newStar4"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="newRating" id="newStar3" value="3" />
        <label for="newStar3"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="newRating" id="newStar2" value="2" />
        <label for="newStar2"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="newRating" id="newStar1" value="1" />
        <label for="newStar1"><i class="fa-solid fa-star"></i></label>
      </div>

      <textarea
        class="review-textarea"
        id="newReviewComment"
        placeholder="Chia sẻ trải nghiệm của bạn về ExpiryCheck..."
      ></textarea>

      <p class="review-form-msg" id="newReviewMsg"></p>

      <button type="submit" class="btn-review-submit">Gửi đánh giá</button>
    </form>
  `;

  const form = document.getElementById("newReviewForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const msgEl = document.getElementById("newReviewMsg");
    const checked = form.querySelector('input[name="newRating"]:checked');
    const comment = document.getElementById("newReviewComment").value.trim();
    const submitBtn = form.querySelector(".btn-review-submit");

    if (!checked) {
      showReviewMsg(msgEl, "Vui lòng chọn số sao đánh giá.", "error");
      return;
    }

    if (!comment) {
      showReviewMsg(msgEl, "Vui lòng nhập nội dung đánh giá.", "error");
      return;
    }

    submitBtn.disabled = true;

    reviewsCollection
      .add({
        username: user.username,
        fullName: user.fullName || user.username,
        rating: Number(checked.value),
        comment: comment,
        date: new Date().toISOString(),
      })
      .then(() => {
        showReviewMsg(msgEl, "Cảm ơn bạn đã đánh giá!", "success");
        form.reset();
        submitBtn.disabled = false;
        // onSnapshot sẽ tự render lại danh sách/tổng quan.
      })
      .catch((error) => {
        console.error("Lỗi khi gửi đánh giá:", error);
        showReviewMsg(
          msgEl,
          "Có lỗi xảy ra, vui lòng thử lại.",
          "error"
        );
        submitBtn.disabled = false;
      });
  });
}
function renderReviewList(reviews) {
  const listEl = document.getElementById("reviewList");
  if (!listEl) return;

  if (reviews.length === 0) {
    listEl.innerHTML = `
      <div class="review-empty">
        <i class="fa-regular fa-comment-dots"></i>
        <p>Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
      </div>
    `;
    return;
  }

  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  const sorted = [...reviews].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  listEl.innerHTML = sorted
    .map((r) => {
      const isOwner = user && !r.isSeed && user.username === r.username;

      return `
        <div class="review-card" data-review-id="${r.id}">
          <div class="review-card-head">
            <div class="review-avatar">${getInitials(r.fullName)}</div>
            <div class="review-meta">
              <div class="review-name">${escapeHtml(r.fullName)}</div>
              <div class="review-stars">${starsToHtml(Number(r.rating))}</div>
            </div>
            <div class="review-date">${formatReviewDate(r.date)}</div>
          </div>

          <div class="review-comment">${escapeHtml(r.comment)}</div>

          ${
            isOwner
              ? `
            <div class="review-card-actions">
              <button class="review-action-btn edit-review-btn" data-action="edit" data-id="${r.id}">
                <i class="fa-solid fa-pen"></i> Chỉnh sửa
              </button>
              <button class="review-action-btn delete-review-btn" data-action="delete" data-id="${r.id}">
                <i class="fa-solid fa-trash"></i> Xóa
              </button>
            </div>
          `
              : ""
          }
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => enterEditMode(btn.dataset.id));
  });

  listEl.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteReview(btn.dataset.id));
  });
}

function deleteReview(id) {
  if (!confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;

  reviewsCollection
    .doc(id)
    .delete()
    .catch((error) => {
      console.error("Lỗi khi xóa đánh giá:", error);
      alert("Không thể xóa đánh giá, vui lòng thử lại.");
    });
}
function enterEditMode(id) {
  const review = currentReviews.find((r) => r.id === id);
  if (!review) return;

  const card = document.querySelector(
    `.review-card[data-review-id="${id}"]`
  );
  if (!card) return;

  card.innerHTML = `
    <form class="edit-review-form">
      <div class="star-rating">
        <input type="radio" name="editRating-${id}" id="editStar5-${id}" value="5" ${review.rating == 5 ? "checked" : ""} />
        <label for="editStar5-${id}"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="editRating-${id}" id="editStar4-${id}" value="4" ${review.rating == 4 ? "checked" : ""} />
        <label for="editStar4-${id}"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="editRating-${id}" id="editStar3-${id}" value="3" ${review.rating == 3 ? "checked" : ""} />
        <label for="editStar3-${id}"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="editRating-${id}" id="editStar2-${id}" value="2" ${review.rating == 2 ? "checked" : ""} />
        <label for="editStar2-${id}"><i class="fa-solid fa-star"></i></label>

        <input type="radio" name="editRating-${id}" id="editStar1-${id}" value="1" ${review.rating == 1 ? "checked" : ""} />
        <label for="editStar1-${id}"><i class="fa-solid fa-star"></i></label>
      </div>

      <textarea class="review-textarea">${escapeHtml(review.comment)}</textarea>

      <p class="review-form-msg" id="editReviewMsg-${id}"></p>

      <div class="review-form-buttons">
        <button type="submit" class="btn-review-submit">Lưu</button>
        <button type="button" class="btn-review-cancel" data-action="cancel">Hủy</button>
      </div>
    </form>
  `;

  const form = card.querySelector("form");
  const cancelBtn = card.querySelector('[data-action="cancel"]');

  cancelBtn.addEventListener("click", () =>
    renderReviewList(getDisplayReviews())
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const checked = form.querySelector(
      `input[name="editRating-${id}"]:checked`
    );
    const comment = form.querySelector("textarea").value.trim();
    const msgEl = document.getElementById(`editReviewMsg-${id}`);

    if (!checked) {
      showReviewMsg(msgEl, "Vui lòng chọn số sao.", "error");
      return;
    }

    if (!comment) {
      showReviewMsg(msgEl, "Vui lòng nhập nội dung.", "error");
      return;
    }

    reviewsCollection
      .doc(id)
      .update({
        rating: Number(checked.value),
        comment: comment,
        date: new Date().toISOString(),
      })
      .catch((error) => {
        console.error("Lỗi khi lưu chỉnh sửa:", error);
        showReviewMsg(msgEl, "Không thể lưu, vui lòng thử lại.", "error");
      });
  });
}

document.addEventListener("DOMContentLoaded", initReviewsListener);