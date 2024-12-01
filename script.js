// Course Class to represent individual courses
class Course {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Student Performance Class to track individual student performance in a course
class StudentPerformance {
    constructor(student, course, midtermScore, finalScore, options = {}) {
        this.student = student;
        this.course = course;
        this.midtermScore = midtermScore;
        this.finalScore = finalScore;
        
        // Default options if not provided
        this.options = {
            midtermWeight: 0.4,  // Default 40% midterm weight
            finalWeight: 0.6,    // Default 60% final weight
            gradeScale: [
                { min: 90, grade: 'AA' },
                { min: 80, grade: 'BA' },
                { min: 70, grade: 'BB' },
                { min: 60, grade: 'CB' },
                { min: 50, grade: 'CC' },
                { min: 40, grade: 'DC' },
                { min: 30, grade: 'DD' },
                { min: 0, grade: 'FF' }
            ],
            ...options
        };

        this.totalScore = this.calculateTotalScore();
        this.letterGrade = this.calculateLetterGrade();
    }

    calculateTotalScore() {
        // Use configurable weights
        return (this.midtermScore * this.options.midtermWeight) + 
               (this.finalScore * this.options.finalWeight);
    }

    calculateLetterGrade() {
        const score = this.totalScore;
        
        // Find the first grade in the scale where the score meets or exceeds the minimum
        const matchedGrade = this.options.gradeScale.find(scale => score >= scale.min);
        
        return matchedGrade ? matchedGrade.grade : 'FF';
    }

    // Method to get grade points based on configurable scale
    getGradePoints() {
        const gradePoints = {
            'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5, 
            'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FF': 0.0
        };

        return gradePoints[this.letterGrade] || 0;
    }
}

// Student Class to represent student information and performance tracking
class Student {
    constructor(id, name, surname) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.performances = [];
    }

    getFullName() {
        return `${this.name} ${this.surname}`;
    }

    calculateGPA() {
        if (this.performances.length === 0) return 0;

        // Convert letter grades to grade points
        const gradePoints = {
            'AA': 4.0, 'BA': 3.5, 'BB': 3.0, 'CB': 2.5, 
            'CC': 2.0, 'DC': 1.5, 'DD': 1.0, 'FF': 0.0
        };

        const totalPoints = this.performances.reduce((sum, perf) => 
            sum + (gradePoints[perf.letterGrade] || 0), 0);
        
        return (totalPoints / this.performances.length).toFixed(2);
    }
}

// Main Student Management System Class
class StudentManagementSystem {
    constructor() {
        this.courses = new Map();
        this.students = new Map();
        this.performances = new Map();
        this.currentEditingPerformance = null;
        this.initializeEventListeners();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Course Management
        const addCourseBtn = document.getElementById('add-course-btn');
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', () => this.addCourse());
        }

