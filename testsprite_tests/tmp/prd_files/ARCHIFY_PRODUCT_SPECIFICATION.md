# Archify - Product Specification Document

## 📋 Project Overview

**Product Name:** Archify - Solutions d'Archives  
**Tagline:** "Solutions d'Archives pour Étudiants IG"  
**Version:** 1.0.0  
**Last Updated:** October 2024  

### Mission Statement
Archify is a specialized educational platform designed exclusively for ISCAE "Informatique du Gestion" students, providing comprehensive solutions for past exams and tests to help students excel in their studies.

### Problem Statement
ISCAE IG students face significant challenges in accessing quality solutions for past exams and tests. The university maintains archives, but new exams often mirror past ones. Students need a centralized, professional platform to access video solutions and document corrections for key subjects.

## 🎯 Target Audience

### Primary Users
- **ISCAE "Informatique du Gestion" Students**
- **Academic Level:** University students (S1-S6)
- **Geographic Focus:** Morocco
- **Language:** French (primary), Arabic (secondary)

### User Personas
1. **Active Student (S1-S3)**
   - Needs comprehensive exam preparation
   - Budget-conscious but values quality education
   - Prefers video solutions for complex problems

2. **Graduating Student (S4-S6)**
   - Focuses on final exam preparation
   - Values both video and document access
   - Willing to invest in premium content

## 🚀 Core Features

### 1. Dual Subscription System
- **Videos Only Plan:** 650 MRU/month
  - Access to video solutions for all subjects
  - High-quality video explanations
  - Mobile-optimized streaming

- **Documents Only Plan:** 500 MRU/month
  - Access to PDF solutions and exercises
  - Downloadable study materials
  - Offline access capability

- **Full Access Plan:** 1000 MRU/month (Future)
  - Combined video and document access
  - Premium features and priority support

### 2. Subject Coverage
**Core Subjects:**
- **Analyse Mathématique** - Mathematical Analysis
- **Logique Mathématique** - Mathematical Logic
- **Algorithmique** - Algorithms
- **Architecture des Ordinateurs** - Computer Architecture

**Content Types:**
- Video solutions for past exams
- PDF corrections and exercises
- Step-by-step problem solving
- Archive organization by semester

### 3. User Management System
- **Student Registration** with ISCAE email verification
- **Profile Management** with semester tracking
- **Progress Tracking** for completed lessons
- **Subscription Management** with payment history

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework:** Angular 20.3.0
- **UI Library:** Angular Material + Tailwind CSS
- **State Management:** Angular Signals
- **PDF Viewer:** ngx-extended-pdf-viewer
- **Video Player:** @vimeo/player
- **Internationalization:** @ngx-translate

### Backend Stack
- **Runtime:** Node.js with Express.js 5.1.0
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 5.19.1
- **Authentication:** JWT with bcryptjs
- **Validation:** Zod schemas

### Database Schema
```prisma
// Core Entities
- User (students, admins, superadmins)
- Department (Informatique de Gestion)
- Course (subject-specific courses)
- Lesson (video/PDF/exam content)
- SubscriptionPlan (pricing tiers)
- Subscription (user subscriptions)
- Payment (transaction records)
```

### API Architecture
- **RESTful API** with proper HTTP methods
- **Role-based Access Control** (RBAC)
- **JWT Authentication** with refresh tokens
- **Input Validation** with Zod schemas
- **Error Handling** with standardized responses

## 👥 User Roles & Permissions

### 1. Student Role
**Permissions:**
- View available courses and lessons
- Access subscribed content
- Track learning progress
- Manage subscription
- Comment on lessons

**Restrictions:**
- Cannot access admin features
- Limited to subscribed content only
- Cannot modify content

### 2. Admin Role
**Permissions:**
- Full content management (CRUD)
- User management
- Subscription plan management
- Analytics dashboard
- Course and lesson creation

**Restrictions:**
- Cannot create other admins
- Cannot access superadmin features

### 3. Superadmin Role
**Permissions:**
- All admin permissions
- Create other admins
- System configuration
- Full platform control
- Advanced analytics

## 💳 Payment Integration

### Supported Payment Providers
1. **Bankily** - Local Moroccan payment gateway
2. **Masrivi** - Mobile payment solution
3. **Sedad** - Banking integration

### Payment Flow
1. User selects subscription plan
2. Chooses payment provider
3. Redirected to payment gateway
4. Payment verification
5. Subscription activation
6. Access granted to content

### Pricing Strategy
- **Competitive Pricing** for Moroccan market
- **Flexible Plans** to suit different needs
- **Transparent Pricing** with no hidden fees
- **Monthly Subscriptions** with easy cancellation

## 📊 Admin Dashboard Features

### Content Management
- **Course Management:** Create, edit, delete courses
- **Lesson Management:**** Upload videos, PDFs, manage content
- **Subject Organization:** Categorize by semester and difficulty
- **Content Analytics:** Track views, engagement, completion rates

### User Management
- **User Overview:** Total users, active subscriptions, growth metrics
- **User Details:** Individual user profiles, subscription history
- **Role Management:** Assign and modify user roles
- **Support Tools:** User communication and support

### Analytics Dashboard
- **Revenue Tracking:** Monthly/yearly revenue, subscription trends
- **User Engagement:** Most popular content, completion rates
- **Growth Metrics:** User acquisition, retention rates
- **Performance Monitoring:** System health, response times

### Subscription Management
- **Plan Configuration:** Create and modify subscription plans
- **Pricing Management:** Update prices, features, descriptions
- **Subscription Monitoring:** Active subscriptions, cancellations
- **Payment Tracking:** Transaction history, failed payments

## 🎨 User Experience Design

