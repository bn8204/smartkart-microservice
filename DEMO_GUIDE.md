# 🎬 SmartKart Cross-Platform Demo Guide

> **Complete guide for demonstrating SmartKart on both Web (PC) and Mobile (Android)**

---

## 🎯 Demo Overview

This demo showcases SmartKart's **microservices architecture** running on:
- 💻 **Web Browser** (React SPA on PC)
- 📱 **Android Phone** (Flutter native app)

Both clients connect to the same backend API Gateway, demonstrating true cross-platform capability.

---

## 🚀 Pre-Demo Setup (10 minutes before presentation)

### 1. Start Backend Services

```powershell
cd C:\APPLICATION\smartcart-microservices

# Start all microservices
podman compose up -d

# Verify all services are running
podman compose ps
```

**Expected Output:**
```
NAME                   STATUS
api-gateway            Up
user-service           Up
product-service        Up
order-service          Up
payment-service        Up
rabbitmq               Up
postgres-users         Up
postgres-products      Up
postgres-orders        Up
postgres-payments      Up
```

### 2. Verify Backend Health

```powershell
# Check health endpoint
curl http://localhost:8080/health

# Expected: {"status":"ok","services":{...}}
```

### 3. Get Your PC's IP Address

```powershell
ipconfig | Select-String "IPv4"
```

**Note your IP** (e.g., `192.168.1.10`) - needed for mobile app!

### 4. Open Web App on PC

Open browser: **http://localhost:3000**

- ✅ You should see SmartKart homepage
- 🔐 Keep this tab open for demo

### 5. Launch Mobile App on Android

**Option A: If already installed**
- Open "SmartKart" app from phone's app drawer

**Option B: Install fresh**
```powershell
cd smartkart_mobile

# Run on connected phone (replace IP with yours)
E:\Flutter\flutter\bin\flutter.bat run --dart-define=GATEWAY_BASE_URL=http://192.168.1.10:8080/api/v1
```

---

## 🎭 Demo Script (5-7 minutes)

### **Part 1: Introduction (30 seconds)**

> "Welcome! Today I'll demonstrate SmartKart - a production-grade e-commerce platform built with **microservices architecture**. 
> 
> What makes this unique? It's **truly cross-platform** - the same backend serves both a React web app and a Flutter mobile app. Let me show you."

---

### **Part 2: Web Demo on PC (2 minutes)**

#### 2.1 Register User (30 seconds)

On **PC Browser**:
1. Click **"Register"**
2. Fill details:
   - Name: `John Doe`
   - Email: `john@demo.com`
   - Password: `Demo@123`
3. Click **"Register"**

> "Here on the web browser, I'm creating a new customer account. The **User Service** handles authentication using JWT tokens and stores passwords securely with bcrypt."

#### 2.2 Browse Products (30 seconds)

1. Click **"Products"** in navigation
2. Scroll through product catalog
3. Use **search box**: search for "Laptop"
4. Click on a product for details

> "The **Product Service** manages our catalog with real-time stock tracking. Notice the pagination and search - all handled by dedicated microservices."

#### 2.3 Add to Cart (30 seconds)

1. On product details, click **"Add to Cart"**
2. Adjust quantity if desired
3. Click **"View Cart"**
4. Show cart summary

> "When I add items, the **Order Service** creates a cart. Each service has its own PostgreSQL database - this is the **Database per Service** pattern."

#### 2.4 Checkout (30 seconds)

1. Click **"Proceed to Checkout"**
2. Enter shipping address
3. Click **"Place Order"**
4. Show order confirmation

> "The checkout triggers our **Saga pattern** - the Order Service publishes an event to RabbitMQ, the Payment Service listens and processes it. This is **choreography-based orchestration**."

---

### **Part 3: Mobile Demo on Android (2 minutes)**

**Switch to your Android phone** (ensure screen is visible/mirrored)

> "Now, watch this - I'm going to do the exact same shopping flow, but on my Android phone. **Same backend, different client**. This is the power of microservices!"

#### 3.1 Mobile Registration (30 seconds)

On **Android Phone**:
1. Show SmartKart app home screen
2. Tap **"Register"** (or use different email: `jane@demo.com`)
3. Fill form
4. Tap **"Register"**

> "This is a native Flutter app with Material Design. It talks to the same API Gateway - notice how fast it responds!"

#### 3.2 Mobile Shopping (45 seconds)

1. Tap **"Products"** tab
2. Browse catalog (show smooth scrolling)
3. Search for "Phone"
4. Tap a product
5. Tap **"Add to Cart"**
6. Show floating cart icon with count

> "The mobile experience is native - smooth animations, touch gestures, offline support. But it's hitting the same **Order Service** backend."

#### 3.3 Mobile Checkout (45 seconds)

1. Tap **"Cart"** tab
2. Show cart items
3. Tap **"Checkout"**
4. Enter address
5. Tap **"Place Order"**
6. Show order confirmation screen

> "And there - order placed from mobile! If you check the web dashboard, you'll see this order appear instantly. Both clients, one backend."

