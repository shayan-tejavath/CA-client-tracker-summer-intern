# CA Client Tracker

## Overview

CA Client Tracker is a full-stack practice management application designed to support the day-to-day operations of Chartered Accountant firms. The platform provides a centralized system for managing clients, services, tasks, documents, employees, attendance, billing, expenses, notifications, communication, workflows, and reports.

The application follows a modular architecture with a React-based frontend and a Node.js/Express backend backed by MongoDB. It also includes role-based access control, company-level data isolation, automated task reminders, data export functionality, and infrastructure configuration for AWS deployment.

---

## Objectives

The primary objectives of the system are:

* Centralize client and practice-related information.
* Simplify client and service management.
* Organize tasks and recurring workflows.
* Manage client and task-related documents.
* Provide role-based access to application functionality.
* Track employee activities and attendance.
* Manage invoices, quotations, expenses, and receipts.
* Provide analytical dashboards and reports.
* Support automated task reminders and notifications.
* Provide a scalable foundation for multi-company CA practice management.

---

## Core Modules

### Authentication and Authorization

The application implements authentication and role-based access control for different categories of users.

Supported roles include:

* SuperAdmin
* Partner
* Manager
* Employee
* Client

The authorization system combines roles and permissions to control access to application resources.

Key capabilities include:

* User authentication
* Company onboarding
* SuperAdmin registration
* JWT-based authentication
* Password hashing using bcrypt
* Role and permission management
* Protected frontend routes
* Protected backend APIs
* Company-level access control
* Client-specific access restrictions

---

### Client Management

The client management module provides functionality for maintaining detailed client records.

Client information can include:

* Client name
* Client code
* Email
* Mobile number
* Alternate contact information
* Address
* Contact person
* Designation
* PAN
* GSTIN
* TAN
* CIN
* MSME information
* Industry
* Annual turnover
* Business start date
* Date of birth
* Client type
* Client status
* Tags
* Assigned services

Client operations include:

* Creating clients
* Viewing client information
* Searching clients
* Filtering clients
* Pagination
* Updating client information
* Archiving clients
* Restoring archived clients
* Managing profile images
* Assigning services
* Viewing client-specific documents

The system also supports importing client information from Excel files, including template download, file upload, validation, preview, and bulk import.

---

### Service Management

The service management module allows CA firms to define and manage professional services provided to clients.

The module supports:

* Creating services
* Updating services
* Viewing services
* Service categorization
* Assigning services to clients
* Service-based workflow configuration

Services can be associated with workflow templates that define the tasks required to complete a particular service.

---

### Workflow Management

Workflow templates provide a structured approach to recurring professional processes.

A workflow can define a sequence of tasks associated with a particular service. When applicable, assigning a service to a client can result in the creation of tasks based on the configured workflow.

This reduces repetitive manual task creation and provides a standardized process for recurring client work.

---

### Task Management

The task management module is used to create, assign, and monitor work performed by employees.

Task functionality includes:

* Task creation
* Task assignment
* Task status management
* Priority management
* Due dates
* Recurring tasks
* Client association
* Employee assignment
* Task activities
* Subtasks
* Checklists
* Task-related documents
* Overdue task tracking

Tasks can be monitored through dashboards and reports to provide visibility into employee workload and completion status.

---

### Document Management

The document management module provides centralized management of documents associated with clients and tasks.

Supported functionality includes:

* Document upload
* Document categorization
* Document descriptions
* Tags
* Confidential document classification
* Expiry dates
* Client association
* Task association
* Document search
* Filtering
* Document archiving
* Document movement tracking
* Return status
* Return date
* Location tracking
* Notes

The system also provides document-register functionality for tracking document movement and return status.

Client users are restricted to documents associated with their own records through backend authorization checks.

---

### Digital Signature Certificate Management

The application includes a Digital Signature Certificate management module for maintaining DSC-related records associated with clients and practice operations.

---

### Employee Management

The employee management module allows authorized users to manage employees and application users.

Employee information is used across multiple modules, including:

* Task assignment
* Workflow execution
* Attendance
* Employee reporting
* Notifications
* Practice management

---

### Attendance Management

The attendance module provides functionality for recording and managing employee attendance.

Attendance information can be used as part of employee and practice-level reporting.

---

### Invoicing and Quotations

The application provides modules for managing financial documents associated with client engagements.

#### Invoices

The invoice module supports:

* Invoice creation
* Invoice listing
* Invoice details
* Invoice management
* Permission-based access

#### Quotations

The quotation module supports:

* Quotation creation
* Quotation listing
* Quotation details
* Quotation management

---

### Expense Management

The expense management module provides functionality for recording and managing practice-related expenses.

The module supports:

