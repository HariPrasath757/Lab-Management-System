document.addEventListener('DOMContentLoaded', async () => {
    const addComponentButton = document.getElementById('add-component');
    const componentInputsContainer = document.getElementById('component-inputs');
    const componentRequestForm = document.getElementById('component-request-form');
    const userProfileContainer = document.getElementById('user-profile');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutButton = document.getElementById('logout');
    const slotBookingForm = document.getElementById('slot-booking-form');
    const computerDropdown = document.getElementById('computer-id');
    const labInchargeSection = document.getElementById('lab-incharge-section');

    async function fetchComponents() {
        try {
            const response = await fetch('http://localhost:5000/get-components');
            const components = await response.json();
            return components.map(component => component.component_name);
        } catch (error) {
            console.error('Error fetching components:', error);
            return [];
        }
    }

    async function fetchComputers() {
        try {
            const response = await fetch('http://localhost:5000/computers');
            const computers = await response.json();
            return computers;
        } catch (error) {
            console.error('Error fetching computers:', error);
            return [];
        }
    }

    async function initializeDropdown(inputElement) {
        const dropdownList = inputElement.nextElementSibling;
        const components = await fetchComponents();

        inputElement.addEventListener('input', () => {
            const query = inputElement.value.toLowerCase();
            dropdownList.innerHTML = '';
            components.filter(component => component.toLowerCase().includes(query)).forEach(component => {
                const item = document.createElement('div');
                item.classList.add('dropdown-item');
                item.textContent = component;
                item.addEventListener('click', () => {
                    inputElement.value = component;
                    dropdownList.innerHTML = '';
                });
                dropdownList.appendChild(item);
            });
        });

        inputElement.addEventListener('focus', () => {
            if (inputElement.value) inputElement.dispatchEvent(new Event('input'));
        });

        document.addEventListener('click', (event) => {
            if (!inputElement.parentElement.contains(event.target)) dropdownList.innerHTML = '';
        });
    }

    async function populateComputerDropdown() {
        const computers = await fetchComputers();
        computerDropdown.innerHTML = '';
        computers.forEach(computer => {
            const option = document.createElement('option');
            option.value = computer.id;
            option.textContent = `Computer ${computer.computer_index}`;
            computerDropdown.appendChild(option);
        });
    }

    if (addComponentButton) {
        addComponentButton.addEventListener('click', () => {
            const newComponentInput = document.createElement('div');
            newComponentInput.classList.add('component-input');
            newComponentInput.innerHTML = `
                <div>
                    <label for="component-name">Component Name:</label>
                    <div class="custom-dropdown">
                        <input type="text" name="component-name[]" placeholder="Search for a component" required>
                        <div class="dropdown-list"></div>
                    </div>
                </div>
                <div>
                    <label for="quantity">Quantity:</label>
                    <input type="number" name="quantity[]" required placeholder="Enter Quantity">
                </div>
            `;
            componentInputsContainer.appendChild(newComponentInput);
            initializeDropdown(newComponentInput.querySelector('input[name="component-name[]"]'));
        });
    }

    if (componentRequestForm) {
        componentRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = currentUser.username;
            const components = Array.from(document.querySelectorAll('.component-input')).map(input => ({
                componentName: input.querySelector('input[name="component-name[]"]').value.trim(),
                quantity: input.querySelector('input[name="quantity[]"]').value.trim()
            }));

            if (components.length === 0) {
                alert('Please add at least one component.');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/component-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, components })
                });

                if (response.ok) {
                    alert('Component request submitted successfully!');
                    componentRequestForm.reset();
                } else {
                    alert((await response.json()).message);
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
            }
        });
    }

    if (userProfileContainer && currentUser) {
        userProfileContainer.innerHTML = `
            <p><strong>Name:</strong> ${currentUser.name || 'Not Available'}</p>
            <p><strong>Username:</strong> ${currentUser.username || 'Not Available'}</p>
            <p><strong>Roll Number:</strong> ${currentUser.roll || 'Not Available'}</p>
            <p><strong>Gender:</strong> ${currentUser.gender || 'Not Available'}</p>
            <p><strong>Date of Birth:</strong> ${currentUser.dob || 'Not Available'}</p>
            <p><strong>Course:</strong> ${currentUser.course || 'Not Available'}</p>
            <p><strong>Graduation Year:</strong> ${currentUser.graduation_year || 'Not Available'}</p>
        `;
    } else if (userProfileContainer) {
        userProfileContainer.innerHTML = '<p>No user information available. Please log in again.</p>';
    }

    if (currentUser && currentUser.username === 'amrita') {
        labInchargeSection.style.display = 'block';
        document.querySelectorAll('.student-only').forEach(el => el.style.display = 'none');
    }

    if (tabs && tabContents) {
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.forEach(tab => tab.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
            });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    if (slotBookingForm) {
        slotBookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { username } = currentUser;
            const computerId = document.getElementById('computer-id').value;
            const fromDate = document.getElementById('from-date').value;
            const toDate = document.getElementById('from-date').value; // Ensure toDate is populated correctly
            const fromTime = document.getElementById('from-time').value;
            const toTime = document.getElementById('to-time').value;

            try {
                const response = await fetch('http://localhost:5000/slot-booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, computerId, fromDate, toDate, fromTime, toTime })
                });

                if (response.ok) {
                    alert(`Slot booked for computer ${computerId} from ${fromDate} ${fromTime} to ${toTime}`);
                    slotBookingForm.reset();
                } else {
                    const errorResponse = await response.json();
                    alert(`Failed to book slot: ${errorResponse.message}`);
                }
            } catch (error) {
                alert('An unexpected error occurred. Please try again.');
                console.error('Error during slot booking:', error);
            }
        });
    }

    // Function to load and display component requests for lab in-charge
    async function loadComponentRequests() {
        try {
            const response = await fetch('http://localhost:5000/component-requests');
            const requests = await response.json();
            const requestsTableBody = document.getElementById('requests-table').querySelector('tbody');
            requestsTableBody.innerHTML = '';
            requests.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.username}</td>
                    <td>${request.component_name}</td>
                    <td>${request.quantity}</td>
                    <td>
                        <button class="approve-btn" data-id="${request.id}">Approve</button>
                        <button class="decline-btn" data-id="${request.id}">Decline</button>
                    </td>
                `;
                requestsTableBody.appendChild(row);
            });

            document.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const requestId = button.getAttribute('data-id');
                    try {
                        const response = await fetch(`http://localhost:5000/approve-request/${requestId}`, {
                            method: 'POST'
                        });
                        if (response.ok) {
                            alert('Request approved successfully!');
                            loadComponentRequests();
                        } else {
                            alert('Failed to approve request.');
                        }
                    } catch (error) {
                        alert('An error occurred. Please try again.');
                    }
                });
            });

            document.querySelectorAll('.decline-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const requestId = button.getAttribute('data-id');
                    try {
                        const response = await fetch(`http://localhost:5000/decline-request/${requestId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            alert('Request declined successfully!');
                            loadComponentRequests();
                        } else {
                            alert('Failed to decline request.');
                        }
                    } catch (error) {
                        alert('An error occurred. Please try again.');
                    }
                });
            });
        } catch (error) {
            console.error('Error loading component requests:', error);
        }
    }

    // Function to load and display available components for lab in-charge
    async function loadAvailableComponents() {
        try {
            const response = await fetch('http://localhost:5000/available-components');
            const components = await response.json();
            const componentsTableBody = document.getElementById('components-table').querySelector('tbody');
            componentsTableBody.innerHTML = '';
            components.forEach(component => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${component.component_name}</td>
                    <td>${component.category}</td>
                    <td>${component.quantity_available}</td>
                `;
                componentsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading available components:', error);
        }
    }

    // Function to load and display slot bookings for lab in-charge
    async function loadBookings() {
        try {
            const response = await fetch('http://localhost:5000/view-bookings');
            const bookings = await response.json();
            const bookingsTableBody = document.getElementById('bookings-table').querySelector('tbody');
            bookingsTableBody.innerHTML = '';
            bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.username}</td>
                    <td>${booking.from_date}</td>
                    <td>${booking.from_time}</td>
                    <td>${booking.to_date}</td>
                    <td>${booking.to_time}</td>
                    <td>${booking.computer_id}</td>
                    <td>${booking.status}</td>
                    <td>
                        <button class="approve-btn" data-id="${booking.id}">Approve</button>
                        <button class="decline-btn" data-id="${booking.id}">Decline</button>
                    </td>
                `;
                bookingsTableBody.appendChild(row);
            });

            document.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const bookingId = button.getAttribute('data-id');
                    try {
                        const response = await fetch(`http://localhost:5000/approve-booking/${bookingId}`, {
                            method: 'POST'
                        });
                        if (response.ok) {
                            alert('Booking approved successfully!');
                            loadBookings();
                        } else {
                            alert('Failed to approve booking.');
                        }
                    } catch (error) {
                        alert('An error occurred. Please try again.');
                    }
                });
            });

            document.querySelectorAll('.decline-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const bookingId = button.getAttribute('data-id');
                    try {
                        const response = await fetch(`http://localhost:5000/decline-booking/${bookingId}`, {
                            method: 'POST'
                        });
                        if (response.ok) {
                            alert('Booking declined successfully!');
                            loadBookings();
                        } else {
                            alert('Failed to decline booking.');
                        }
                    } catch (error) {
                        alert('An error occurred. Please try again.');
                    }
                });
            });
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    // Load data if lab in-charge is logged in
    if (currentUser && currentUser.role === 'lab_incharge') {
        await loadComponentRequests();
        await loadAvailableComponents();
        await loadBookings();
    }

    // Initialize dropdowns and populate computer dropdown
    initializeDropdown(document.querySelector('input[name="component-name[]"]'));
    await populateComputerDropdown();
});