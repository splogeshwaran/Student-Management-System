/* ============================================================
   courses.js — course catalog + enrollment logic (ES module)
   ============================================================ */

import { showToast } from './app.js';

export const courses = window.COURSES || [];

/** Wait for the shared remote catalog before rendering courses. */
export async function loadCourses() {
    await window.COURSES_READY;
    return courses;
}

export async function loadMoreCourses() {
    return window.loadMoreCourses();
}

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
