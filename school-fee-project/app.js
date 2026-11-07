
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL Workbench database connection
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "school_fee"
};

let pool;

// Connect to MySQL
async function connectDB() {
    pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10
    });

    await pool.query("SELECT 1");
    console.log("Connected to MySQL database: school_fee");
}

// Dashboard
app.get("/api/dashboard", async (req, res) => {
    try {
        const [[students]] = await pool.query(
            "SELECT COUNT(*) AS total FROM student"
        );

        const [[collected]] = await pool.query(
            "SELECT COALESCE(SUM(amount_paid),0) AS total FROM payment"
        );

        const [[fees]] = await pool.query(
            `SELECT COALESCE(SUM(total_amount),0) AS total
             FROM fee_details`
        );

        const [recent] = await pool.query(
            `SELECT p.payment_id, p.amount_paid,
             p.payment_date, p.receipt_no,
             s.name AS student_name, fd.fee_type
             FROM payment p
             JOIN fee_details fd ON p.fee_id = fd.fee_id
             JOIN student s ON fd.student_id = s.student_id
             ORDER BY p.payment_id DESC LIMIT 6`
        );

        res.json({
            students: students.total,
            collected: Number(collected.total),
            pending: Math.max(
                0,
                Number(fees.total) - Number(collected.total)
            ),
            recent
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all students
app.get("/api/students", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM student ORDER BY student_id DESC"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add student
app.post("/api/students", async (req, res) => {
    try {
        const {
            name,
            class: studentClass,
            roll_no,
            phone,
            email
        } = req.body;

        if (!name || !roll_no) {
            return res.status(400).json({
                error: "Name and roll number are required."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO student
            (name, class, roll_no, phone, email)
            VALUES (?, ?, ?, ?, ?)`,
            [
                name,
                studentClass || null,
                roll_no,
                phone || null,
                email || null
            ]
        );

        res.status(201).json({
            student_id: result.insertId,
            message: "Student added successfully."
        });

    } catch (err) {
        res.status(500).json({
            error: err.code === "ER_DUP_ENTRY"
                ? "Roll number already exists."
                : err.message
        });
    }
});

// Update student
app.put("/api/students/:id", async (req, res) => {
    try {
        const {
            name,
            class: studentClass,
            roll_no,
            phone,
            email
        } = req.body;

        await pool.query(
            `UPDATE student
             SET name=?, class=?, roll_no=?, phone=?, email=?
             WHERE student_id=?`,
            [
                name,
                studentClass || null,
                roll_no,
                phone || null,
                email || null,
                req.params.id
            ]
        );

        res.json({ message: "Student updated successfully." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete student
app.delete("/api/students/:id", async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM student WHERE student_id=?",
            [req.params.id]
        );

        res.json({ message: "Student deleted successfully." });

    } catch (err) {
        res.status(500).json({
            error: "Cannot delete student while fee or payment records are linked."
        });
    }
});

// Get fee details
app.get("/api/fees", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT fd.*, s.name AS student_name,
             s.roll_no,
             COALESCE(SUM(p.amount_paid),0) AS paid
             FROM fee_details fd
             JOIN student s ON fd.student_id = s.student_id
             LEFT JOIN payment p ON p.fee_id = fd.fee_id
             GROUP BY fd.fee_id
             ORDER BY fd.fee_id DESC`
        );

        res.json(rows.map(row => ({
            ...row,
            pending: Math.max(
                0,
                Number(row.total_amount) - Number(row.paid)
            )
        })));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add fee
app.post("/api/fees", async (req, res) => {
    try {
        const {
            student_id,
            academic_year,
            fee_type,
            total_amount,
            due_date
        } = req.body;

        if (!student_id || !fee_type || !(Number(total_amount) > 0)) {
            return res.status(400).json({
                error: "Please enter valid fee details."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO fee_details
            (student_id, academic_year, fee_type,
             total_amount, due_date)
             VALUES (?, ?, ?, ?, ?)`,
            [
                student_id,
                academic_year,
                fee_type,
                total_amount,
                due_date || null
            ]
        );

        res.status(201).json({
            fee_id: result.insertId,
            message: "Fee assigned successfully."
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get payments
app.get("/api/payments", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, fd.fee_type,
             s.name AS student_name, s.roll_no
             FROM payment p
             JOIN fee_details fd ON p.fee_id = fd.fee_id
             JOIN student s ON fd.student_id = s.student_id
             ORDER BY p.payment_id DESC`
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Record payment
app.post("/api/payments", async (req, res) => {
    let conn;

    try {
        const {
            fee_id,
            amount_paid,
            payment_date,
            payment_method
        } = req.body;

        if (
            !fee_id ||
            !(Number(amount_paid) > 0) ||
            !payment_date ||
            !payment_method
        ) {
            return res.status(400).json({
                error: "Please complete all payment fields."
            });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [[fee]] = await conn.query(
            "SELECT total_amount FROM fee_details WHERE fee_id=? FOR UPDATE",
            [fee_id]
        );

        if (!fee) {
            throw new Error("Selected fee was not found.");
        }

        const [[paid]] = await conn.query(
            `SELECT COALESCE(SUM(amount_paid),0) AS total
             FROM payment WHERE fee_id=?`,
            [fee_id]
        );

        const pending =
            Number(fee.total_amount) - Number(paid.total);

        if (Number(amount_paid) > pending) {
            throw new Error("Payment is greater than pending amount.");
        }

        const receipt =
            "RCP" + Date.now().toString().slice(-9);

        const [result] = await conn.query(
            `INSERT INTO payment
            (fee_id, amount_paid, payment_date,
             payment_method, receipt_no)
             VALUES (?, ?, ?, ?, ?)`,
            [
                fee_id,
                amount_paid,
                payment_date,
                payment_method,
                receipt
            ]
        );

        await conn.commit();

        res.status(201).json({
            payment_id: result.insertId,
            receipt_no: receipt,
            message: "Payment recorded successfully."
        });

    } catch (err) {
        if (conn) await conn.rollback();

        res.status(400).json({ error: err.message });

    } finally {
        if (conn) conn.release();
    }
});

// Student report
app.get("/api/reports/:studentId", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.student_id, s.name, s.class,
             s.roll_no, s.phone, s.email,
             fd.fee_id, fd.academic_year,
             fd.fee_type, fd.total_amount, fd.due_date,
             COALESCE(SUM(p.amount_paid),0) AS paid
             FROM student s
             LEFT JOIN fee_details fd
             ON fd.student_id = s.student_id
             LEFT JOIN payment p
             ON p.fee_id = fd.fee_id
             WHERE s.student_id=?
             GROUP BY fd.fee_id, s.student_id
             ORDER BY fd.fee_id`,
            [req.params.studentId]
        );

        if (!rows.length) {
            return res.status(404).json({
                error: "Student not found."
            });
        }

        res.json(rows.map(row => ({
            ...row,
            pending: row.fee_id
                ? Math.max(
                    0,
                    Number(row.total_amount) - Number(row.paid)
                )
                : 0
        })));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Home page
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// Start server after database connection
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    })
    .catch(err => {
        console.error("MySQL connection failed:", err.message);
        console.error(
            "Check MySQL Server, password and school_fee database."
        );
        process.exit(1);
    });
