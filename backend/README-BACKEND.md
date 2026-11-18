# ShopCart Pro — Spec backend Node.js + Express + MongoDB

Tài liệu này rút từ source hiện tại (schema Sanity trong `sanity/schemaTypes`, route `app/api`, và server action trong `actions`). Frontend đang đọc/ghi Sanity trực tiếp hoặc qua Next.js API. Nếu tự viết backend Express + MongoDB, đây là các collection và endpoint cần có để thay thế.

Ảnh Sanity (`image` + hotspot) đổi thành URL string (Cloudinary, S3, hoặc thư mục tĩnh). Slug Sanity (`{ current: string }`) đổi thành `slug: String`. `_id` Sanity đổi thành `_id` ObjectId của MongoDB. Thời gian dùng `Date`.

Auth hiện tại là Clerk (`clerkUserId`). Có hai hướng:

- Giữ Clerk: user lưu `externalAuthId` (Clerk user id), API verify JWT của Clerk.
- Bỏ Clerk: thêm `passwordHash`, tự cấp JWT. Các field `clerkUserId` / `clerkPaymentId` bên dưới đổi thành id nội bộ hoặc id cổng thanh toán của bạn.

Prefix gợi ý: `/api`. Mọi route có nhãn **Auth** cần `Authorization: Bearer <token>`. **Admin** = `user.isAdmin === true`. **Employee** = `user.isEmployee === true` và đúng `employeeRole`.

---

## 1. Collection

Có **15 collection**. Cart, wishlist, ví, thông báo của user, và dòng sản phẩm trong đơn là subdocument nhúng, không tách collection.

### 1.1 `users`

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| email | String | có | unique, lowercase |
| passwordHash | String | nếu tự auth | bỏ nếu giữ Clerk |
| externalAuthId | String | nếu giữ Clerk | unique, thay `clerkUserId` |
| firstName | String | có | |
| lastName | String | có | |
| phone | String | | |
| dateOfBirth | Date | | |
| profileImage | String | | URL |
| preferences.newsletter | Boolean | | default `false` |
| preferences.emailNotifications | Boolean | | default `true` |
| preferences.smsNotifications | Boolean | | default `false` |
| preferences.preferredCurrency | String | | `USD` `EUR` `GBP` `CAD`, default `USD` |
| preferences.preferredLanguage | String | | `en` `es` `fr` `de`, default `en` |
| rewardPoints | Number | | min 0, default 0 |
| loyaltyPoints | Number | | min 0, default 0 |
| totalSpent | Number | | min 0, default 0 |
| wishlist | [ObjectId] | | ref `products` |
| cart | [CartItem] | | xem bên dưới |
| walletBalance | Number | | min 0, default 0 |
| walletTransactions | [WalletTx] | | xem bên dưới |
| withdrawalRequests | [Withdrawal] | | xem bên dưới |
| notifications | [Notification] | | xem bên dưới |
| lastLogin | Date | | |
| isActive | Boolean | | tài khoản premium, default `false` |
| premiumStatus | String | | `none` `pending` `active` `rejected` `cancelled` |
| premiumAppliedAt | Date | | |
| premiumApprovedBy | String | | email admin |
| premiumApprovedAt | Date | | |
| premiumRejectedAt | Date | | |
| rejectionReason | String | | lý do từ chối premium hoặc business |
| isBusiness | Boolean | | default `false`, giảm thêm 2% khi active |
| businessStatus | String | | cùng enum với `premiumStatus` |
| businessAppliedAt | Date | | |
| businessApprovedBy | String | | |
| businessApprovedAt | Date | | |
| businessRejectedAt | Date | | |
| membershipType | String | | `standard` `premium` `business` `vip`, default `standard` |
| activatedAt | Date | | |
| activatedBy | String | | |
| isEmployee | Boolean | | default `false` |
| isAdmin | Boolean | | default `false` |
| employeeRole | String | | `callcenter` `packer` `warehouse` `deliveryman` `incharge` `accounts` |
| employeeStatus | String | | `active` `inactive` `suspended` |
| employeeAssignedBy | String | | |
| employeeAssignedAt | Date | | |
| employeeSuspendedBy | String | | |
| employeeSuspendedAt | Date | | |
| employeeSuspensionReason | String | | |
| employeePerformance | Object | | xem bên dưới |
| createdAt, updatedAt | Date | | |

**CartItem** (nhúng trong `users.cart`):

| Field | Kiểu | Bắt buộc |
| --- | --- | --- |
| product | ObjectId → products | có |
| quantity | Number | có, min 1 |
| size | String | |
| color | String | |
| addedAt | Date | |

