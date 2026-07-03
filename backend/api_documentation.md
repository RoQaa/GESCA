# GESCA API Documentation

تم تصميم الـ API لتعمل بنمط RESTful معتمدين على `Express` و `Prisma`. يتم إضافة البادئة `/api` لجميع المسارات بشكل افتراضي (إلا إذا تم إعدادها بطريقة أخرى في `server.ts`).
جميع الطلبات (باستثناء تسجيل الدخول) تتطلب إرسال توكن التوثيق `Bearer Token` في الـ `Authorization header`.

---

## 1. Auth Module (التحقق والمصادقة)
**Base Path:** `/auth`

### `POST /register`
- **الوظيفة:** تسجيل مستخدم جديد في النظام.
- **الصلاحيات:** `Admin` فقط.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "role": "SalesEmployee", // Enum: Admin, Manager, SalesEmployee
    "phone": "+20100000000" // اختياري
  }
  ```

### `POST /login`
- **الوظيفة:** تسجيل الدخول والحصول على التوكن (JWT).
- **الصلاحيات:** متاح للجميع.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **الرد (Response):** يحتوي على `user` و `accessToken` و `refreshToken`.

---

## 2. Employee Module (الموظفين)
**Base Path:** `/employees`

### `GET /`
- **الوظيفة:** عرض قائمة الموظفين مع دعم التصفح (Pagination).
- **الصلاحيات:** `Admin`, `Manager`.
- **المعاملات (Query Params):** `limit`, `cursor`, `role`, `search`.

### `GET /:id`
- **الوظيفة:** جلب بيانات موظف محدد.
- **الصلاحيات:** `Admin`, `Manager`.

### `PUT /:id/status`
- **الوظيفة:** تفعيل أو تعطيل حساب موظف.
- **الصلاحيات:** `Admin` فقط.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "isActive": false
  }
  ```

### `POST /:id/reset-password`
- **الوظيفة:** إعادة تعيين كلمة مرور الموظف بواسطة الإدارة.
- **الصلاحيات:** `Admin` فقط.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "newPassword": "newPassword123"
  }
  ```

---

## 3. Customer Module (العملاء)
**Base Path:** `/customers`

### `POST /`
- **الوظيفة:** إضافة عميل جديد.
- **الصلاحيات:** `Admin`, `Manager`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "name": "Supermarket X",
    "contactPerson": "Mohamed",
    "phone": "0100000000",
    "email": "info@supermarketx.com",
    "address": "Cairo, Egypt",
    "notes": "VIP Customer"
  }
  ```

### `GET /`
- **الوظيفة:** جلب قائمة العملاء.
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.
- **المعاملات (Query Params):** `limit`, `cursor`, `search`.

### `GET /:id`
- **الوظيفة:** جلب تفاصيل عميل محدد (شاملة الفروع).
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.

### `PUT /:id`
- **الوظيفة:** تعديل بيانات العميل.
- **الصلاحيات:** `Admin`, `Manager`.
- **البيانات المطلوبة (Body):** نفس بيانات الإنشاء (كلها اختيارية).

### `POST /:id/locations`
- **الوظيفة:** إضافة فرع/موقع GPS جديد للعميل.
- **الصلاحيات:** `Admin`, `Manager`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "label": "Main Branch",
    "address": "Giza",
    "latitude": 30.0123,
    "longitude": 31.0123,
    "isPrimary": true
  }
  ```

---

## 4. Task Module (المهام/خطوط السير)
**Base Path:** `/tasks`

### `POST /`
- **الوظيفة:** إنشاء مهمة (زيارة مخططة) لمندوب.
- **الصلاحيات:** `Admin`, `Manager`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "employeeId": "uuid-here",
    "customerId": "uuid-here",
    "locationId": "uuid-here", // اختياري (تحديد الفرع)
    "title": "Monthly Check",
    "description": "Check inventory",
    "scheduledDate": "2023-12-01T00:00:00Z",
    "scheduledStartTime": "10:00:00.000Z", // اختياري
    "scheduledEndTime": "11:00:00.000Z", // اختياري
    "priority": 2 // 1=Low, 2=Medium, 3=High
  }
  ```

### `GET /`
- **الوظيفة:** جلب قائمة المهام. المندوب يرى مهامه فقط، المدير يرى مهام فريقه/الجميع.
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.
- **المعاملات (Query Params):** `limit`, `cursor`, `status`, `employeeId`, `customerId`, `startDate`, `endDate`.

---

