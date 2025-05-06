<template>
  <div class="fixed-container">
    <navigation/>
    
    <div class="group-management-container">
      <div class="centered-content">
        <div class="card">
          <div class="card-header">
            <h1 class="title">Group Expenses</h1>
            <div class="tabs">
              <button @click.prevent="activeTab = 'create'" :class="{ 'tab-button': true, 'active': activeTab === 'create' }">
                <i class="fas fa-plus-circle"></i> Create Group 
              </button>

              <button @click.prevent="activeTab = 'join'" :class="{ 'tab-button': true, 'active': activeTab === 'join' }">
                <i class="fas fa-user-plus"></i> Join Group 
              </button>
            </div>
          </div>

          <div class="card-body">
            <transition name="fade" mode="out-in">
              <div v-if="activeTab === 'create'" class="create-group">
                <h2 class="section-title">Create New Group</h2>
                <form @submit.prevent="createGroup" class="group-form">
                  <div class="form-group">
                    <label class="form-label">Group Name</label>
                    <input v-model="groupName" type="text" class="form-input" placeholder="Enter your group name" required :disabled="isLoading" />
                  </div>
                  <button type="submit" class="submit-button" :disabled="isLoading">
                    <template v-if="!isLoading">
                      <i class="fas fa-users"></i> Create Group
                    </template>
                    <template v-else>
                      <i class="fas fa-spinner fa-spin"></i> Creating...
                    </template>
                  </button>
                </form>
                <button @click="goBackToGroup" class="back-button">
                  <i class="fas fa-home"></i> Group Page
                </button>
              </div>

              <div v-else class="join-group">
                <h2 class="section-title">Join Existing Group</h2>
                <form @submit.prevent="joinGroup" class="group-form">
                  <div class="form-group">
                    <label class="form-label">Enter Join Code</label>
                    <input v-model="groupCodeInput" type="text" class="form-input" placeholder="Enter the 6-digit code" required :disabled="isLoading" />
                  </div>
                  <button type="submit" class="submit-button" :disabled="isLoading">
                    <template v-if="!isLoading">
                      <i class="fas fa-sign-in-alt"></i> Join Group
                    </template>
                    <template v-else>
                      <i class="fas fa-spinner fa-spin"></i> Joining...
                    </template>
                  </button>
                </form>
                <button @click="goBackToGroup" class="back-button">
                  <i class="fas fa-home"></i> Group Page
                </button>
              </div>
            </transition>

            <div v-if="error" class="error-message">
              <i class="fas fa-exclamation-circle"></i> {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </template>

  <script>
  import Navigation from "./navigation.vue"; 
  
  export default {
    name: 'GC',
    components: { Navigation },
    data() {
      return {
        userGroups: [],
        activeTab: 'create',
        groupName: '',
        groupCode: '',
        groupCodeInput: '',
        error: '',
        isLoading: false,
        forceShow: false,
        preventAutoRedirect: false 
       };
     },
 
     async created() {
      this.preventAutoRedirect = this.$route.query.fromGroup === 'true';

     await this.fetchUserGroups();
    if (this.$route.query.fromGroup && !this.preventAutoRedirect) {
      this.forceShow = true;
    }
  },
   
     methods: {

       async fetchUserGroups() {
       try {
         const response = await this.$axios.get('/api/grp_expenses/my-groups', {
           headers: {
             Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
           },
           timeout: 30000
         });
 
         if (response.data.success) {
           this.userGroups = response.data.data;
           localStorage.setItem('userGroups', JSON.stringify(response.data.data));
          
           if (!this.preventAutoRedirect && 
              !this.forceShow && 
              this.userGroups.length === 1) {
            setTimeout(() => {
              if (this.$route.name === 'GC') { // Double-check we're still on GC
                this.navigateToGroup(this.userGroups[0].id);
              }
            }, 100);
          }
        }
      } catch (err) {
        if (err.code === 'ECONNABORTED') {
          this.error = "Request timed out. Please try again.";
        } else {
          this.error = "Failed to load groups. Please refresh the page.";
        }
        console.error('Error:', err);
      }
    },
           
     goBackToGroup() {
      this.preventAutoRedirect = false;

       const storedGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
       if (storedGroups.length > 0) {
       this.navigateToGroup(storedGroups[0].id);
       return;
     }
 
     if (this.userGroups.length > 0) {
        this.navigateToGroup(this.userGroups[0].id);
      } else {
        this.fetchUserGroups().then(() => {
          if (this.userGroups.length > 0) {
            this.navigateToGroup(this.userGroups[0].id);
          } else {
            this.error = "You don't have any groups yet";
          }
        });
      }
    },

    navigateToGroup(groupId) {
      if (!groupId) return;
      
      // Set the flag to prevent auto-redirect when coming back
      this.preventAutoRedirect = true;
      
      this.$router.push({
        name: 'Group',
        params: { groupId }
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('Navigation error:', err);
          this.error = "Failed to navigate to group";
        }
      });
    },
 
     formatDate(dateString) {
       // Your date formatting implementation
       return new Date(dateString).toLocaleDateString();
     },
 
       async createGroup() {
         if (!this.groupName || this.groupName.length < 3) {
         this.error = 'Group name must be at least 3 characters';
         return;
         }
 
         try {
         this.isLoading = true;
         this.error = '';
 
         const user = JSON.parse(localStorage.getItem('user'));
     if (!user) {
       this.$router.push('/login');
       return;
     }
 
          const response = await this.$axios.post('/api/grp_expenses/create', {
           name: this.groupName.trim()
     }, {
       headers: {
         Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
       }
     });
 
     if (response.data.success) {  
       const user = JSON.parse(localStorage.getItem('user')) || {};
       user.currentGroupId = response.data.data.groupId;
       localStorage.setItem('user', JSON.stringify(user));
 
       this.$router.push({
         name: 'Group',
         params: { groupId: response.data.data.groupId }
       });
     }
   } catch (err) {
     console.error('Group creation failed:', err);
     this.error = err.response?.data?.message || err.message;
   } finally {
     this.isLoading = false;
   }
 },
       
       async joinGroup() {
         if (!this.groupCodeInput || !/^[A-Z0-9]{6}$/.test(this.groupCodeInput)) {
         this.error = 'Please enter a valid 6-character group code';
         return;
          }
 
         console.log('Join group button clicked'); 
         try {
           console.log('Attempting to join group with code:', this.groupCodeInput);
   
           this.isLoading = true;
           this.error = '';
 
           const response = await this.$axios.post(
       '/api/grp_expenses/join',
       {
         groupCode: this.groupCodeInput.toUpperCase()
       },
       {
         headers: {
           Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
         }
       }
     );
 
     console.log('Join response:', response.data);
           
              if (response.data.success) {
               const groupId = response.data.data.groupId;     
               const groupCode = response.data.data.groupCode; 
 
               const user = JSON.parse(localStorage.getItem('user')) || {};
       user.currentGroupId = groupId;
       localStorage.setItem('user', JSON.stringify(user));
       
       this.$notify({
         title: 'Success',
         message: 'Joined group successfully!',
         type: 'success'
       });
       
       this.$router.push({
         name: 'Group',
         params: { groupId: groupId }
       });
     } else {
       throw new Error(response.data?.message || 'Failed to join group');
     }
   } catch (err) {
     console.error('Join group error:', {
       error: err,
       response: err.response?.data
     });
     
     this.error = err.response?.data?.message || 
                 err.message || 
                 'Failed to join group';
                 
     if (err.response?.status === 401) {
       this.$router.push('/login');
     }
   } finally {
     this.isLoading = false;
   }
 }
 },

 beforeRouteEnter(to, from, next) {
    next(async vm => {
      if ((from.path === '/' || from.path === '/login') && 
          !to.query.fromGroup) {
        try {
          const response = await vm.$axios.get('/api/grp_expenses/my-groups');
          if (response.data?.success && 
              response.data.data?.length === 1 && 
              to.path === '/GC') {
            vm.navigateToGroup(response.data.data[0].id);
          }
        } catch (err) {
          console.error('Error fetching groups:', err);
        }
      }
    });
  }
};
   </script>
   
   <style scoped>
