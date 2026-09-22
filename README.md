# codeWithFarhan

A full-stack Python learning platform for structured lessons, coding homework, online Python practice, automated grading, progress tracking, and role-based management.

## Purpose

This platform brings Python teaching and practice into one system instead of using separate tools for lessons, homework, code execution, grading, and progress tracking.

### Learning Flow

```text
Course
   ↓
Week / Lesson
   ↓
Homework / Problem
   ↓
Write Python Code
   ↓
Run Code
   ↓
Submit
   ↓
Visible + Hidden Tests
   ↓
Automatic Grading
   ↓
Problem Solved
   ↓
Progress Updated
```

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Inter
- Monaco Editor
- Tiptap (Rich Text Editor)

### Backend
- Next.js App Router
- Server Actions
- Route Handlers
- Prisma ORM
- PostgreSQL

### Database & Authentication
- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage

### Code Execution
- Python
- Node.js `child_process.spawn`
- Temporary isolated execution directories
- Execution timeout
- Output limits
- Rate limiting

> The current development runner executes Python locally. Production execution should use a dedicated sandboxed environment.

### Deployment
- Vercel
- Supabase
- Dedicated Python execution environment

## Core Features

### Authentication
- Email/password signup and login
- Logout
- Session management
- Protected routes
- Server-side authorization
- User Profile (Update Name, Change Password)

### Multi-Role Authentication

Supported roles:

```text
ADMIN
TEACHER
STUDENT
```

A single account can have multiple roles. Users with multiple roles select an active role after login.

### Role-Based Access

```text
Admin
├── Home
├── Courses
├── Problems
├── Submissions
└── Users

Teacher
├── Home
├── My Courses
├── My Problems
└── My Submissions

Student
├── Home
├── Courses
├── Homeworks
└── My Submissions
```

### Course Management
- Create, edit, and delete courses
- Teacher ownership
- Lesson management
- Lesson ordering
- Admin course management

### Lesson Management
- Create, edit, delete, and reorder lessons
- Lesson content
- Attach coding problems to lessons
- Student lesson completion tracking

### Coding Homework / Problems

Problems are the platform's coding homework system. There is no separate Assignment/Homework model.

```text
Course
└── Week / Lesson
    ├── Problem 1
    ├── Problem 2
    └── Problem 3
```

Each problem supports:
- Title
- Description
- Difficulty
- Starter code
- Hints
- Visible test cases
- Hidden test cases
- Publishing status
- Course and lesson association
- Ordering

Difficulty levels:

```text
EASY
MEDIUM
HARD
```

### Teacher Problem Management
- Create/edit/delete problems
- Publish/unpublish
- Manage visible and hidden test cases
- Reorder test cases
- View test-case counts
- Week-wise organization
- Ownership-based authorization

### Admin Problem Management
Administrators can manage all problems using a week-wise structure:

```text
Course A
├── Week 1
│   ├── Problem 1
│   └── Problem 2
├── Week 2
│   └── Problem 3
└── Week 3
    └── Problem 4
```

### Student Homeworks
Students access:

```text
Student → Homeworks
```

Homework is organized by course and week/lesson.

A problem is considered solved when the student has an accepted submission.

### Monaco Code Editor
- Python syntax highlighting
- Dark editor theme
- Starter code
- Local code persistence
- Automatic code saving
- Responsive editor layout
- Problem/editor split view

### Run Code

```text
Student Code
     ↓
Execution API
     ↓
Python Runner
     ↓
Visible Test Cases
     ↓
Execution Result
```

Only visible tests are used for Run. Hidden tests are never returned to students.

Execution states include:

```text
PASSED
FAILED
TIMEOUT
OUTPUT_LIMIT_EXCEEDED
RUNTIME_ERROR
NO_TEST_CASES
```

### Submit Code

```text
Student Code
     ↓
Submit
     ↓
All Test Cases
     ├── Visible
     └── Hidden
     ↓
Grading
     ↓
Score
     ↓
Submission Record
```

### Automatic Grading

Score:

```text
floor(passedTests / totalTests * 100)
```

Submission statuses:

```text
ACCEPTED
WRONG_ANSWER
RUNTIME_ERROR
TIMEOUT
OUTPUT_LIMIT_EXCEEDED
INTERNAL_ERROR
```

Submissions store the student, problem, code, status, score, test counts, execution time, and timestamps.

### Test Cases

Two types are supported:

**Visible Test Cases**
- Students can see these.
- Used by Run.

