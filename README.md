# ONBOARDLY — Backend API

The backend API for **Onboardly**, a modern workforce onboarding and employee management platform.

This service provides authentication, organisation management, invite-based employee onboarding, and ownership tracking using JWT and MongoDB.

## Tech Stack
- NestJS
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt password hashing
- TypeScript

## Features
- SuperUser and Admin authentication
- Organisation creation (SuperUser only)
- Secure invite link generation
- Invite-based employee registration
- Ownership tracking (who invited who)
- JWT-protected API routes
- Role-based permission logic

## Environment Variables
MONGO_URI=mongodb://localhost/onboardly
JWT_SECRET=supersecretkey
CLIENT_URL=http://localhost:3001

## Getting Started
npm install
npm run start:dev

Server runs on http://localhost:3000