**WalletTx**:

| Field | Kiểu | Bắt buộc |
| --- | --- | --- |
| type | String | `credit_refund` `credit_manual` `debit_order` `debit_withdrawal` |
| amount | Number | có, min 0 |
| balanceBefore | Number | có |
| balanceAfter | Number | có |
| description | String | có |
| orderId | ObjectId → orders | |
| withdrawalRequestId | String | |
| processedBy | String | |
| status | String | `completed` `pending` `failed` `cancelled` |
| createdAt | Date | có |

**Withdrawal**:

| Field | Kiểu | Bắt buộc |
| --- | --- | --- |
| amount | Number | có |
| method | String | `bank` `paypal` `stripe` `check` |
| bankDetails.accountHolderName | String | khi method = bank |
| bankDetails.bankName | String | |
| bankDetails.accountNumber | String | |
| bankDetails.routingNumber | String | |
| bankDetails.swiftCode | String | |
| paypalEmail | String | khi method = paypal |
| status | String | `pending` `approved` `processing` `completed` `rejected` `cancelled` |
| requestedAt | Date | có |
| processedAt | Date | |
| processedBy | String | |
| rejectionReason | String | |
| notes | String | nội bộ |
| transactionId | String | id bên cổng thanh toán |

**Notification** (hộp thư của một user):

| Field | Kiểu | Bắt buộc |
| --- | --- | --- |
| title | String | có |
| message | String | có |
| type | String | `promo` `order` `system` `marketing` `general` |
| read | Boolean | default `false` |
| priority | String | `low` `medium` `high` `urgent` |
| sentAt | Date | có |
| readAt | Date | |
| sentBy | String | email admin |
| actionUrl | String | |
| sentNotificationId | ObjectId | trỏ về bản gửi hàng loạt, nếu có |

**employeePerformance**:

`ordersProcessed`, `ordersConfirmed`, `ordersPacked`, `ordersAssignedForDelivery`, `ordersDelivered`, `cashCollected`, `paymentsReceived` (Number, default 0), `lastActiveAt` (Date).

Index: `email` unique, `externalAuthId` unique sparse, `isAdmin`, `isEmployee + employeeRole`.

### 1.2 `addresses`

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| user | ObjectId → users | có | |
| name | String | có | max 100, tên người nhận |
| email | String | có | |
| phone | String | | |
| address | String | có | 5–200 ký tự |
| city | String | có | max 50 |
| state | String | có | max 50 |
| zip | String | có | max 20 |
| country | String | có | default `United States` |
| countryCode | String | | max 2, ví dụ `US` |
| stateCode | String | | max 10 |
| subArea | String | | max 100 |
| type | String | có | `home` `office` `other`, default `home` |
| default | Boolean | | default `false`. Chỉ một địa chỉ default / user |
| createdAt | Date | | |

Index: `user`, `user + default`.

### 1.3 `categories`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| title | String | |
| slug | String | unique |
| description | String | |
| range | Number | “starting from”, dùng cho filter giá theo category |
| featured | Boolean | default `false` |
| image | String | URL |

### 1.4 `brands`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| title | String | |
| slug | String | unique |
| description | String | |
| image | String | URL |

### 1.5 `products`

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| name | String | có | |
| slug | String | có | unique |
| images | [String] | | URL |
| description | String | | |
| price | Number | có | min 0 |
| discount | Number | có | min 0, số tiền giảm |
| categories | [ObjectId] → categories | | |
| stock | Number | | min 0 |
| brand | ObjectId → brands | | |
| status | String | | `new` `hot` `sale`. `hot` = deal trên homepage |
| variant | String | | `gadget` `appliances` `refrigerators` `others` |
| isFeatured | Boolean | | default `false` |
| averageRating | Number | | 0–5, tính từ review `approved` |
| totalReviews | Number | | default 0 |
| ratingDistribution.fiveStars | Number | | |
| ratingDistribution.fourStars | Number | | |
| ratingDistribution.threeStars | Number | | |
| ratingDistribution.twoStars | Number | | |
| ratingDistribution.oneStar | Number | | |
| createdAt, updatedAt | Date | | sort “newest” dùng `createdAt` |

Khi review được duyệt hoặc gỡ, cập nhật lại `averageRating`, `totalReviews`, `ratingDistribution`.

Index: `slug` unique, `status`, `isFeatured`, `variant`, `brand`, `categories`, text index trên `name`.