        // Student Performance Form
        const studentForm = document.getElementById('student-form');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Check if in edit mode
                const submitBtn = e.submitter;
                if (submitBtn.classList.contains('edit-mode')) {
                    this.updateStudentPerformance();
                } else {
                    this.addStudentPerformance();
                }
            });
        }

        // Filter Buttons
        const allStudentsBtn = document.getElementById('all-students-btn');
        const passedStudentsBtn = document.getElementById('passed-students-btn');
        const failedStudentsBtn = document.getElementById('failed-students-btn');

        if (allStudentsBtn) allStudentsBtn.addEventListener('click', () => this.displayStudents());
        if (passedStudentsBtn) passedStudentsBtn.addEventListener('click', () => this.displayStudents('passed'));
        if (failedStudentsBtn) failedStudentsBtn.addEventListener('click', () => this.displayStudents('failed'));

        // Search Input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchStudents());
        }
    }

    // Add a new course
    addCourse() {
        const courseNameInput = document.getElementById('course-name');
        const courseName = courseNameInput.value.trim();
        
        if (!courseName) {
            alert('Please enter a course name');
            return;
        }

        const courseId = `course-${this.courses.size + 1}`;
        const newCourse = new Course(courseId, courseName);
        this.courses.set(courseId, newCourse);

        // Update course selector
        const courseSelector = document.getElementById('course-selector');
        const option = document.createElement('option');
        option.value = courseId;
        option.textContent = courseName;
        courseSelector.appendChild(option);

        courseNameInput.value = '';
    }

    // Add student performance
    addStudentPerformance() {
        const studentId = document.getElementById('student-id').value.trim();
        const name = document.getElementById('student-name').value.trim();
        const surname = document.getElementById('student-surname').value.trim();
        const midtermScore = Number(document.getElementById('midterm-score').value);
        const finalScore = Number(document.getElementById('final-score').value);
        const selectedCourseId = document.getElementById('course-selector').value;

        if (!selectedCourseId) {
            alert('Please select a course first');
            return;
        }

        // Validate input
        if (!studentId || !name || !surname) {
            alert('Please fill in all student details');
            return;
        }

        // Get or create student
        let student = this.students.get(studentId);
        if (!student) {
            student = new Student(studentId, name, surname);
            this.students.set(studentId, student);
        }

        const course = this.courses.get(selectedCourseId);
        const performance = new StudentPerformance(student, course, midtermScore, finalScore);
        
        // Create a unique key for the performance
        const performanceKey = `${studentId}-${selectedCourseId}`;
        this.performances.set(performanceKey, performance);

        // Add performance to student's performances
        student.performances.push(performance);

        this.displayStudents();
        this.updateCourseStatistics(selectedCourseId);
        document.getElementById('student-form').reset();
    }

    // Edit existing student performance
    editStudent(studentId, performanceKey) {
        const performance = this.performances.get(performanceKey);
        if (!performance) {
            alert('Performance not found');
            return;
        }

        // Populate form with existing data
        document.getElementById('student-id').value = performance.student.id;
        document.getElementById('student-name').value = performance.student.name;
        document.getElementById('student-surname').value = performance.student.surname;
        document.getElementById('midterm-score').value = performance.midtermScore;
        document.getElementById('final-score').value = performance.finalScore;
        document.getElementById('course-selector').value = performance.course.id;

        // Store the current editing performance
        this.currentEditingPerformance = performance;

        // Change form submission to update mode
        const submitBtn = document.querySelector('#student-form button[type="submit"]');
        submitBtn.textContent = 'Update Performance';
        submitBtn.classList.add('edit-mode');
    }

    // Update existing student performance
    updateStudentPerformance() {
        if (!this.currentEditingPerformance) {
            alert('No performance selected for editing');
            return;
        }

        const studentId = document.getElementById('student-id').value.trim();
        const name = document.getElementById('student-name').value.trim();
        const surname = document.getElementById('student-surname').value.trim();
        const midtermScore = Number(document.getElementById('midterm-score').value);
        const finalScore = Number(document.getElementById('final-score').value);
        const selectedCourseId = document.getElementById('course-selector').value;

        // Update student details
        const student = this.currentEditingPerformance.student;
        student.name = name;
        student.surname = surname;

        // Update performance details
        const course = this.courses.get(selectedCourseId);
        this.currentEditingPerformance.midtermScore = midtermScore;
        this.currentEditingPerformance.finalScore = finalScore;
        this.currentEditingPerformance.totalScore = 
            (midtermScore * 0.4) + (finalScore * 0.6);
        this.currentEditingPerformance.letterGrade = 
            this.calculateLetterGrade(this.currentEditingPerformance.totalScore);
        this.currentEditingPerformance.course = course;

        // Reset form and UI
        this.displayStudents();
        this.updateCourseStatistics(selectedCourseId);
        document.getElementById('student-form').reset();

        // Reset edit mode
        const submitBtn = document.querySelector('#student-form button[type="submit"]');
        submitBtn.textContent = 'Add Performance';
        submitBtn.classList.remove('edit-mode');
        this.currentEditingPerformance = null;
    }

    // Calculate letter grade (helper method)
    calculateLetterGrade(score) {
        if (score >= 90) return 'AA';
        if (score >= 80) return 'BA';
        if (score >= 70) return 'BB';
        if (score >= 60) return 'CB';
        if (score >= 50) return 'CC';
        if (score >= 40) return 'DC';
        if (score >= 30) return 'DD';
        return 'FF';
    }

    // Display students in the table
    // Enhanced displayStudents method for responsive design