## 5. Visit Module (الزيارات الفعلية)
**Base Path:** `/visits`

### `POST /`
- **الوظيفة:** يبدأ المندوب الزيارة بناءً على المهمة المجدولة.
- **الصلاحيات:** `SalesEmployee`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "taskId": "uuid-of-the-task"
  }
  ```

### `GET /`
- **الوظيفة:** جلب الزيارات.
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.
- **المعاملات (Query Params):** `limit`, `cursor`, `status`, `taskId`, `employeeId`.

### `PUT /:id/status`
- **الوظيفة:** تحديث حالة الزيارة (مثلاً لإلغائها أو وضع ملاحظات إضافية).
- **الصلاحيات:** `Admin`, `SalesEmployee`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "status": "CANCELED",
    "notes": "Customer was closed"
  }
  ```

---

## 6. Attendance & GPS Module (نظام التتبع والحضور)
**Base Path:** `/attendances`

### `POST /`
- **الوظيفة:** تسجيل إحداثيات المندوب (Check-In أو Check-Out) وتحديث حالة المهمة والزيارة بناءً عليها.
- **الصلاحيات:** `SalesEmployee`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "visitId": "uuid-of-visit",
    "type": "CHECK_IN", // أو "CHECK_OUT"
    "latitude": 30.1234,
    "longitude": 31.1234,
    "accuracy": 12.5,
    "altitude": 10.0,
    "speed": 0.5,
    "heading": 90,
    "isMockSuspected": false,
    "mockScore": 0,
    "mockSignals": [],
    "deviceInfo": { "os": "Android", "version": "13" },
    "timestamp": "2023-12-01T10:05:00Z"
  }
  ```

### `GET /`
- **الوظيفة:** جلب سجلات التتبع (Location Logs).
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.
- **المعاملات (Query Params):** `limit`, `cursor`, `visitId`, `employeeId`, `type`.

---

## 7. Report Module (التقارير)
**Base Path:** `/reports`

### `POST /`
- **الوظيفة:** رفع تقرير مفصل عند إنهاء الزيارة (يتضمن المنتجات والمنافسين).
- **الصلاحيات:** `SalesEmployee`.
- **البيانات المطلوبة (Body):**
  ```json
  {
    "visitId": "uuid-of-visit",
    "summary": "Meeting went well, discussed new prices.",
    "customerFeedback": "Wants a discount.",
    "nextAction": "Follow up in 2 weeks.",
    "notes": "Store was busy.",
    "products": [
      { "name": "Product A", "quantity": 50, "unitPrice": 10.5 }
    ],
    "competitors": [
      { "name": "Competitor X", "product": "Alternative A", "price": 9.5 }
    ]
  }
  ```

### `GET /` و `GET /:id`
- **الوظيفة:** جلب قائمة التقارير / تقرير محدد (بما فيها الأصناف والمنافسين والصور المرفقة).
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.

---

## 8. Image Module (الصور والمرفقات)
**Base Path:** `/images`

### `POST /`
- **الوظيفة:** رفع صورة من الكاميرا (Multipart/Form-Data).
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.
- **البيانات المطلوبة (Form-Data):**
  - `image`: ملف الصورة الفعلي (File).
  - `type`: نوع الصورة (`VISIT_PHOTO`, `REPORT_ATTACHMENT`, `SIGNATURE`).
  - `visitId`: معرف الزيارة (مطلوب لصور الزيارة).
  - `reportId`: معرف التقرير (مطلوب لمرفقات التقرير).
  - `altText`: نص توضيحي (اختياري).

### `GET /` و `GET /:id`
- **الوظيفة:** جلب تفاصيل الصور المرفوعة (المسارات، الحجم، إلخ).
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee`.

---

## 9. Analytics Module (الإحصائيات)
**Base Path:** `/analytics`

### `GET /dashboard`
- **الوظيفة:** جلب ملخص وإحصائيات لاستخدامها في الشاشة الرئيسية للتطبيق/لوحة التحكم.
- **الصلاحيات:** `Admin`, `Manager`, `SalesEmployee` (المندوب يرى إحصائياته، المدير يرى إحصائيات الفريق).
- **المعاملات (Query Params):** `startDate`, `endDate`, `employeeId`.
- **الرد (Response Format):**
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalTasks": 150,
        "completedTasks": 120,
        "pendingTasks": 20,
        "missedTasks": 10,
        "completionRate": 80,
        "totalVisits": 130,
        "totalCustomers": 45
      },
      "recentTasks": [ ... ]
    }
  }
  ```