### 1.6 `orders`

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| orderNumber | String | có | unique |
| user | ObjectId → users | có | thay `clerkUserId` |
| customerName | String | có | |
| email | String | có | |
| products | [OrderLine] | có | |
| subtotal | Number | có | min 0 |
| tax | Number | có | min 0 |
| shipping | Number | có | min 0 |
| totalPrice | Number | có | min 0 |
| currency | String | có | |
| amountDiscount | Number | có | |
| address | Object | | snapshot lúc đặt: `name`, `address`, `city`, `state`, `zip` |
| status | String | | xem enum bên dưới, default `pending` |
| orderDate | Date | có | |
| paymentStatus | String | | `pending` `paid` `failed` `cancelled` |
| paymentMethod | String | | `cash_on_delivery` `stripe` `clerk` `card` |
| amountPaid | Number | | để tính hoàn ví |
| invoice.id | String | | |
| invoice.number | String | | |
| invoice.hostedInvoiceUrl | String | | |
| stripeCheckoutSessionId | String | | |
| stripeCustomerId | String | | |
| stripePaymentIntentId | String | | |
| clerkPaymentId | String | | chỉ khi còn dùng Clerk Billing |
| clerkPaymentStatus | String | | |
| trackingNumber | String | | admin PATCH đang gửi, schema Sanity chưa có |
| notes | String | | admin |
| estimatedDelivery | Date | | admin |
| actualDelivery | Date | | admin |
| addressConfirmedBy / addressConfirmedAt | String / Date | | call center |
| orderConfirmedBy / orderConfirmedAt | String / Date | | call center |
| packedBy / packedAt | String / Date | | packer |
| packingNotes | String | | |
| assignedWarehouseBy / assignedWarehouseAt | String / Date | | |
| dispatchedBy / dispatchedAt | String / Date | | warehouse |
| assignedDeliverymanId | ObjectId → users | | |
| assignedDeliverymanName | String | | |
| deliveredBy / deliveredAt | String / Date | | |
| deliveryNotes | String | | |
| deliveryAttempts | Number | | default 0 |
| rescheduledDate | Date | | |
| rescheduledReason | String | | |
| cashCollected | Boolean | | default `false` |
| cashCollectedAmount | Number | | |
| cashCollectedAt | Date | | |
| cashSubmittedToAccounts | Boolean | | default `false` |
| cashSubmittedBy | String | | |
| cashSubmittedAt | Date | | |
| cashSubmissionNotes | String | | |
| assignedAccountsEmployeeId | ObjectId → users | | |
| assignedAccountsEmployeeName | String | | |
| cashSubmissionStatus | String | | `not_submitted` `pending` `confirmed` `rejected` |
| cashSubmissionRejectionReason | String | | |
| paymentReceivedBy | String | | |
| paymentReceivedAt | Date | | |
| cancellationRequested | Boolean | | default `false` |
| cancellationRequestedAt | Date | | |
| cancellationRequestReason | String | | |
| cancelledAt | Date | | |
| cancelledBy | String | | customer, email admin, hoặc `system` |
| cancellationReason | String | | |
| refundedToWallet | Boolean | | default `false` |
| refundAmount | Number | | |
| statusHistory | [StatusEvent] | | |
| createdAt, updatedAt | Date | | |

**OrderLine**: `product` (ObjectId → products), `quantity` (Number). Nên snapshot thêm `name`, `price`, `image` lúc đặt để đơn cũ không đổi khi sửa sản phẩm.

**StatusEvent**: `status` (String), `changedBy` (String), `changedByRole` (`admin` `callcenter` `packer` `warehouse` `deliveryman` `incharge` `accounts` `system`), `changedAt` (Date), `notes` (String).

**status** của đơn (luồng nhân viên):

`pending` → `address_confirmed` → `order_confirmed` → `packed` → `ready_for_delivery` → `out_for_delivery` → `delivered` → `completed`

Nhánh phụ: `cancelled`, `rescheduled`, `failed_delivery`.

Index: `orderNumber` unique, `user + orderDate`, `status`, `paymentStatus`, `assignedDeliverymanId`, `email`.

Đặt hàng phải trừ `products.stock` trong một transaction. Hủy đơn đã trừ kho thì cộng lại.