* Expense creation
* Expense management
* Expense details
* Expense editing
* Expense reporting

---

### Receipt Management

The receipt module provides functionality for managing receipts associated with financial operations.

Supported operations include:

* Receipt creation
* Receipt listing
* Receipt details
* Receipt management

---

### Dashboard and Analytics

The application provides dashboards containing operational and analytical information.

The backend analytics functionality includes metrics such as:

* Total clients
* Active clients
* Total tasks
* Completed tasks
* Pending tasks
* Overdue tasks
* Employee statistics
* Task status distribution
* Task priority distribution
* Client growth
* Monthly task creation

The frontend provides visual representations of relevant analytics.

---

### Reports and Data Export

The reporting module provides reports for different operational areas.

Available report categories include:

* Task reports
* Client reports
* Service reports
* Employee reports
* Analytics

The system supports exporting selected report data in:

* CSV
* XLSX

The exported information can include client details, task information, service information, employee performance, task status, priorities, and related operational data.

---

### Notifications and Messaging

The application contains an internal notification and messaging system.

Notifications can be generated for application events such as:

* Employee onboarding
* Client-related operations
* Document uploads
* Task-related activities
* Task reminders

The messaging module provides an interface for communication between application users.

---

### Automated Task Reminders

The backend includes scheduled task-reminder functionality using `node-cron`.

The reminder system is separated into dedicated services responsible for:

* Identifying tasks requiring reminders
* Processing reminders
* Generating notifications
* Sending reminder-related communication

This provides automated support for tracking task deadlines and recurring work.

---

### Email Integration

The backend includes email-related services for application notifications and system communication.

The implementation includes integration with the UMS email service and supports email queuing for applicable application events.

---

## Multi-Company Architecture

The application is designed to support multiple CA firms within the same system.

Application resources are associated with a company through `companyId`, allowing backend operations to be scoped to the authenticated user's company.

Company-level isolation is applied across modules including:

* Clients
* Services
* Tasks
* Documents
* Employees
* Reports
* Notifications
* Billing
* Expenses

This architecture provides a foundation for multi-tenant practice management.

---

## Technology Stack

### Frontend

* React 18
* Vite
* React Router
* Axios
* Tailwind CSS
* Framer Motion
* Recharts
* Lucide React
* React Icons
* Radix UI
* React Toastify

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Tokens
* bcryptjs
* Multer
* Cloudinary
* Axios
* Nodemailer
* node-cron

### Data Processing and Reporting

* ExcelJS
* XLSX
* JSON2CSV
* PDFKit

### Infrastructure and Deployment

* Docker
* Terraform
* Amazon EC2
* Amazon S3
* Amazon CloudFront
* MongoDB Atlas

---

## System Architecture

```text
                              Users
                                |
                                v
                    +-----------------------+
                    |    React Frontend     |
                    |       Vite            |
                    +-----------+-----------+
                                |
                           REST APIs
                                |
                                v
                    +-----------------------+
                    |    Express Backend    |
                    +-----------+-----------+
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
        +-----------+     +-----------+     +-----------+
        |   Auth &  |     | Business  |     | Services  |
        |    RBAC   |     |  Logic    |     | / Jobs    |
        +-----------+     +-----------+     +-----------+
                                |
                                v
                       +----------------+
                       |    MongoDB     |
                       |   / Mongoose   |
                       +----------------+
```

---

## Project Structure

```text
CA-client-tracker-summer-intern/
│
├── .github/
│   └── workflows/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── constants/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       │   ├── attendance/
│       │   ├── auth/
│       │   ├── calendar/
│       │   ├── clients/
│       │   ├── dashboard/
│       │   ├── documents/
│       │   ├── employees/
│       │   ├── expenses/
│       │   ├── invoices/
│       │   ├── messaging/
│       │   ├── quotations/
│       │   ├── receipts/
│       │   ├── reports/
│       │   ├── services/
│       │   ├── superadmin/
│       │   ├── tasks/
│       │   ├── todos/
│       │   └── users/
│       ├── redux/
│       ├── routes/
│       ├── services/
│       ├── styles/
│       └── utils/
│
├── backend/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── templates/
│   ├── tests/
│   ├── uploads/
│   ├── utils/
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
│
├── deploy/
├── docs/
├── terraform/
├── uploads/
│
├── AUTH_TEST.ps1
├── AUTH_TEST.sh
├── .env.example
└── package.json
```

---

## Database Models

The backend contains dedicated Mongoose models for the application's major entities, including:

```text
Attendance
Checklist
Client
Company
Document
DscRecord
Expense
Invoice
Notification
Permission
Quotation
Receipt
SelfAttendancePermission
Service
ServiceAssignment
SubTask
Task
TaskActivity
TaskDocument
TaskDocumentRequest
Todo
User
UserRole
Workflow
WorkflowTemplate
```

