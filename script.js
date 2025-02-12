document.addEventListener('DOMContentLoaded', () => {
    // Add Component Input Functionality
    const addComponentButton = document.getElementById('add-component');
    const componentInputsContainer = document.getElementById('component-inputs');

    if (addComponentButton) {
        addComponentButton.addEventListener('click', () => {
            const newComponentInput = document.createElement('div');
            newComponentInput.classList.add('component-input');
            newComponentInput.innerHTML = `
                <label for="component-name">Component Name:</label>
                <input type="text" name="component-name[]" required placeholder="Enter Component Name">
                <label for="quantity">Quantity:</label>
                <input type="number" name="quantity[]" required placeholder="Enter Quantity">
            `;
            componentInputsContainer.appendChild(newComponentInput);
        });
    }

    // Handle Component Request Form Submission
    const componentRequestForm = document.getElementById('component-request-form');
    if (componentRequestForm) {
        componentRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();

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

            alert('Components Requested: ' + JSON.stringify(components, null, 2));
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
        slotBookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fromDate = document.getElementById('from-date').value;
            const fromTime = document.getElementById('from-time').value;
            const toDate = document.getElementById('to-date').value;
            const toTime = document.getElementById('to-time').value;

            alert(`Slot booked from ${fromDate} ${fromTime} to ${toDate} ${toTime}`);
        });
    }
});