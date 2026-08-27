/* ============================================================
   courses.js — course catalog + enrollment logic (ES module)
   ============================================================ */

import { showToast } from './app.js';

export const courses = [
    {
        code: "CS101",
        name: "Python Programming",
        duration: "12 Weeks",
        faculty: "Mr. Kumar",
        path: [
            "Python Basics & Syntax",
            "Data Structures (Lists, Dicts, Sets)",
            "Functions & OOP",
            "File Handling & Modules",
            "Mini Projects",
            "Capstone Project"
        ]
    },
    {
        code: "CS102",
        name: "Java Programming",
        duration: "14 Weeks",
        faculty: "Mrs. Priya",
        path: [
            "Java Syntax & OOP Basics",
            "Collections Framework",
            "Exception Handling",
            "Multithreading",
            "JDBC & Databases",
            "Capstone Project"
        ]
    },
    {
        code: "CS103",
        name: "Web Development",
        duration: "10 Weeks",
        faculty: "Mr. Arjun",
        path: [
            "HTML & CSS Foundations",
            "JavaScript Essentials",
            "Responsive Design",
            "Git & GitHub",
            "Backend Basics",
            "Capstone Project"
        ]
    },
    {
        code: "CS104",
        name: "Database Management",
        duration: "8 Weeks",
        faculty: "Ms. Nisha",
        path: [
            "ER Modeling",
            "SQL Basics",
            "Joins & Subqueries",
            "Normalization",
            "Transactions & Indexing",
            "Mini Project"
        ]
    },
    {
        code: "CS105",
        name: "Artificial Intelligence",
        duration: "16 Weeks",
        faculty: "Dr. Raj",
        path: [
            "Python for AI",
            "Math Foundations",
            "Machine Learning Basics",
            "Neural Networks",
            "NLP Introduction",
            "Capstone Project"
        ]
    }
];

export function getEnrolledCourses() {
    return JSON.parse(localStorage.getItem("courses")) || [];
}

export function enrollCourse(courseName, btn) {
    const enrolled = getEnrolledCourses();

    if (enrolled.includes(courseName)) {
        showToast(courseName + " is already in your enrolled list.", "info");
        return;
    }

    enrolled.push(courseName);
    localStorage.setItem("courses", JSON.stringify(enrolled));

    if (btn) {
        btn.textContent = "Enrolled";
        btn.classList.add("enrolled");
    }

    showToast(courseName + " enrolled successfully!", "success");
}