### 1.7 `reviews`

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| product | ObjectId → products | có | |
| user | ObjectId → users | có | unique theo cặp product + user |
| rating | Number | có | integer 1–5 |
| title | String | có | 5–100 ký tự |
| content | String | có | 20–1000 ký tự |
| isVerifiedPurchase | Boolean | | `true` nếu user có đơn chứa sản phẩm này và đã thanh toán / giao |
| status | String | có | `pending` `approved` `rejected`, default `pending` |
| helpful | Number | | min 0, default 0 |
| helpfulBy | [ObjectId] → users | | |
| adminNotes | String | | không trả cho khách |
| createdAt | Date | | |
| updatedAt | Date | | |
| approvedAt | Date | | |
| approvedBy | String | | |

Index: `product + status`, unique `product + user`.

### 1.8 `banners`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| title | String | |
| description | String | |
| badge | String | nhãn giảm giá, ví dụ `25% OFF` |
| discountAmount | Number | |
| image | String | URL |
| publishedAt | Date | query hiện sort theo field này dù schema Sanity không khai báo |

### 1.9 `authors`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| name | String | |
| slug | String | unique |
| image | String | URL |
| bio | Mixed | Portable Text của Sanity. Có thể lưu HTML/Markdown string cho đơn giản |

### 1.10 `blogcategories`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| title | String | |
| slug | String | unique |
| description | String | |

### 1.11 `blogs`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| title | String | |
| slug | String | unique |
| author | ObjectId → authors | |
| mainImage | String | URL |
| blogcategories | [ObjectId] → blogcategories | |
| publishedAt | Date | |
| isLatest | Boolean | default `true` |
| body | Mixed | Portable Text: block (style `normal` `h1`–`h4` `blockquote`, list `bullet`, mark `strong` `em`, link `href`) và ảnh kèm `alt`. Có thể lưu HTML |

### 1.12 `contacts`

Tin nhắn form liên hệ.

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| name | String | có | 2–100 |
| email | String | có | |
| subject | String | có | 5–200 |
| message | String | có | 10–1000 |
| status | String | | `new` `read` `replied` `closed`, default `new` |
| priority | String | | `low` `medium` `high` `urgent`, default `medium` |
| submittedAt | Date | | |
| ipAddress | String | | |
| userAgent | String | | |

### 1.13 `subscriptions`

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| email | String | có | unique, lowercase |
| status | String | có | `active` `unsubscribed` `pending`, default `active` |
| subscribedAt | Date | có | |
| unsubscribedAt | Date | | |
| source | String | | `footer` `popup` `checkout` `other` |
| ipAddress | String | | |
| userAgent | String | | |

### 1.14 `sentnotifications`

Bản ghi một lần admin gửi thông báo hàng loạt. Bản copy trong hộp thư nằm ở `users.notifications`.

| Field | Kiểu | Bắt buộc |
| --- | --- | --- |
| title | String | có |
| message | String | có |
| type | String | cùng enum notification |
| priority | String | cùng enum |
| sentAt | Date | có |
| sentBy | String | có, email admin |
| actionUrl | String | |
| recipientCount | Number | có |
| recipients | Array | mỗi phần tử: `email`, `name`, `user` (ObjectId), `delivered` (Boolean), `read` (Boolean), `readAt` (Date) |

### 1.15 `useraccessrequests`

Đơn xin được kích hoạt tài khoản (tách khỏi đơn premium / business nằm trên `users`).

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| user | ObjectId → users | | |
| externalAuthId | String | có | Clerk id nếu còn dùng |
| email | String | có | |
| firstName | String | | |
| lastName | String | | |
| status | String | có | `pending` `approved` `rejected` |
| requestedAt | Date | có | |
| approvedAt | Date | | |
| approvedBy | ObjectId → users | | |
| rejectedAt | Date | | |
| rejectedBy | ObjectId → users | | |
| notes | String | | nội bộ |

---

## 2. Quy tắc nghiệp vụ cần giữ

- Điểm thưởng: đơn từ ngưỡng `REWARD_POINTS_THRESHOLD` (mặc định 3000) trở lên thì cộng điểm theo `lib/pointsCalculation.ts`. Điểm loyalty cộng mỗi `LOYALTY_POINTS_ORDER_THRESHOLD` đơn hoàn thành (mặc định 5 đơn = 100 điểm).
- Business active được giảm thêm 2% so với giá đã discount.
- Một user chỉ một review cho một sản phẩm. Review mới vào trạng thái `pending`. Chỉ review `approved` được tính rating và hiện public.
- Hoàn tiền hủy đơn (đã thanh toán) cộng vào `walletBalance` và thêm `walletTransactions` loại `credit_refund`. Không hoàn hai lần (`refundedToWallet`).
- Rút ví: trừ số dư khi tạo request hoặc khi approve (chọn một thời điểm và giữ nhất quán), status đi `pending` → `approved` → `processing` → `completed`, hoặc `rejected` / `cancelled`. Từ chối thì hoàn lại số dư.
- Địa chỉ `default: true` thì các địa chỉ còn lại của user phải `default: false`.
- Nhân viên chỉ gọi được action đúng role:

