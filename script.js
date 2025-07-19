// Habit Tracker Application
class HabitTracker {
    constructor() {
        this.user = null;
        this.habits = [];
        this.currentView = 'today';
        this.currentWeek = new Date();
        this.ratingHabit = null;
        this.notificationCheckInterval = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkUserOnboarding();
        this.startNotificationChecks();
        this.updateDisplay();
    }

    // Data Management
    loadData() {
        const savedUser = localStorage.getItem('habitTrackerUser');
        const savedHabits = localStorage.getItem('habitTrackerHabits');
        
        if (savedUser) {
            this.user = JSON.parse(savedUser);
        }
        
        if (savedHabits) {
            this.habits = JSON.parse(savedHabits);
        }
    }

    saveData() {
        localStorage.setItem('habitTrackerUser', JSON.stringify(this.user));
        localStorage.setItem('habitTrackerHabits', JSON.stringify(this.habits));
    }

    // User Management
    checkUserOnboarding() {
        if (!this.user) {
            document.getElementById('onboarding').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        } else {
            document.getElementById('onboarding').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            this.updateUserGreeting();
        }
    }

    updateUserGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) {
            greeting = `Good morning, ${this.user.name}!`;
        } else if (hour < 18) {
            greeting = `Good afternoon, ${this.user.name}!`;
        } else {
            greeting = `Good evening, ${this.user.name}!`;
        }
        
        document.getElementById('userGreeting').textContent = greeting;
    }

    // Event Listeners
    setupEventListeners() {
        // User onboarding
        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserSubmit();
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Add habit
        document.getElementById('addHabitBtn').addEventListener('click', () => {
            this.openHabitModal();
        });

        // Habit modal
        document.getElementById('habitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleHabitSubmit();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeHabitModal();
        });

        document.getElementById('cancelHabit').addEventListener('click', () => {
            this.closeHabitModal();
        });

        // Frequency change
        document.getElementById('habitFrequency').addEventListener('change', (e) => {
            this.toggleCustomDays(e.target.value);
        });

        // Week navigation
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.navigateWeek(-1);
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.navigateWeek(1);
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterHabits(e.target.value);
        });

        // Rating modal
        document.getElementById('closeRatingModal').addEventListener('click', () => {
            this.closeRatingModal();
        });

        document.getElementById('submitRating').addEventListener('click', () => {
            this.submitRating();
        });

        // Rating stars
        document.querySelectorAll('.rating-stars i').forEach(star => {
            star.addEventListener('click', (e) => {
                this.selectRating(parseInt(e.target.dataset.rating));
            });
        });

        // Modal backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    // User Onboarding
    handleUserSubmit() {
        const name = document.getElementById('userName').value.trim();
        const age = parseInt(document.getElementById('userAge').value);

        if (!name || !age || age < 1 || age > 120) {
            this.showNotification('Please enter valid name and age', 'error');
            return;
        }

        this.user = { name, age };
        this.saveData();
        this.checkUserOnboarding();
        this.showNotification(`Welcome, ${name}! Let's start building better habits.`, 'success');
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');
        
        this.updateDisplay();
    }

    // Habit Management
    openHabitModal() {
        document.getElementById('habitModal').classList.remove('hidden');
        document.getElementById('habitForm').reset();
        document.getElementById('customDaysContainer').classList.add('hidden');
    }

    closeHabitModal() {
        document.getElementById('habitModal').classList.add('hidden');
    }

    toggleCustomDays(frequency) {
        const container = document.getElementById('customDaysContainer');
        if (frequency === 'custom') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    handleHabitSubmit() {
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDescription').value.trim();
        const category = document.getElementById('habitCategory').value;
        const frequency = document.getElementById('habitFrequency').value;
        const time = document.getElementById('habitTime').value;
        const color = document.getElementById('habitColor').value;

        if (!name) {
            this.showNotification('Please enter a habit name', 'error');
            return;
        }

        let customDays = [];
        if (frequency === 'custom') {
            customDays = Array.from(document.querySelectorAll('.day-checkbox input:checked'))
                .map(input => input.value);
            
            if (customDays.length === 0) {
                this.showNotification('Please select at least one day', 'error');
                return;
            }
        }

        const habit = {
            id: Date.now().toString(),
            name,
            description,
            category,
            frequency,
            customDays,
            time,
            color,
            createdAt: new Date().toISOString(),
            completedDates: [],
            ratings: [],
            streak: 0,
            totalCompletions: 0
        };

        this.habits.push(habit);
        this.saveData();
        this.closeHabitModal();
        this.updateDisplay();
        this.showNotification(`Habit "${name}" added successfully!`, 'success');
    }

    // Habit Actions
    completeHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = new Date().toDateString();
        const isCompleted = habit.completedDates.includes(today);

        if (isCompleted) {
            // Remove completion
            habit.completedDates = habit.completedDates.filter(date => date !== today);
            habit.totalCompletions--;
        } else {
            // Add completion
            habit.completedDates.push(today);
            habit.totalCompletions++;
        }

        this.updateHabitStreak(habit);
        this.saveData();
        this.updateDisplay();
        
        const action = isCompleted ? 'unmarked' : 'completed';
        this.showNotification(`Habit "${habit.name}" ${action}!`, 'success');
    }

    rateHabit(habitId) {
        this.ratingHabit = this.habits.find(h => h.id === habitId);
        if (!this.ratingHabit) return;

        document.getElementById('ratingModal').classList.remove('hidden');
        document.querySelectorAll('.rating-stars i').forEach(star => {
            star.classList.remove('active');
        });
        document.getElementById('submitRating').disabled = true;
    }

    selectRating(rating) {
        document.querySelectorAll('.rating-stars i').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        document.getElementById('submitRating').disabled = false;
    }

    submitRating() {
        if (!this.ratingHabit) return;

        const activeStars = document.querySelectorAll('.rating-stars i.active').length;
        if (activeStars === 0) return;

        const today = new Date().toDateString();
        const existingRatingIndex = this.ratingHabit.ratings.findIndex(r => r.date === today);

        if (existingRatingIndex >= 0) {
            this.ratingHabit.ratings[existingRatingIndex].rating = activeStars;
        } else {
            this.ratingHabit.ratings.push({
                date: today,
                rating: activeStars
            });
        }

        this.saveData();
        this.closeRatingModal();
        this.updateDisplay();
        this.showNotification(`Rating submitted for "${this.ratingHabit.name}"!`, 'success');
    }

    closeRatingModal() {
        document.getElementById('ratingModal').classList.add('hidden');
        this.ratingHabit = null;
    }

    deleteHabit(habitId) {
        if (!confirm('Are you sure you want to delete this habit?')) return;

        const habitIndex = this.habits.findIndex(h => h.id === habitId);
        if (habitIndex >= 0) {
            const habitName = this.habits[habitIndex].name;
            this.habits.splice(habitIndex, 1);
            this.saveData();
            this.updateDisplay();
            this.showNotification(`Habit "${habitName}" deleted!`, 'success');
        }
    }

    // Streak Management
    updateHabitStreak(habit) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();

        const isCompletedToday = habit.completedDates.includes(todayStr);
        const wasCompletedYesterday = habit.completedDates.includes(yesterdayStr);

        if (isCompletedToday && wasCompletedYesterday) {
            habit.streak++;
        } else if (isCompletedToday && !wasCompletedYesterday) {
            habit.streak = 1;
        } else if (!isCompletedToday) {
            habit.streak = 0;
        }
    }

    // Display Updates
    updateDisplay() {
        this.updateTodayView();
        this.updateWeekView();
        this.updateAllHabitsView();
        this.updateStatsView();
        this.updateDateDisplay();
    }

    updateTodayView() {
        const container = document.getElementById('todayHabits');
        const todayHabits = this.getHabitsForDate(new Date());

        if (todayHabits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                    <h3>No habits for today</h3>
                    <p>Add some habits to get started!</p>
                    <button class="btn-primary" onclick="habitTracker.openHabitModal()">
                        <i class="fas fa-plus"></i> Add Habit
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = todayHabits.map(habit => this.createHabitCard(habit)).join('');
    }

    updateWeekView() {
        const container = document.getElementById('weekHabits');
        const weekStart = this.getWeekStart(this.currentWeek);
        
        let weekHTML = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dayHabits = this.getHabitsForDate(date);
            
            weekHTML += `
                <div class="week-day">
                    <div class="week-day-header">
                        <div class="week-day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div class="week-day-date">${date.getDate()}</div>
                    </div>
                    <div class="week-day-habits">
                        ${dayHabits.map(habit => this.createWeekHabitItem(habit, date)).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = weekHTML;
        this.updateWeekDisplay();
    }

    updateAllHabitsView() {
        const container = document.getElementById('allHabits');
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filteredHabits = [...this.habits];
        if (statusFilter !== 'all') {
            filteredHabits = filteredHabits.filter(habit => {
                const status = this.getHabitStatus(habit);
                return status === statusFilter;
            });
        }

        if (filteredHabits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-list" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                    <h3>No habits found</h3>
                    <p>${statusFilter === 'all' ? 'Add some habits to get started!' : 'No habits match the selected filter.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredHabits.map(habit => this.createHabitListItem(habit)).join('');
    }

    updateStatsView() {
        const stats = this.calculateStats();
        
        document.getElementById('currentStreak').textContent = stats.currentStreak;
        document.getElementById('completionRate').textContent = `${stats.completionRate}%`;
        document.getElementById('totalHabits').textContent = stats.totalHabits;
        document.getElementById('averageRating').textContent = stats.averageRating.toFixed(1);
    }

    updateDateDisplay() {
        const today = new Date();
        document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateWeekDisplay() {
        const weekStart = this.getWeekStart(this.currentWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        document.getElementById('weekDisplay').textContent = 
            `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
             ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    // Helper Methods
    getHabitsForDate(date) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const dateStr = date.toDateString();
        
        return this.habits.filter(habit => {
            if (habit.frequency === 'daily') {
                return true;
            } else if (habit.frequency === 'weekly') {
                return date.getDay() === 0; // Sunday
            } else if (habit.frequency === 'custom') {
                return habit.customDays.includes(dayOfWeek);
            }
            return false;
        });
    }

    getHabitStatus(habit) {
        const today = new Date().toDateString();
        const isCompleted = habit.completedDates.includes(today);
        
        if (isCompleted) return 'completed';
        
        const todayHabits = this.getHabitsForDate(new Date());
        const isTodayHabit = todayHabits.some(h => h.id === habit.id);
        
        if (isTodayHabit) {
            const now = new Date();
            if (habit.time) {
                const [hours, minutes] = habit.time.split(':');
                const habitTime = new Date();
                habitTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                if (now > habitTime) return 'missed';
            }
            return 'active';
        }
        
        return 'pending';
    }

    createHabitCard(habit) {
        const status = this.getHabitStatus(habit);
        const isCompleted = status === 'completed';
        const isMissed = status === 'missed';
        
        return `
            <div class="habit-card ${status}" style="--habit-color: ${habit.color}">
                <div class="habit-header">
                    <div>
                        <div class="habit-title">${habit.name}</div>
                        <div class="habit-category">${habit.category}</div>
                    </div>
                    <div class="habit-streak">
                        <i class="fas fa-fire"></i> ${habit.streak}
                    </div>
                </div>
                
                ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                
                ${habit.time ? `<div class="habit-time"><i class="fas fa-clock"></i> ${habit.time}</div>` : ''}
                
                <div class="habit-actions">
                    <button class="habit-btn complete-btn" onclick="habitTracker.completeHabit('${habit.id}')">
                        <i class="fas fa-${isCompleted ? 'undo' : 'check'}"></i>
                        ${isCompleted ? 'Undo' : 'Complete'}
                    </button>
                    
                    <button class="habit-btn rate-btn" onclick="habitTracker.rateHabit('${habit.id}')">
                        <i class="fas fa-star"></i> Rate
                    </button>
                    
                    <button class="habit-btn delete-btn" onclick="habitTracker.deleteHabit('${habit.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    createWeekHabitItem(habit, date) {
        const dateStr = date.toDateString();
        const isCompleted = habit.completedDates.includes(dateStr);
        const isMissed = !isCompleted && this.getHabitStatus(habit) === 'missed';
        
        let statusClass = 'pending';
        if (isCompleted) statusClass = 'completed';
        else if (isMissed) statusClass = 'missed';
        
        return `
            <div class="week-habit ${statusClass}" 
                 style="background-color: ${habit.color}; opacity: ${isCompleted ? '1' : '0.7'}"
                 title="${habit.name}">
                ${habit.name.substring(0, 10)}${habit.name.length > 10 ? '...' : ''}
            </div>
        `;
    }

    createHabitListItem(habit) {
        const status = this.getHabitStatus(habit);
        
        return `
            <div class="habit-list-item">
                <div class="habit-list-info">
                    <div class="habit-list-title">${habit.name}</div>
                    <div class="habit-list-details">
                        ${habit.category} • ${habit.frequency} • Streak: ${habit.streak}
                    </div>
                </div>
                <div class="habit-list-status ${status}">${status}</div>
            </div>
        `;
    }

    calculateStats() {
        const totalHabits = this.habits.length;
        let currentStreak = 0;
        let totalCompletions = 0;
        let totalRatings = 0;
        let ratingSum = 0;

        this.habits.forEach(habit => {
            currentStreak = Math.max(currentStreak, habit.streak);
            totalCompletions += habit.totalCompletions;
            habit.ratings.forEach(rating => {
                totalRatings++;
                ratingSum += rating.rating;
            });
        });

        const completionRate = totalHabits > 0 ? Math.round((totalCompletions / (totalHabits * 7)) * 100) : 0;
        const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

        return {
            currentStreak,
            completionRate,
            totalHabits,
            averageRating
        };
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    navigateWeek(direction) {
        this.currentWeek.setDate(this.currentWeek.getDate() + (direction * 7));
        this.updateWeekView();
    }

    filterHabits(status) {
        this.updateAllHabitsView();
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-message">${message}</div>
        `;

        document.getElementById('notificationContainer').appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Time-based Notifications
    startNotificationChecks() {
        this.notificationCheckInterval = setInterval(() => {
            this.checkHabitReminders();
        }, 60000); // Check every minute
    }

    checkHabitReminders() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        this.habits.forEach(habit => {
            if (habit.time && this.getHabitStatus(habit) === 'active') {
                const [hours, minutes] = habit.time.split(':');
                const habitTime = parseInt(hours) * 60 + parseInt(minutes);
                const timeDiff = habitTime - currentTime;
                
                if (timeDiff === 5) { // 5 minutes before
                    this.showNotification(`Reminder: "${habit.name}" is due in 5 minutes!`, 'warning');
                } else if (timeDiff === 0) { // Due now
                    this.showNotification(`Time to complete: "${habit.name}"!`, 'warning');
                } else if (timeDiff === -15) { // 15 minutes overdue
                    this.showNotification(`Overdue: "${habit.name}" was due 15 minutes ago!`, 'error');
                }
            }
        });
    }
}

