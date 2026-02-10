# ONBOARDLY – Backend API

The backend API for **Onboardly**, a modern workforce onboarding and employee management platform.

This service handles authentication, organisation management, invite-based employee onboarding, and ownership tracking using JWT authentication and MongoDB.

---

## 🚀 Tech Stack

- NestJS
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt (password hashing)
- TypeScript

---

## 📦 Features

- SuperUser & Admin authentication
- Organisation creation (SuperUser only)
- Secure invite link generation
- Invite-based employee registration
- Invite ownership tracking
- JWT-protected routes
- Role-based access logic

---

## 🔐 Environment Variables

Create a `.env` file in the root of the backend project:

MONGO_URI=mongodb://localhost/onboardly
JWT_SECRET=supersecretkey
CLIENT_URL=http://localhost:3001


---

## 🏁 Getting Started

Install dependencies:
```bash
npm install

Run the API in development mode:

npm run start:dev

http://localhost:3000

🔗 Core API Endpoints
Method	Endpoint	Description
POST	/auth/register	Register SuperUser or Admin
POST	/auth/login	Login
POST	/organisation	Create organisation (SuperUser only)
GET	/organisation/me	Get current organisation
POST	/invites	Generate invite link
GET	/invites	List all invites
POST	/invites/:token/accept	Register employee via invite
GET	/users/employees	List employees in organisation

🗃 Database Models
User

name

email

password (hashed)

isSuperUser

isAdminUser

organisation

invitedBy

timestamps

Organisation

name

createdBy

timestamps

Invite

email

token

organisation

invitedBy

used

expiresAt

timestamps

🔐 Authentication

Onboardly uses pure JWT authentication:

No Passport

No sessions

Stateless API

JWT is returned on login and must be sent in the Authorization header:

Authorization: Bearer <token>

🧪 API Testing

A Postman collection is included in the project:

employee-invite-system.postman_collection.json

Use it to test all authentication, invite, and organisation flows.

🧠 Architecture

The backend is structured using clean NestJS modules:

Auth

Users

Organisations

Invites

All business logic enforces:

Organisation ownership

Invite ownership

Role permissions

Secure token handling

🔮 Future Expansion

The architecture is built to support:

Attendance tracking (clock in / clock out)

Payroll

HR analytics

Leave management

ONBOARDLY
Modern workforce onboarding, built to scale.