**Hidden Test Cases**
- Students cannot see input or expected output.
- Used during Submit/grading.

### Submission History

Student submissions are organized by:

```text
Course
└── Week / Lesson
    └── Problem
        ├── Attempt 1
        ├── Attempt 2
        └── Attempt 3
```

Students can only access their own submissions.

### Teacher Submissions

Teachers can view submissions related to their authorized problems/courses:

```text
My Submissions
├── Course
│   ├── Week
│   │   ├── Problem
│   │   │   ├── Student submission
│   │   │   └── Student submission
│   │   └── Problem
│   └── ...
└── ...
```

### Progress Tracking

Lesson progress tracks:

```text
Completed
Not Completed
```

Problem progress is derived from submissions:

```text
Submission.status === ACCEPTED
```

There is no separate `ProblemProgress` model.

### Dashboards

**Student**
- User Profile & Security
- Available courses
- Course progress
- Completed lessons
- Solved problems
- Recent submissions

**Teacher**
- User Profile & Security
- Courses
- Problems
- Submissions
- Student progress
- Course analytics

**Admin**
- User Profile & Security
- Platform statistics
- Courses
- Problems
- Submissions
- Users
- Role management

### User Management

Administrators can manage users through:

```text
Admin → Users
```

Features:
- View all users
- Search by name/email
- Filter by role
- Pagination
- User details
- Role assignment/removal
- User statistics
- Recent student submissions

The system protects the last administrator from accidental removal.

Changing roles does not automatically delete or transfer courses, problems, submissions, or progress.

## Security

Security is enforced server-side.

- Protected routes use authentication/role helpers
- Active roles are validated against role assignments
- Hidden tests are never returned to students
- Students can only access their own submissions
- Teachers can only manage authorized problems
- Code execution has timeout and output limits
- Temporary execution directories are cleaned up
- Rate limiting is applied
- Secrets are not exposed to client code

## Database Architecture

Core entities:

```text
User
UserRoleAssignment

Course
Lesson
Progress

Problem
ProblemTestCase
Submission
```

High-level relationships:

```text
User
 ├── UserRoleAssignment
 ├── Courses
 ├── Problems
 ├── Submissions
 └── Progress

Course
 ├── Lessons
 └── Problems

Lesson
 ├── Problems
 └── Progress

Problem
 ├── Test Cases
 └── Submissions
```

## Project Structure

```text
python-learning-platform/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   └── assets/
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   └── student/
│   │   ├── actions/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── problem/
│   │   ├── users/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── code-runner/
│   │   ├── prisma.ts
│   │   └── progress.ts
│   │
│   └── generated/
│       └── prisma/
│
├── .env
├── prisma7.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Development

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Validate the Prisma schema:

```bash
npx prisma validate
```

Run the development server:

```bash
npm run dev
```

The application is normally available at:

```text
http://localhost:3000
```

## Environment Variables

Example categories:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```



Never commit real credentials or secrets.

## Development Validation

Before considering a feature complete:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

## Current Architecture

```text
                    ┌───────────────┐
                    │  Supabase     │
                    │ Auth + DB     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Next.js    │
                    │  Application  │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      Admin             Teacher            Student
          │                 │                 │
          ▼                 ▼                 ▼
       Users             Courses          Homeworks
       Courses           Problems         Problems
       Problems          Submissions      Submissions
       Submissions       Progress         Progress
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                    Python Code Runner
                            │
                            ▼
                    Automated Grading
```

## Production Considerations

The application uses the **Wandbox API** (`https://wandbox.org`) for completely isolated, sandboxed Python code execution. 

Wandbox provides:
- Container/process isolation
- Execution timeout and limits
- Memory and network restrictions
- Security against arbitrary command execution (RCE) on your deployment host

Because of this, you do not need to install Python locally or bundle it in your Vercel deployment. Code execution works safely out-of-the-box in both development and production.

## Project Status

Implemented:

- Authentication
- Multi-role authentication
- Course management
- Lesson management
- Problem management
- Test-case management
- Monaco Python editor
- Code execution
- Automated grading
- Submission history
- Student progress
- Teacher monitoring
- Admin management
- User management
- User Profile Management
- Week-wise homework organization

Remaining work is primarily focused on:

- Final UI/UX polish
- Production-safe Python execution
- Course content population
- Additional analytics
- Production deployment
- QA and production readiness

## License

This project is currently a private learning platform project.