// Display students in the table
displayStudents(filter = 'all') {
    const tableBody = document.querySelector('.table-responsive');
    tableBody.innerHTML = `
        <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Midterm</th>
            <th>Final</th>
            <th>Total Score</th>
            <th>Letter Grade</th>
            <th>Actions</th>
        </tr>
    `;

    const performances = Array.from(this.performances.values());
    const filteredPerformances = performances.filter(performance => {
        if (filter === 'passed') return performance.letterGrade !== 'FF';
        if (filter === 'failed') return performance.letterGrade === 'FF';
        return true;
    });

    filteredPerformances.forEach(performance => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${performance.student.id}</td>
            <td>${performance.student.getFullName()}</td>
            <td>${performance.midtermScore.toFixed(2)}</td>
            <td>${performance.finalScore.toFixed(2)}</td>
            <td>${performance.totalScore.toFixed(2)}</td>
            <td>${performance.letterGrade}</td>
            <td>
                <button onclick="studentManagementSystem.editStudent('${performance.student.id}', '${performance.student.id}-${performance.course.id}')">Edit</button>
                <button onclick="studentManagementSystem.deletePerformance('${performance.student.id}-${performance.course.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

    // Update course statistics
    updateCourseStatistics(courseId) {
        const coursePerformances = Array.from(this.performances.values())
            .filter(perf => perf.course.id === courseId);

        const passedStudents = coursePerformances.filter(perf => perf.letterGrade !== 'FF').length;
        const failedStudents = coursePerformances.filter(perf => perf.letterGrade === 'FF').length;
        const classMean = coursePerformances.length > 0 
            ? coursePerformances.reduce((sum, perf) => sum + perf.totalScore, 0) / coursePerformances.length 
            : 0;

        document.getElementById('passed-count').textContent = passedStudents;
        document.getElementById('failed-count').textContent = failedStudents;
        document.getElementById('class-mean').textContent = classMean.toFixed(2);
    }

    // Search students
    searchStudents() {
        const searchInput = document.getElementById('search-input').value.toLowerCase();
        const searchResults = document.getElementById('search-results');

        if (!searchInput) {
            searchResults.innerHTML = '';
            return;
        }

        const matchingStudents = Array.from(this.students.values())
            .filter(student => 
                student.name.toLowerCase().includes(searchInput) || 
                student.surname.toLowerCase().includes(searchInput) ||
                student.id.toLowerCase().includes(searchInput)
            );

        searchResults.innerHTML = '';
        matchingStudents.forEach(student => {
            const performanceDetails = student.performances
                .map(performance => `
                    <p>Course: ${performance.course.name}</p>
                    <p>Total Score: ${performance.totalScore.toFixed(2)}</p>
                    <p>Letter Grade: ${performance.letterGrade}</p>
                `)
                .join('<br>');

            const studentResult = document.createElement('div');
            studentResult.innerHTML = `
                <p>Name: ${student.getFullName()} (ID: ${student.id})</p>
                <p>GPA: ${student.calculateGPA()}</p>
                ${performanceDetails}
                <hr>
            `;
            searchResults.appendChild(studentResult);
        });
    }

    // Delete a specific performance
    deletePerformance(performanceKey) {
        const performance = this.performances.get(performanceKey);
        if (!performance) {
            alert('Performance not found');
            return;
        }

        // Remove performance from student's performances
        const student = performance.student;
        student.performances = student.performances.filter(p => 
            p !== performance
        );

        // Remove performance from performances map
        this.performances.delete(performanceKey);

        // If student has no performances, remove from students map
        if (student.performances.length === 0) {
            this.students.delete(student.id);
        }

        // Refresh display and statistics
        this.displayStudents();
        this.updateCourseStatistics(performance.course.id);
    }
}

// Initialize the system when the page loads
const studentManagementSystem = new StudentManagementSystem();