### Design Principles
- **Mobile-First:** Responsive design for all devices
- **Intuitive Navigation:** Clear, logical user flow
- **Professional Aesthetic:** Modern, clean interface
- **Accessibility:** WCAG 2.1 compliance

### Key User Flows
1. **Registration Flow:**
   - Email verification
   - Profile setup
   - Subscription selection
   - Payment processing

2. **Content Access Flow:**
   - Browse courses
   - Select subject
   - Choose lesson
   - Access content (video/PDF)

3. **Admin Management Flow:**
   - Login to admin dashboard
   - Navigate to management section
   - Perform CRUD operations
   - Monitor results

### UI/UX Features
- **Glassmorphism Design:** Modern, elegant interface
- **Gradient Backgrounds:** Visual appeal and brand identity
- **Interactive Elements:** Hover effects, smooth transitions
- **Loading States:** User feedback during operations
- **Error Handling:** Clear, actionable error messages

## 🔒 Security & Compliance

### Authentication Security
- **JWT Tokens:** Secure, stateless authentication
- **Password Hashing:** bcryptjs with salt rounds
- **Session Management:** Secure token refresh
- **Role-Based Access:** Granular permission system

### Data Protection
- **Input Validation:** All user inputs validated
- **SQL Injection Prevention:** Prisma ORM protection
- **XSS Protection:** Input sanitization
- **CSRF Protection:** Token-based validation

### Privacy Compliance
- **Data Minimization:** Collect only necessary data
- **User Consent:** Clear privacy policy
- **Data Retention:** Automatic cleanup of old data
- **Secure Storage:** Encrypted sensitive information

## 📱 Platform Features

### Student Features
- **Course Catalog:** Browse available subjects and courses
- **Video Streaming:** High-quality video playback
- **PDF Viewer:** In-browser PDF reading
- **Progress Tracking:** Monitor completed lessons
- **Search & Filter:** Find specific content quickly
- **Mobile App:** Responsive mobile experience

### Admin Features
- **Content Upload:** Easy video and PDF upload
- **Bulk Operations:** Manage multiple items efficiently
- **Analytics Dashboard:** Comprehensive reporting
- **User Support:** Direct user communication
- **System Monitoring:** Platform health tracking

### Technical Features
- **CDN Integration:** Fast content delivery
- **Video Optimization:** Adaptive streaming
- **PDF Compression:** Efficient file storage
- **Caching Strategy:** Improved performance
- **Error Monitoring:** Proactive issue detection

## 🚀 Future Roadmap

### Phase 1 (Current) - Foundation
- ✅ User authentication and registration
- ✅ Basic subscription system
- ✅ Content management system
- ✅ Admin dashboard
- ✅ Payment integration

### Phase 2 (Q1 2025) - Enhancement
- **Mobile Application:** Native iOS/Android apps
- **Advanced Analytics:** Detailed user behavior tracking
- **Notification System:** Email and in-app notifications
- **Social Features:** User comments and discussions
- **Offline Mode:** Download content for offline viewing

### Phase 3 (Q2 2025) - Expansion
- **Additional Subjects:** Expand beyond core 4 subjects
- **AI-Powered Recommendations:** Personalized content suggestions
- **Live Streaming:** Real-time exam preparation sessions
- **Collaborative Features:** Study groups and peer learning
- **Advanced Search:** AI-powered content discovery

### Phase 4 (Q3 2025) - Innovation
- **Virtual Reality:** Immersive learning experiences
- **AI Tutoring:** Personalized learning assistance
- **Gamification:** Points, badges, and achievements
- **Integration:** LMS integration with ISCAE systems
- **International Expansion:** Other universities and countries

## 📈 Success Metrics

### User Engagement
- **Monthly Active Users (MAU)**
- **Content Completion Rate**
- **User Retention Rate**
- **Session Duration**

### Business Metrics
- **Monthly Recurring Revenue (MRR)**
- **Customer Acquisition Cost (CAC)**
- **Customer Lifetime Value (CLV)**
- **Churn Rate**

### Technical Metrics
- **Page Load Time**
- **Video Streaming Quality**
- **System Uptime**
- **Error Rate**

## 🎯 Competitive Advantages

### Unique Value Propositions
1. **ISCAE-Specific:** Tailored exclusively for IG students
2. **Archive Focus:** Specialized in past exam solutions
3. **Dual Subscription:** Flexible pricing options
4. **Quality Content:** Professional video production
5. **Local Payment:** Moroccan payment integration

### Market Differentiation
- **Niche Focus:** Specialized vs. general education platforms
- **Local Expertise:** Understanding of ISCAE curriculum
- **Affordable Pricing:** Competitive for Moroccan market
- **Quality Assurance:** Professional content production
- **Student-Centric:** Built by students, for students

## 📞 Support & Maintenance

### User Support
- **Help Center:** Comprehensive documentation
- **Email Support:** Direct communication channel
- **FAQ Section:** Common questions and answers
- **Video Tutorials:** Platform usage guides

### Technical Support
- **24/7 Monitoring:** System health tracking
- **Regular Updates:** Feature improvements and bug fixes
- **Performance Optimization:** Continuous performance tuning
- **Security Updates:** Regular security patches

### Content Maintenance
- **Regular Updates:** Fresh content addition
- **Quality Control:** Content review and improvement
- **Archive Management:** Organized content structure
- **Version Control:** Content versioning and updates

---

**Document Version:** 1.0  
**Last Updated:** October 2024  
**Next Review:** November 2024  
**Owner:** Archify Development Team  
**Status:** Active Development  

---

*This document serves as the comprehensive specification for the Archify platform, outlining all features, technical requirements, and strategic direction for the project.*