// Initialize the application
const habitTracker = new HabitTracker();

// Add some sample data for demonstration
if (habitTracker.habits.length === 0) {
    const sampleHabits = [
        {
            id: '1',
            name: 'Morning Exercise',
            description: '30 minutes of cardio or strength training',
            category: 'health',
            frequency: 'daily',
            customDays: [],
            time: '07:00',
            color: '#10b981',
            createdAt: new Date().toISOString(),
            completedDates: [],
            ratings: [],
            streak: 0,
            totalCompletions: 0
        },
        {
            id: '2',
            name: 'Read 30 Minutes',
            description: 'Read a book or educational content',
            category: 'learning',
            frequency: 'daily',
            customDays: [],
            time: '20:00',
            color: '#3b82f6',
            createdAt: new Date().toISOString(),
            completedDates: [],
            ratings: [],
            streak: 0,
            totalCompletions: 0
        },
        {
            id: '3',
            name: 'Weekly Planning',
            description: 'Plan goals and tasks for the week',
            category: 'productivity',
            frequency: 'weekly',
            customDays: [],
            time: '09:00',
            color: '#8b5cf6',
            createdAt: new Date().toISOString(),
            completedDates: [],
            ratings: [],
            streak: 0,
            totalCompletions: 0
        }
    ];
    
    habitTracker.habits = sampleHabits;
    habitTracker.saveData();
}