| Role | Việc được làm |
| --- | --- |
| callcenter | xem đơn, xác nhận địa chỉ, xác nhận đơn |
| packer | xem đơn, đánh dấu đã đóng gói |
| warehouse | xem đơn, gán shipper, thống kê |
| deliveryman | giao hàng, thu tiền mặt, nộp tiền cho kế toán |
| accounts | nhận tiền mặt, thống kê |
| incharge | toàn bộ quyền trên + quản lý nhân viên |
| admin | toàn bộ, kể cả duyệt tài khoản, sản phẩm, review, thông báo |

---

## 3. API

Response lỗi thống nhất: `{ "error": "..." }` với 400 / 401 / 403 / 404 / 409 / 500.

Phân trang admin đang dùng `limit` + `offset`. Nên trả `{ data, total, limit, offset }`.

### 3.1 Auth

Chỉ cần nếu bỏ Clerk. Nếu giữ Clerk thì các route khác nhận Bearer token của Clerk và upsert user ở `GET /api/user/status`.

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | | body: email, password, firstName, lastName. Tạo user `membershipType=standard` |
| POST | `/api/auth/login` | | trả access token, cập nhật `lastLogin` |
| POST | `/api/auth/logout` | Auth | vô hiệu token nếu dùng blacklist / refresh token |
| GET | `/api/auth/me` | Auth | user hiện tại, không trả `passwordHash` |

### 3.2 Catalog (public)

Frontend đang query Sanity ở trang chủ, shop, search, blog. Cần các route này dù project chưa có file `app/api` tương ứng.

| Method | Path | Query | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/banners` | | sort `publishedAt` desc |
| GET | `/api/categories` | `featured`, `limit` | featured cho homepage; không filter thì tất cả, sort title |
| GET | `/api/categories/:slug` | | một category |
| GET | `/api/brands` | | sort title |
| GET | `/api/products` | `category`, `brand`, `minPrice`, `maxPrice`, `status`, `variant`, `featured`, `search`, `sort`, `page`, `limit` | shop + grid. `sort`: `name-asc` `name-desc` `price-asc` `price-desc` `newest`. `status=hot` là deal. `featured=true` là featured. `search` match `name` |
| GET | `/api/products/:slug` | | kèm `averageRating`, `totalReviews`, populate brand + categories |
| GET | `/api/products/:slug/related` | `limit` | cùng category, khác slug |
| GET | `/api/products/:slug/reviews` | `page`, `sort` | chỉ `status=approved`. sort: mới nhất, rating, helpful |
| GET | `/api/blogs` | `latest`, `limit` | `latest=true` lọc `isLatest`. sort `publishedAt` desc. populate author + blogcategories |
| GET | `/api/blogs/:slug` | | một bài + tác giả + category |
| GET | `/api/blogs/:slug/others` | `limit` | bài khác slug |
| GET | `/api/blog-categories` | | |

Admin catalog (CRUD Sanity Studio đang làm tay, API hiện chỉ có GET sản phẩm):

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/admin/products` | Admin | `id`, `search`, `category`, `limit`, `offset`, `sortBy`, `sortOrder` |
| POST | `/api/admin/products` | Admin | tạo sản phẩm |
| PUT | `/api/admin/products/:id` | Admin | sửa |
| DELETE | `/api/admin/products/:id` | Admin | xóa |
| POST/PUT/DELETE | `/api/admin/categories` | Admin | cùng kiểu cho category |
| POST/PUT/DELETE | `/api/admin/brands` | Admin | cùng kiểu cho brand |
| POST/PUT/DELETE | `/api/admin/banners` | Admin | |
| POST/PUT/DELETE | `/api/admin/blogs` | Admin | kèm author, blog category |

Upload ảnh: `POST /api/admin/uploads` (multipart), trả URL để gán vào `images` / `image`.

