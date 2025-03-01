document.addEventListener('DOMContentLoaded', async () => {
    // Add Component Input Functionality
    const addComponentButton = document.getElementById('add-component');
    const componentInputsContainer = document.getElementById('component-inputs');

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

    // Initialize dropdown for the first component input
    initializeDropdown(document.querySelector('input[name="component-name[]"]'));

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

    async function initializeDropdown(inputElement) {
        const dropdownList = inputElement.nextElementSibling;
        const components = await fetchComponents();

        inputElement.addEventListener('input', () => {
            const query = inputElement.value.toLowerCase();
            dropdownList.innerHTML = '';

            const filteredComponents = components.filter(component => component.toLowerCase().includes(query));
            filteredComponents.forEach(component => {
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
            if (inputElement.value) {
                inputElement.dispatchEvent(new Event('input'));
            }
        });

        document.addEventListener('click', (event) => {
            if (!inputElement.parentElement.contains(event.target)) {
                dropdownList.innerHTML = '';
            }
        });
    }

    // Handle Component Request Form Submission
    const componentRequestForm = document.getElementById('component-request-form');
    if (componentRequestForm) {
        componentRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const username = currentUser.username;

            const componentNames = document.querySelectorAll('input[name="component-name[]"]');
            const quantities = document.querySelectorAll('input[name="quantity[]"]');

            if (componentNames.length === 0 || quantities.length === 0) {
                alert('Please add at least one component.');
                return;
            }

            const components = [];
            for (let i = 0; i < componentNames.length; i++) {
                components.push({
                    componentName: componentNames[i].value.trim(),
                    quantity: quantities[i].value.trim()
                });
            }

            try {
                const response = await fetch('http://localhost:5000/component-request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, components })
                });

                if (response.ok) {
                    alert('Component request submitted successfully!');
                    componentRequestForm.reset();
                } else {
                    const errorData = await response.json();
                    alert(errorData.message);
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Handle User Profile Display
    const userProfileContainer = document.getElementById('user-profile');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (userProfileContainer && currentUser) {
        userProfileContainer.innerHTML = `
            <p><strong>Name:</strong> ${currentUser.name || 'Not Available'}</p>
            <p><strong>Username:</strong> ${currentUser.username || 'Not Available'}</p>
            <p><strong>Roll Number:</strong> ${currentUser.roll || 'Not Available'}</p>
            <p><strong>Gender:</strong> ${currentUser.gender || 'Not Available'}</p>
            <p><strong>Date of Birth:</strong> ${currentUser.dob || 'Not Available'}</p>
            <p><strong>Course:</strong> ${currentUser.course || 'Not Available'}</p>
            <p><strong>Graduation Year:</strong> ${currentUser.graduationYear || 'Not Available'}</p>
        `;
    } else if (userProfileContainer) {
        userProfileContainer.innerHTML = '<p>No user information available. Please log in again.</p>';
    }

    // Tab Navigation Functionality
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

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

    // Handle Logout
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html'; // Redirect to login page
        });
    }

    // Handle Slot Booking Form Submission
    const slotBookingForm = document.getElementById('slot-booking-form');
    if (slotBookingForm) {
        slotBookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const username = currentUser.username;

            const fromDate = document.getElementById('from-date').value;
            const fromTime = document.getElementById('from-time').value;
            const toDate = document.getElementById('to-date').value;
            const toTime = document.getElementById('to-time').value;

            try {
                const response = await fetch('http://localhost:5000/slot-booking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, fromDate, fromTime, toDate, toTime })
                });

                if (response.ok) {
                    alert(`Slot booked from ${fromDate} ${fromTime} to ${toDate} ${toTime}`);
                    slotBookingForm.reset();
                } else {
                    alert('Failed to book slot.');
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
            }
        });
    }
});