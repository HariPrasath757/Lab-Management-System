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
});

// Initialize Vue and Vuetify
Vue.use(Vuetify);

// Vue component for Date-Time Picker
Vue.component('v-date-time', {
    props: ['value'],

    template: `
      <div>
          <v-menu
              ref="menu"
              v-model="dropdownOpen"
              :close-on-content-click="false"
              :nudge-right="40"
              :return-value.sync="model"
              lazy
              transition="scale-transition"
              offset-y
              full-width
              max-width="560px"
              min-width="560px">
              <template v-slot:activator="{ on }">
                  <v-text-field
                      v-model="displayDate"
                      label="Date Time"
                      prepend-icon="event"
                      readonly
                      v-on="on"
                  ></v-text-field>
              </template>

             <div class="v-date-time-widget-container">
                  <v-layout row wrap>
                      <v-flex xs12 sm6>
                          <v-date-picker 
                              v-model="dateModel"
                              width="240"
                              color="primary"></v-date-picker>
                      
                      </v-flex>
                      <v-flex xs12 sm6>
                          <v-btn small 
                            fab
                            :color="meridiam === 'AM' ? 'primary' : 'darkgray'" 
                            class="btn-am" @click="meridiam='AM'">AM</v-btn>
                          
                          <v-btn 
                                fab
                               small
                               :color="meridiam === 'PM' ? 'primary' : 'darkgray'" 
                                class="btn-pm"
                                @click="meridiam='PM'">PM</v-btn>
                          
                          <v-time-picker 
                              v-if="dropdownOpen" 
                              v-model="timeModel" 
                              color="primary"
                              width="240"
                              :no-title="true"></v-time-picker>

                          <h3 class="text-xs-center">{{ currentSelection }}</h3>
                      </v-flex>

                      <v-flex xs12 class="text-xs-center">
                          <v-btn small @click="dropdownOpen = false" color="secondary">Cancel</v-btn>
                          <v-btn small @click="confirm()" color="primary">Ok</v-btn>
                      </v-flex>
                  </v-layout>
              </div>
          </v-menu>
      </div>
    `,
    
    data() {
      return {
        dropdownOpen: false,
        meridiam: 'AM',
        displayDate: '',
        dateModel: '',
        timeModel: '',
        monthNames: [
          "Jan", "Feb", "Mar",
          "Apr", "May", "June", "Jul",
          "Aug", "Sept", "Oct",
          "Nov", "Dec"
        ]
      }
    },
  
    computed: {
        model: {
            get() { return this.value; },
            set(model) {  }
        },
        
        currentSelection(){
            let selectedTime = this.timeModel+' '+this.meridiam
            return this.formatDate(this.dateModel) + ' '+selectedTime;
        }
    },

    methods: {
        formatDate(date) {
            if (!date) return '';

            const [year, month, day] = date.split('-')
            let monthName = this.monthNames[parseInt(month)]
            return `${monthName} ${day}, ${year}`;
        },
        
        // Confirm the datetime selection and close the popover
        confirm(){
            this.onUpdateDate();
            this.dropdownOpen = false
        },
        
        // Format the date and trigger the input event
        onUpdateDate(){
            if ( !this.dateModel || !this.timeModel) return false;

            let selectedTime = this.timeModel+' '+this.meridiam
            this.displayDate = this.formatDate(this.dateModel) + ' '+selectedTime
            this.$emit('input', this.dateModel + ' '+selectedTime);
        },
    },
  
    mounted(){
        // Set the current date and time as default value
        var d = new Date();
        var currentHour = d.getHours() % 12; // AM,PM format
        var minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        var currentTime = currentHour+':'+minutes;
        this.timeModel = currentTime;
        this.dateModel = d.toISOString().substr(0, 10);
      
        if ( d.getHours() >= 12) {
          this.meridiam = 'PM';
        }
    }
});

const vm = new Vue({
  el: "#app",
  vuetify: new Vuetify(), // Initialize Vuetify
  data(){
    return {
      fromDateModel: '',
      fromTimeModel: '',
      toDateModel: '',
      toTimeModel: '',
    }
  },
  methods: {
    submitBooking() {
      alert(`Slot booked from ${this.fromDateModel} ${this.fromTimeModel} to ${this.toDateModel} ${this.toTimeModel}`);
    }
  }
});