### 3.3 User, hồ sơ, địa chỉ

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/user/status` | Auth | user trong DB. Nếu chưa có thì tạo từ token (luồng Clerk hiện tại) |
| POST | `/api/user/status` | Auth | đồng bộ profile từ nhà cung cấp auth |
| PUT | `/api/user/profile` | Auth | firstName, lastName, phone, dateOfBirth, profileImage |
| PATCH | `/api/user/settings` | Auth | `preferences` |
| GET | `/api/user/combined-data` | Auth | profile + địa chỉ + đếm đơn, một round-trip như route hiện tại |
| GET | `/api/user/dashboard/stats` | Auth | số đơn, tổng chi, điểm, ví |
| GET | `/api/user/addresses` | Auth | địa chỉ của user |
| POST | `/api/user/addresses` | Auth | tạo. body: name, email, phone, address, city, state, zip, country, type, default |
| PUT | `/api/user/addresses/:id` | Auth | sửa. chỉ địa chỉ của mình |
| DELETE | `/api/user/addresses/:id` | Auth | xóa |

`/api/orders/addresses` và `/api/addresses` trong source là bản trùng của CRUD địa chỉ. Backend mới chỉ cần một nhóm `/api/user/addresses`.

### 3.4 Giỏ hàng và wishlist

Đang là server action (`actions/userActions.ts`), chưa có REST. Cần thêm:

| Method | Path | Auth | Body / việc làm |
| --- | --- | --- | --- |
| GET | `/api/cart` | Auth | cart, populate product |
| POST | `/api/cart` | Auth | `{ productId, quantity, size?, color? }`. Cộng dồn nếu cùng product + size + color. Kiểm tra stock |
| PATCH | `/api/cart` | Auth | `{ productId, quantity, size?, color? }` |
| DELETE | `/api/cart/:productId` | Auth | query `size`, `color` nếu có |
| DELETE | `/api/cart` | Auth | xóa hết giỏ |
| GET | `/api/wishlist` | Auth | populate product |
| POST | `/api/wishlist` | Auth | `{ productId }` |
| DELETE | `/api/wishlist/:productId` | Auth | |

### 3.5 Đơn hàng của khách

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/orders` | Auth | đơn của user, mới nhất trước, populate product (`name`, `slug`, `images`, `price`) |
| POST | `/api/orders` | Auth | body: `items[]`, `shippingAddress`, `paymentMethod`, `subtotal`, `shipping`, `tax`, `totalAmount`. Tạo `orderNumber`, snapshot địa chỉ, trừ stock, clear cart. COD để `paymentStatus=pending`. Trả `{ order }` |
| GET | `/api/orders/count` | Auth | số đơn của user |
| GET | `/api/user/orders` | Auth | bản có phân trang `start`, `end` (route profile) |
| GET | `/api/user/orders/count` | Auth | |
| POST | `/api/orders/:id/cancel-request` | Auth | body `{ reason }`. Set `cancellationRequested`, chưa hủy hẳn |
| POST | `/api/orders/:id/pay` | Auth | đánh dấu thanh toán (luồng pay của route hiện tại) |
| POST | `/api/orders/:id/pay-now` | Auth | tạo Stripe Checkout Session, lưu `stripeCheckoutSessionId` |
| POST | `/api/orders/:id/generate-invoice` | Auth | tạo invoice Stripe, lưu `invoice` |
| POST | `/api/orders/send-email` | Auth | gửi email xác nhận. Có thể gộp vào POST tạo đơn |
| POST | `/api/checkout/stripe` | Auth | body: orderId, items, email, shippingAddress, orderAmount. Trả URL Stripe |
| POST | `/api/webhooks/stripe` | Stripe signature | `checkout.session.completed` → `paymentStatus=paid`, trừ stock nếu chưa trừ, cộng điểm |

`/api/checkout/clerk` và `/api/checkout/clerk/complete` chỉ cần nếu giữ Clerk Billing. Nếu không, bỏ hai route và giá trị `paymentMethod=clerk`.