.back-button {
  width: 100%;
  margin-top: 20px;
  background: linear-gradient(135deg, #d1d1d1 0%, #5a5a5a 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button:hover {
  background: linear-gradient(135deg, #bfbfbf 0%, #444444 100%);
  transform: translateY(-2px);
}

   .user-groups-container {
   margin-bottom: 2rem;
 }
 
 .group-list {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
   gap: 1rem;
 }
 
 .group-card {
   border: 1px solid #ddd;
   border-radius: 8px;
   padding: 1rem;
   cursor: pointer;
   transition: all 0.3s ease;
   display: flex;
   justify-content: space-between;
 }
 
 .group-card:hover {
   box-shadow: 0 4px 8px rgba(0,0,0,0.1);
   transform: translateY(-2px);
 }
 
 .enter-group-btn {
   background: #4CAF50;
   color: white;
   border: none;
   padding: 8px 12px;
   border-radius: 4px;
   cursor: pointer;
 }
 
   .fa-spinner {
   animation: fa-spin 2s infinite linear;
   margin-right: 8px; /*NEWWWWWW */
 }
 
 @keyframes fa-spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(359deg); }
 }
   .fixed-container {
   position: fixed;
   top: 0;
   left: 0;
   right: 0;
   bottom: 0;
   overflow: hidden; 
   display: flex;
   flex-direction: column;
 }
   .group-management-container {
     flex: 1;
     display: flex;
     justify-content: center;
     align-items: center;
     background: #f6f8d5;;
     padding: 20px;
     font-family: 'Poppins', sans-serif;
     margin-top: 110px;
   }
 
   .centered-content {
   display: flex;
   justify-content: center;
   align-items: center;
   width: 100%;
   height: 100%;
 }
   
   .card {
     width: 100%;
     max-width: 600px;
     background: white;
     border-radius: 12px;
     box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
     overflow: hidden;
   }
   
   .card-header {
     padding: 30px;
     background: linear-gradient(135deg, #c8f5e3 0%, #a6dba1 100%);
     color: white;
     text-align: center;
   }
   
   .title {
     margin: 0 0 20px;
     font-size: 28px;
     font-weight: 600;
   }
   
   .tabs {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.2);
}
   
   .tab-button {
     flex: 1;
     padding: 12px;
     background: transparent;
     border: none;
     color: white;
     font-size: 16px;
     font-weight: 500;
     cursor: pointer;
     transition: all 0.3s ease;
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
   }
   .tab-button.active {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  font-weight: 700;
  box-shadow: inset 0 -2px 0 rgba(255,255,255,0.6);
}
   
   .tab-button:hover {
     background: rgba(255, 255, 255, 0.2);
   }
 
   .tab-button, .submit-button {
   cursor: pointer;
   position: relative; 
 } /*NEWWWWWWWWWWW */
 
 button:disabled {
   opacity: 0.7;
   cursor: not-allowed;
 } /*NEWWWWWWWWWWW */
   
   .card-body {
     padding: 30px;
   }
   
   .section-title {
     margin-top: 0;
     margin-bottom: 25px;
     color: #2c3e50;
     font-size: 22px;
     font-weight: 600;
     text-align: center;
   }
   
   .group-form {
     margin-bottom: 0px;
   }
   
   .form-group {
     margin-bottom: 20px;
   }
   
   .form-label {
     display: block;
     margin-bottom: 8px;
     color: #2c3e50;
     font-size: 14px;
     font-weight: 500;
   }
   
   .form-input {
     width: 98%;
     padding: 12px 5px;
     border: 1px solid #ccc;
     border-radius: 8px;
     font-size: 16px;
     background: #fcfcfc;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
   }
   
   .form-input:focus {
     outline: none;
     border-color: #43cea2;
     box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.25);
   }
   
   .submit-button {
     width: 100%;
     padding: 14px;
     background: linear-gradient(135deg, #b2f0dd 0%, #4caf7a 100%);
     color: white;
     border: none;
     border-radius: 8px;
     font-size: 17px;
     font-weight: 700;
     cursor: pointer;
     transition: transform 0.2s ease, box-shadow 0.2s ease;
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
   }
   
   .submit-button:hover {
    background: linear-gradient(135deg, #a0e8d2 0%, #388e5c 100%);
    transform: scale(1.02);
    box-shadow: 0 6px 15px rgba(24, 90, 157, 0.3);
   }
   
   .success-box {
     display: flex;
     padding: 20px;
     background: #f0fff4;
     border-radius: 8px;
     border: 1px solid #c6f6d5;
     margin-top: 25px;
   }
   
   .success-icon {
     margin-right: 15px;
     color: #48bb78;
     font-size: 32px;
   }
   
   .success-content {
     flex: 1;
   }
   
   .success-content h3 {
     margin: 0 0 10px;
     color: #2f855a;
   }
   
   .code-display {
     display: inline-block;
     padding: 8px 15px;
     background: white;
     border: 1px dashed #48bb78;
     border-radius: 6px;
     font-size: 20px;
     font-weight: 600;
     letter-spacing: 2px;
     color: #2f855a;
     margin: 10px 0;
   }
   
   .instruction {
     color: #718096;
     font-size: 14px;
     margin: 5px 0 0;
   }
   
   .error-message {
     padding: 12px 15px;
     background: #fff5f5;
     border: 1px solid #fed7d7;
     border-radius: 8px;
     color: #e53e3e;
     font-size: 14px;
     display: flex;
     align-items: center;
     gap: 8px;
   }
   
   .fade-enter-active,
   .fade-leave-active {
     transition: opacity 0.3s ease;
   }
   
   .fade-enter-from,
   .fade-leave-to {
     opacity: 0;
   }
   
   @media (max-width: 640px) {
     .card-header {
       padding: 20px;
     }
     
     .card-body {
       padding: 20px;
     }
     
     .title {
       font-size: 24px;
     }
     
     .tab-button {
       font-size: 14px;
       padding: 10px;
     }
   }
   </style>
