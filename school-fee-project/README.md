# School Fee Payment Management System

A beginner-friendly mini project using HTML, CSS, JavaScript, Node.js, Express and MySQL.

## Requirements
- Node.js and npm
- MySQL Server / MySQL Workbench

## 1. Create the database
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database/school_fee.sql`.
3. Execute the complete SQL script. It creates the `school_fee` database, three tables and demo records.
4. The demo record is Ravi Kumar with a fee of ₹15,000 and a payment of ₹10,000 (pending ₹5,000).

## 2. Configure the database password
Open `app.js`. In `dbConfig`, set `password` to your own MySQL root password. The default in this project is `root`.

## 3. Install packages and run
Open a terminal in the `school-fee-project` folder and run:

```bash
npm install
npm start
```

When the terminal says `Server running: http://localhost:3000`, open that address in Chrome.

## Demo login
- Email: `admin@school.com`
- Password: `admin123`

This is a classroom demo login only. It is not production-grade authentication.

## Features
- Admin demo login and dashboard summary
- Add, edit, search and delete students
- Assign tuition, exam, transport, hostel or other fees
- Record partial payments with generated receipt numbers
- Calculate paid and pending amounts
- Student-wise fee report and print option

## Database relationships
`student (1) -> fee_details (many) -> payment (many)`

## Important notes
- Keep MySQL Server running while using the application.
- Do not delete a student if fee records are linked to that student.
- The project is intended for local academic demonstration, not real school financial use.
