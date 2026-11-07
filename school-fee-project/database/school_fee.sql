CREATE DATABASE IF NOT EXISTS school_fee;
USE school_fee;

CREATE TABLE IF NOT EXISTS student (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(30),
  roll_no VARCHAR(30) UNIQUE,
  phone VARCHAR(15),
  email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS fee_details (
  fee_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  academic_year VARCHAR(20),
  fee_type VARCHAR(50),
  total_amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  CONSTRAINT fk_fee_student FOREIGN KEY (student_id)
    REFERENCES student(student_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS payment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  fee_id INT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  payment_method VARCHAR(30),
  receipt_no VARCHAR(50) UNIQUE,
  CONSTRAINT fk_payment_fee FOREIGN KEY (fee_id)
    REFERENCES fee_details(fee_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Demo data (run once; remove these INSERT statements if you want an empty database)
INSERT IGNORE INTO student (student_id, name, class, roll_no, phone, email)
VALUES (1, 'Ravi Kumar', '10th', '10A01', '9876543210', 'ravi@gmail.com');

INSERT IGNORE INTO fee_details (fee_id, student_id, academic_year, fee_type, total_amount, due_date)
VALUES (1, 1, '2026-27', 'Tuition Fee', 15000.00, '2026-12-31');

INSERT IGNORE INTO payment (payment_id, fee_id, amount_paid, payment_date, payment_method, receipt_no)
VALUES (1, 1, 10000.00, '2026-11-07', 'UPI', 'RCP001');