### 3.6 Ví, điểm, rút tiền

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/user/reward-points` | Auth | `rewardPoints` |
| GET | `/api/user/points` | Auth | reward + loyalty + số đơn hoàn thành |
| POST | `/api/user/points` | Auth | cộng điểm sau đơn (nên để server tự gọi khi đơn `completed`, không để client tự cộng) |
| GET | `/api/wallet` | Auth | `walletBalance` |
| GET | `/api/wallet/transactions` | Auth | |
| POST | `/api/wallet/debit` | Auth | trừ ví khi thanh toán đơn. body `{ amount, orderId }` |
| POST | `/api/orders/:id/refund` | Admin | hoàn vào ví, set `refundedToWallet`, `refundAmount` |
| GET | `/api/wallet/withdrawals` | Auth | request của user |
| POST | `/api/wallet/withdrawals` | Auth | `{ amount, method, bankDetails?, paypalEmail? }` |
| POST | `/api/wallet/withdrawals/:id/cancel` | Auth | chỉ khi `pending` |
| GET | `/api/admin/withdrawals` | Admin | mọi request |
| POST | `/api/admin/withdrawals/:id/approve` | Admin | |
| POST | `/api/admin/withdrawals/:id/complete` | Admin | body `{ transactionId }` |
| POST | `/api/admin/withdrawals/:id/reject` | Admin | body `{ reason }`, hoàn số dư |

### 3.7 Review

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/user/reviews` | Auth | review của tôi |
| POST | `/api/user/reviews` | Auth | `{ productId, rating, title, content }`. 409 nếu đã review. Set `isVerifiedPurchase` |
| PATCH | `/api/user/reviews/:id` | Auth | sửa khi còn `pending` |
| GET | `/api/products/:id/can-review` | Auth | `{ canReview, hasAlreadyReviewed, hasPurchased }` |
| POST | `/api/reviews/:id/helpful` | Auth | tăng `helpful` một lần / user |
| GET | `/api/admin/reviews` | Admin | filter `status` |
| PATCH | `/api/admin/reviews/:id` | Admin | `{ status: approved \| rejected, adminNotes }`. Duyệt xong thì tính lại rating sản phẩm |

### 3.8 Premium, business, kích hoạt tài khoản

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| POST | `/api/user/request-access` | Auth | tạo `useraccessrequests` status `pending` nếu chưa có |
| POST | `/api/user/business-apply` | Auth | `businessStatus=pending`, `businessAppliedAt` |
| POST | `/api/user/cancel-application` | Auth | body `{ type: "premium" \| "business" }` → status `cancelled` |
| GET | `/api/admin/account-requests` | Admin | list `useraccessrequests` |
| GET | `/api/admin/account-requests-summary` | Admin | đếm theo status |
| POST | `/api/admin/approve-account` | Admin | duyệt request, set user active |
| POST | `/api/admin/reject-account` | Admin | body `{ requestId, reason }` |
| GET | `/api/admin/premium-accounts` | Admin | user có `premiumStatus` pending/active |
| POST | `/api/admin/premium-accounts/approve` | Admin | `{ userId, action: approve \| reject, reason? }` |
| GET | `/api/admin/business-accounts` | Admin | |
| POST | `/api/admin/business-accounts/approve` | Admin | cùng kiểu premium |
| POST | `/api/admin/cancel-account` | Admin | hủy premium hoặc business đang active |
| POST | `/api/admin/manage-user` | Admin | đổi membership, cờ admin |

