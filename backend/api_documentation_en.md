# GESCA API Documentation

The API is designed following RESTful principles using `Express` and `Prisma`. The `/api` prefix is added to all routes by default.
All requests (except login) require a `Bearer Token` in the `Authorization` header.

---

## 1. Auth Module
**Base Path:** `/auth`

### `POST /register`
- **Description:** Register a new user in the system.
- **Roles:** `Admin` only.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "role": "SalesEmployee", // Enum: Admin, Manager, SalesEmployee
    "phone": "+20100000000" // Optional
  }
  ```

### `POST /login`
- **Description:** Login and receive JWT tokens.
- **Roles:** Public.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response:** Contains `user`, `accessToken`, and `refreshToken`.

---

## 2. Employee Module
**Base Path:** `/employees`

### `GET /`
- **Description:** Get a paginated list of employees.
- **Roles:** `Admin`, `Manager`.
- **Query Params:** `limit`, `cursor`, `role`, `search`.

### `GET /:id`
- **Description:** Get specific employee details.
- **Roles:** `Admin`, `Manager`.

### `PUT /:id/status`
- **Description:** Enable or disable an employee account.
- **Roles:** `Admin` only.
- **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```

### `POST /:id/reset-password`
- **Description:** Reset an employee's password (by admin).
- **Roles:** `Admin` only.
- **Request Body:**
  ```json
  {
    "newPassword": "newPassword123"
  }
  ```

---

## 3. Customer Module
**Base Path:** `/customers`

### `POST /`
- **Description:** Add a new customer.
- **Roles:** `Admin`, `Manager`.
- **Request Body:**
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
- **Description:** Get a list of customers.
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.
- **Query Params:** `limit`, `cursor`, `search`.

### `GET /:id`
- **Description:** Get specific customer details (including branches/locations).
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.

### `PUT /:id`
- **Description:** Update customer details.
- **Roles:** `Admin`, `Manager`.
- **Request Body:** Same as creation (all fields optional).

### `POST /:id/locations`
- **Description:** Add a new GPS branch/location for a customer.
- **Roles:** `Admin`, `Manager`.
- **Request Body:**
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

## 4. Task Module
**Base Path:** `/tasks`

### `POST /`
- **Description:** Create a new scheduled task/visit for an employee.
- **Roles:** `Admin`, `Manager`.
- **Request Body:**
  ```json
  {
    "employeeId": "uuid-here",
    "customerId": "uuid-here",
    "locationId": "uuid-here", // Optional (specific branch)
    "title": "Monthly Check",
    "description": "Check inventory",
    "scheduledDate": "2023-12-01T00:00:00Z",
    "scheduledStartTime": "10:00:00.000Z", // Optional
    "scheduledEndTime": "11:00:00.000Z", // Optional
    "priority": 2 // 1=Low, 2=Medium, 3=High
  }
  ```

### `GET /`
- **Description:** Get a list of tasks. Employees only see their own; managers see their team's.
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.
- **Query Params:** `limit`, `cursor`, `status`, `employeeId`, `customerId`, `startDate`, `endDate`.

---

## 5. Visit Module
**Base Path:** `/visits`

### `POST /`
- **Description:** Initialize a visit based on a scheduled task.
- **Roles:** `SalesEmployee`.
- **Request Body:**
  ```json
  {
    "taskId": "uuid-of-the-task"
  }
  ```

### `GET /`
- **Description:** Get a list of visits.
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.
- **Query Params:** `limit`, `cursor`, `status`, `taskId`, `employeeId`.

### `PUT /:id/status`
- **Description:** Update visit status (e.g., to cancel it).
- **Roles:** `Admin`, `SalesEmployee`.
- **Request Body:**
  ```json
  {
    "status": "CANCELED",
    "notes": "Customer was closed"
  }
  ```

---

## 6. Attendance & GPS Module
**Base Path:** `/attendances`

### `POST /`
- **Description:** Log employee GPS coordinates (Check-In or Check-Out) and automatically update Task/Visit status.
- **Roles:** `SalesEmployee`.
- **Request Body:**
  ```json
  {
    "visitId": "uuid-of-visit",
    "type": "CHECK_IN", // or "CHECK_OUT"
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
- **Description:** Get location logs.
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.
- **Query Params:** `limit`, `cursor`, `visitId`, `employeeId`, `type`.

---

## 7. Report Module
**Base Path:** `/reports`

### `POST /`
- **Description:** Submit a detailed visit report including products and competitors.
- **Roles:** `SalesEmployee`.
- **Request Body:**
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

### `GET /` & `GET /:id`
- **Description:** Get a list of reports or a specific report (including products, competitors, and images).
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.

---

## 8. Image Module
**Base Path:** `/images`

### `POST /`
- **Description:** Upload an image using Multipart/Form-Data.
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.
- **Request Body (Form-Data):**
  - `image`: The physical file.
  - `type`: Image type (`VISIT_PHOTO`, `REPORT_ATTACHMENT`, `SIGNATURE`).
  - `visitId`: Required for visit photos.
  - `reportId`: Required for report attachments.
  - `altText`: Optional description.

### `GET /` & `GET /:id`
- **Description:** Get uploaded image metadata.
- **Roles:** `Admin`, `Manager`, `SalesEmployee`.

---

## 9. Analytics Module
**Base Path:** `/analytics`

### `GET /dashboard`
- **Description:** Get dashboard statistics and overview.
- **Roles:** `Admin`, `Manager`, `SalesEmployee` (Employees only see their own stats).
- **Query Params:** `startDate`, `endDate`, `employeeId`.
- **Response Format:**
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
