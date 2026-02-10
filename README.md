ONBOARDLY – Backend API

NestJS REST API powering Onboardly.

Handles:

Authentication

Organisations

Invites

Employee registration

Ownership tracking

🛠 Tech Stack

NestJS

MongoDB (Mongoose)

JWT Authentication

bcrypt password hashing

TypeScript

🔐 Environment Variables

Create .env

MONGO_URI=mongodb://localhost/onboardly
JWT_SECRET=supersecretkey
CLIENT_URL=http://localhost:3001

🚀 Start Server
npm install
npm run start:dev


Runs on:

http://localhost:3000

🔗 Core API Routes
Method	Route
POST	/auth/register
POST	/auth/login
POST	/organisation
GET	/organisation/me
POST	/invites
GET	/invites
POST	/invites/:token/accept
GET	/users/employees
🗃️ Core Models

User

Organisation

Invite

Tracks:

Who invited whom

Which organisation they belong to

Invite status

🧪 API Testing

A Postman collection is included:

employee-invite-system.postman_collection.json

🧠 Architecture Philosophy

Modular NestJS services

Strict ownership rules

Stateless JWT auth

Clean data relationships

Built for scaling to payroll & attendance