### 3.9 Admin: user, đơn, thống kê

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/admin/users` | Admin | search, phân trang |
| GET | `/api/admin/users/combined` | Admin | user + thống kê đơn |
| DELETE | `/api/admin/users/:id` | Admin | xóa user |
| POST | `/api/admin/users/:id/activate` | Admin | set activatedAt, activatedBy |
| GET | `/api/admin/orders` | Admin | filter status, paymentStatus, search, phân trang |
| GET | `/api/admin/orders/:id` | Admin | |
| PATCH | `/api/admin/orders/:id` | Admin | status, totalPrice, paymentStatus, tracking, ghi chú, field nhân viên. Append `statusHistory`. Đổi status thì tạo notification loại `order` |
| DELETE | `/api/admin/orders/:id` | Admin | |
| POST | `/api/admin/orders/:id/cancellation/approve` | Admin | hủy thật, hoàn ví nếu đã trả tiền, hoàn stock |
| POST | `/api/admin/orders/:id/cancellation/reject` | Admin | bỏ `cancellationRequested` |
| GET | `/api/admin/stats` | Admin | tổng user, đơn, doanh thu |
| GET | `/api/admin/analytics` | Admin | doanh thu theo thời gian, đơn theo status |
| GET | `/api/analytics/best-sellers` | Admin | sản phẩm bán chạy từ `orders.products` |

`/api/analytics/track` trong source chỉ log, không ghi DB. Không cần collection. Tracking trình duyệt đang đi Firebase.

### 3.10 Nhân viên và vận hành đơn

Các hàm này nằm trong `actions/employeeActions.ts` và `actions/orderEmployeeActions.ts`. Cần REST:

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/admin/employees` | Admin | list nhân viên |
| GET | `/api/admin/employees?role=` | Admin | lọc role |
| POST | `/api/admin/employees` | Admin | `{ userId, employeeRole }` |
| PATCH | `/api/admin/employees/:id` | Admin | đổi role hoặc `employeeStatus` (`active` `inactive` `suspended` + reason) |
| DELETE | `/api/admin/employees/:id` | Admin | gỡ role, `isEmployee=false` |
| GET | `/api/employee/me` | Employee | profile + quyền của role hiện tại |
| GET | `/api/employee/orders` | Employee | đơn trong hàng đợi của role đó |
| POST | `/api/employee/orders/:id/confirm-address` | callcenter | status `address_confirmed` |
| PATCH | `/api/employee/orders/:id/address` | callcenter | sửa snapshot địa chỉ |
| POST | `/api/employee/orders/:id/confirm` | callcenter | status `order_confirmed` |
| POST | `/api/employee/orders/:id/pack` | packer | body `{ notes }`, status `packed` |
| POST | `/api/employee/orders/:id/assign-deliveryman` | warehouse | body `{ deliverymanId }`, status `ready_for_delivery` |
| POST | `/api/employee/orders/:id/dispatch` | warehouse | status `out_for_delivery` |
| POST | `/api/employee/orders/:id/start-delivery` | deliveryman | |
| POST | `/api/employee/orders/:id/deliver` | deliveryman | body `{ notes }`, status `delivered` |
| POST | `/api/employee/orders/:id/fail` | deliveryman | tăng `deliveryAttempts`, status `failed_delivery` |
| POST | `/api/employee/orders/:id/reschedule` | deliveryman | `{ date, reason }`, status `rescheduled` |
| POST | `/api/employee/orders/:id/collect-cash` | deliveryman | `{ amount }` |
| POST | `/api/employee/orders/:id/submit-cash` | deliveryman | nộp kế toán, `cashSubmissionStatus=pending` |
| GET | `/api/employee/accounts/orders` | accounts | đơn chờ nhận tiền |
| GET | `/api/employee/accounts/stats` | accounts | |
| GET | `/api/employee/accounts/employees` | Employee | danh sách kế toán đang active để gán |
| POST | `/api/employee/orders/:id/receive-payment` | accounts | `cashSubmissionStatus=confirmed` |
| POST | `/api/employee/orders/:id/reject-cash` | accounts | body `{ reason }` |

Mỗi action ghi người thao tác, thời điểm, và push `statusHistory`. Cộng `employeePerformance` tương ứng.

### 3.11 Thông báo

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| GET | `/api/user/notifications` | Auth | sort `sentAt` desc |
| PATCH | `/api/user/notifications/read-all` | Auth | |
| PATCH | `/api/user/notifications/:id/read` | Auth | set `read`, `readAt` |
| DELETE | `/api/user/notifications/:id` | Auth | |
| DELETE | `/api/user/notifications` | Auth | xóa hết của user |
| GET | `/api/admin/notifications` | Admin | |
| GET | `/api/admin/notifications/sent` | Admin | list `sentnotifications` |
| POST | `/api/admin/notifications/send` | Admin | body title, message, type, priority, actionUrl, recipient filter. Tạo `sentnotifications` và nhét vào `users.notifications` |
| DELETE | `/api/admin/notifications/:id` | Admin | xóa bản gửi |

### 3.12 Liên hệ và newsletter

| Method | Path | Auth | Việc làm |
| --- | --- | --- | --- |
| POST | `/api/contact` | | tạo `contacts`, lưu IP và user-agent |
| GET | `/api/admin/contacts` | Admin | filter status, priority |
| PATCH | `/api/admin/contacts/:id` | Admin | đổi status |
| POST | `/api/newsletter/subscribe` | | body `{ email, source }`. Email đã active thì 409 |
| POST | `/api/newsletter/unsubscribe` | | set `unsubscribed`, `unsubscribedAt` |
| GET | `/api/newsletter/status` | | query `email` |
| GET | `/api/admin/subscriptions` | Admin | |
| DELETE | `/api/admin/subscriptions/:id` | Admin | |
| POST | `/api/admin/subscriptions/cleanup-duplicates` | Admin | gộp email trùng |

---

## 4. Thứ tự nên viết

1. Auth, `users`, `addresses`.
2. `categories`, `brands`, `products`, `banners` và API public catalog.
3. Cart, wishlist.
4. `orders` + trừ stock + Stripe webhook.
5. `reviews` và cập nhật rating.
6. Ví, điểm, hủy đơn.
7. Admin user / order / stats.
8. Employee workflow.
9. Blog, contact, newsletter, notification.

Route debug trong `app/api/debug/*` chỉ phục vụ lúc dựng Sanity, không đưa vào backend mới.