---

## API Structure

The backend separates API functionality into domain-specific route modules.

```text
/api/auth
/api/clients
/api/services
/api/tasks
/api/checklists
/api/employees
/api/documents
/api/dsc
/api/dashboard
/api/notifications
/api/messages
/api/workflow
/api/admin
/api/reports
/api/attendance
/api/invoices
/api/receipts
/api/quotations
/api/expenses
/api/todos
```

This modular routing structure separates business functionality and simplifies future maintenance and extension.

---

## Security

Security considerations implemented within the application include:

* JWT-based authentication
* Password hashing using bcrypt
* Role-based authorization
* Permission-based authorization
* Protected frontend routes
* Protected backend endpoints
* Company-level data isolation
* Client-level access restrictions
* Environment-based configuration
* CORS configuration
* Backend validation and authorization checks

Sensitive configuration values should be stored using environment variables and must not be committed to the repository.

---

## Local Development

### Prerequisites

The following software is required:

* Node.js
* npm
* MongoDB or MongoDB Atlas
* Git

For AWS deployment:

* AWS CLI
* Terraform
* Docker
* AWS account
* MongoDB Atlas account

---

### Clone the Repository

```bash
git clone https://github.com/shayan-tejavath/CA-client-tracker-summer-intern.git

cd CA-client-tracker-summer-intern
```

---

### Backend Setup

```bash
cd backend
npm install
```

Create the environment configuration:

```bash
cp .env.example .env
```

Configure the required database, authentication, CORS, email, and external-service variables.

Start the development server:

```bash
npm run dev
```

For production:

```bash
npm start
```

---

### Frontend Setup

Open a separate terminal:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server will provide the local frontend URL.

---

## Environment Configuration

Environment templates are provided in the repository.

```text
.env.example
backend/.env.example
```

Configuration requirements depend on the deployment environment and enabled services.

Typical configuration categories include:

```text
PORT
MONGODB_URI
JWT_SECRET
CORS_ORIGINS
ORIGIN_VERIFY_SECRET
```

Additional credentials may be required for services such as Cloudinary, email/UMS, AWS, and other external integrations.

Production credentials should never be committed to source control.

---

## Health Check

The backend provides a health-check endpoint:

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok"
}
```

---

## Authentication Testing

Authentication test scripts are included in the repository.

For Windows:

```powershell
.\AUTH_TEST.ps1
```

For Linux/macOS:

```bash
./AUTH_TEST.sh
```

---

## AWS Deployment

The repository contains Terraform configuration and deployment scripts for deploying the application to AWS.

The deployment architecture uses:

```text
                    AWS Cloud
                       |
          +------------+------------+
          |                         |
          v                         v
      CloudFront                  EC2
          |                         |
          v                         v
         S3                     Docker
     Frontend                  Express API
                                    |
                                    v
                              MongoDB Atlas
```

Terraform is used to manage infrastructure resources.

Detailed deployment instructions are available in:

```text
docs/AWS_TERRAFORM_DEPLOYMENT.md
```

---

## Development Workflow

```text
Client
  |
  v
Service Assignment
  |
  v
Workflow Template
  |
  v
Task Generation
  |
  +--------------------+
  |                    |
  v                    v
Employee Assignment   Documents
  |                    |
  +---------+----------+
            |
            v
       Task Execution
            |
            v
        Notifications
            |
            v
         Reporting
            |
            v
       Data Export
```

---

## Testing

The repository contains authentication test scripts and backend testing resources.

Testing should be performed against a development or test database rather than a production database.

---

## Deployment Considerations

The AWS deployment configuration is intended to provide a practical deployment architecture for the application.

Before using the system in a production environment containing sensitive client information, the deployment should be reviewed for:

* Network security
* Database access restrictions
* Secret management
* HTTPS configuration
* Backup and disaster recovery
* Logging and monitoring
* File-storage security
* Access-control policies
* Data retention requirements
* Compliance requirements

---

## Future Development

Potential areas for further development include:

* Expanded audit logging
* Enhanced client portal functionality
* Advanced calendar integrations
* Additional CA-specific compliance workflows
* Document versioning
* Advanced financial analytics
* Automated database and document backups
* Expanded automated test coverage
* Enhanced monitoring and observability
* Continuous integration and deployment improvements

---

## Documentation

Additional project documentation is available in the `docs` directory.

AWS deployment documentation:

```text
docs/AWS_TERRAFORM_DEPLOYMENT.md
```

---

## Author

**Shayan Tejavath**

GitHub:
https://github.com/shayan-tejavath/CA-client-tracker-summer-intern

---

## License

No explicit open-source license is currently specified in the repository.

