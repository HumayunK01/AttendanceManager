# 📧 Attendly Mailer Service

A lightweight Node.js microservice for sending automated transactional emails (Welcome Credential) using Gmail SMTP.

## 🚀 Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in this directory (`mailer/.env`):
    ```env
    PORT=5001
    EMAIL_USER=attendly.system@gmail.com
    EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # <--- Generate this from Google Account Security
    ```
    > **Note**: For Gmail, you *must* use an [App Password](https://myaccount.google.com/apppasswords), not your regular password.

3.  **Run Service**
    ```bash
    npm run dev
    ```
    The service runs on port `5001`.

## 🔌 API

### `POST /api/send-credentials`

**Payload:**
```json
{
  "email": "student@college.edu",
  "name": "John Doe",
  "role": "STUDENT",
  "password": "secure-random-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "<...>"
}
```