---

### **Part 4: Architecture Highlight (1 minute)**

**Switch back to PC - open Architecture Diagram**

Open: **http://localhost:8080/api-docs**

Or show diagram from: `documentation/diagrams/architecture.mmd`

> "Let me show you the architecture:
> 
> - **5 microservices**: User, Product, Order, Payment, API Gateway
> - **4 PostgreSQL databases** - isolated per service
> - **RabbitMQ** for async messaging
> - **JWT authentication** - token stored securely on device
> - **Single API Gateway** (:8080) - all clients connect here
> - **Docker containers** - everything is containerized
> 
> The beauty? Adding a new client (iOS, desktop, smartwatch) requires **zero backend changes**. Just consume the REST API."

---

### **Part 5: Admin Dashboard (Optional - 30 seconds)**

If time permits:

On **PC Browser**:
1. Logout
2. Login as admin: `admin@smartkart.com` / `Admin@123`
3. Show **Admin Dashboard**
4. Show order list with both web and mobile orders
5. Update order status

> "Admin users have a special dashboard to manage orders. Notice both our web order and mobile order are here - they're treated identically by the backend."

---

### **Part 6: Conclusion (30 seconds)**

> "To recap:
> - ✅ **Microservices** - 5 independent services
> - ✅ **Cross-platform** - Web and Mobile (Android/iOS ready)
> - ✅ **Event-driven** - Saga pattern with RabbitMQ
> - ✅ **Secure** - JWT auth, bcrypt passwords, HTTPS ready
> - ✅ **Scalable** - Each service scales independently
> - ✅ **Production-ready** - Swagger docs, monitoring, CI/CD
> 
> All code is on GitHub: **github.com/bn8204/smartkart-microservice**
> 
> Questions?"

---

## 🎬 Quick Reference - Demo Flow

| Step | Platform | Action | Duration |
|------|----------|--------|----------|
| 1 | PC Web | Register → Browse → Cart → Checkout | 2 min |
| 2 | Android | Register → Browse → Cart → Checkout | 2 min |
| 3 | PC | Show Architecture Diagram | 1 min |
| 4 | PC | Admin Dashboard (optional) | 30 sec |
| 5 | - | Q&A | 2-3 min |

**Total Time: 5-7 minutes**

---

## 🔧 Troubleshooting

### Mobile app shows "Network Error"

**Check:**
1. PC and phone on same WiFi? → Use `ipconfig` to verify
2. Firewall blocking port 8080? → Run: `netsh advfirewall firewall add rule name="SmartCart API" dir=in action=allow protocol=TCP localport=8080`
3. Backend running? → `podman compose ps`
4. Test from phone browser: `http://YOUR_IP:8080/api/v1/products`

### Services not starting

```powershell
# Clean restart
podman compose down -v
podman compose up --build
```

### Mobile app not installed

```powershell
cd smartkart_mobile

# Install directly (phone connected via USB)
E:\Flutter\flutter\bin\flutter.bat install
```

---

## 📱 Screen Mirroring Setup (For Better Visibility)

To show mobile screen on PC during demo:

**Option 1: Windows Phone Link**
- Install "Phone Link" on PC
- Install "Link to Windows" on Android
- Follow pairing instructions

**Option 2: scrcpy (USB)**
```powershell
# Install via Chocolatey
choco install scrcpy

# Run (phone connected via USB)
scrcpy
```

**Option 3: Vysor (Wireless)**
- Install Vysor Chrome extension
- Connect phone via WiFi

---

## 🎥 Recording the Demo

```powershell
# Windows built-in screen recorder
Win + G  # Open Xbox Game Bar
Click "Record"
```

Or use:
- **OBS Studio** (recommended for professional recording)
- **Camtasia** (paid, excellent editing)
- **Loom** (quick web-based recording)

---

## ✅ Pre-Demo Checklist

- [ ] Backend services running (`podman compose ps`)
- [ ] Health check passes (`curl http://localhost:8080/health`)
- [ ] Web app loads (`http://localhost:3000`)
- [ ] Mobile app installed and opens
- [ ] PC and phone on same WiFi
- [ ] Know your PC's IP address
- [ ] Browser tabs prepared (web app, Swagger, architecture diagram)
- [ ] Mobile screen mirroring working (optional)
- [ ] Test accounts ready (or will create live)

---

## 🌟 Key Talking Points

1. **"Database per Service"** - Each microservice owns its data
2. **"API Gateway Pattern"** - Single entry point for all clients
3. **"Saga Pattern"** - Distributed transactions via events
4. **"JWT Authentication"** - Stateless, secure, scalable
5. **"Cross-Platform"** - Write backend once, support all clients
6. **"Clean Architecture"** - Separation of concerns (Flutter app)
7. **"Docker Compose"** - Everything containerized
8. **"RabbitMQ"** - Async messaging for resilience

---

**Good luck with your demo! 🚀**

*For questions or issues, check the main README or documentation folder.*
