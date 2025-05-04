<template>
  <Navigation />

  <div class="group-container">
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading group data...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchGroupData" class="retry-button">Retry</button>
    </div>

    <div v-else class="group-content">
      <div class="group-header">
        <h1>{{ group.group_name || 'Loading...' }}</h1>
        <div class="group-code" v-if="group.group_code">
          <span>Group Code: {{ group.group_code }}</span>
          <button @click="copyGroupCode" class="copy-button">
            <i class="far fa-copy"></i>
          </button>
        </div>
        <div class="group-meta">
          <span>Created by: {{ creatorName || 'Loading...' }}</span>
          <span v-if="group.created_at">Created on: {{ formatDate(group.created_at) }}</span>
        </div>
        <button @click="goToGroupManagement" class="manage-groups-btn">
            <i class="fas fa-users-cog"></i> Create or Join a Group
          </button>
      </div>

      <div class="group-tabs">
        <button 
          @click="activeTab = 'expenses'" 
          :class="{ active: activeTab === 'expenses' }"
        >
          Expenses
        </button>
        <button @click="activeTab = 'members'" :class="{ active: activeTab === 'members' }">
        Members ({{ members?.length || 0 }})
        </button>
        <button 
          @click="activeTab = 'summary'" 
          :class="{ active: activeTab === 'summary' }"
        >
          Summary
        </button>
        <button 
          v-if="isAdmin"
          @click="activeTab = 'settings'" 
          :class="{ active: activeTab === 'settings' }"
        >
          Settings
        </button>
      </div>

      <div class="tab-content">
        <!-- Expenses Tab -->
        <div v-if="activeTab === 'expenses'" class="expenses-tab">
          <div class="expense-controls">
            <div class="month-selector">
              <button @click="prevMonth">&lt;</button>
              <span>{{ currentMonthYear }}</span>
              <button @click="nextMonth">&gt;</button>
            </div>
            <button @click="showAddExpenseModal = true" class="add-expense-button">
              <i class="fas fa-plus"></i> Add Expense
            </button>
          </div>

          <div v-if="expensesLoading" class="loading-expenses">
            <div class="spinner small"></div>
          </div>
          
          <div v-else-if="expensesError" class="error-message">
            {{ expensesError }}
          </div>
          
          <div v-else-if="!expenses || expenses.length === 0" class="no-expenses">
  <p>No expenses recorded for {{ currentMonthYear }}</p>
</div>
          
          <div v-else class="expenses-list">
            <div class="expense-item" v-for="expense in expenses" :key="expense.id">
              <div class="expense-info">
                <span class="expense-name">{{ expense.item_name }}</span>
                <span class="expense-user">{{ expense.user_name }}</span>
                <span class="expense-type">{{ expense.expense_type }}</span>
              </div>
              <div class="expense-amount">
                ₱{{ expense.item_price.toFixed(2) }}
                <div class="expense-actions" v-if="canEditExpense(expense)">
                  <button @click="editExpense(expense)" class="action-button edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="confirmDeleteExpense(expense)" class="action-button delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Members Tab -->
        <div v-if="activeTab === 'members'" class="members-tab">
          <div class="members-list">
            <div v-for="member in members" :key="member.id" class="member-item">
              <div class="member-info">
                <span class="member-name">{{ member.username }}</span>
                <span class="member-email">{{ member.email }}</span>
              </div>
              <div class="member-role">
                <span :class="['role-badge', member.role]">{{ member.role }}</span>
                <button 
                  v-if="isAdmin && member.role !== 'admin'"
                  @click="removeMember(member)"
                  class="remove-button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="isAdmin" class="invite-section">
            <h3>Invite New Member</h3>
            <div class="invite-form">
              <input 
                v-model="inviteEmail" 
                type="email" 
                placeholder="Enter email address"
                class="email-input"
              >
              <button @click="sendInvite" class="invite-button">
                Send Invite
              </button>
            </div>
            <p v-if="inviteError" class="error-message">{{ inviteError }}</p>
            <p v-if="inviteSuccess" class="success-message">{{ inviteSuccess }}</p>
          </div>
        </div>

        <!-- Summary Tab -->
        <div v-if="activeTab === 'summary'" class="summary-tab">
          <div class="summary-header">
            <h3>Summary for {{ currentMonthYear }}</h3>
            <div v-if="summaryLoading" class="loading-message">
             Loading summary data...
            </div>
            <div v-else class="total-expenses">
              Total Expenses: ₱{{ (summary?.total || 0).toFixed(2) }}
            </div>
          </div>

          <div v-if="summaryLoading" class="loading-summary">
          <div class="spinner small"></div>
          </div>

          <div v-else-if="summaryError" class="error-message">
          {{ summaryError }}
          </div>
          
          <div v-else class="summary-grid">
            <div class="summary-card">
              <h4>By Member</h4>
              <div v-if="!summary.byMember || summary.byMember.length === 0">
                <p>No member data available</p>
              </div>

              <div v-else class="member-summary" v-for="member in summary?.byMember || []" :key="member.user_id">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-amount">₱{{ member.total.toFixed(2) }}</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getPercentage(member.total, summary.total) + '%' }">
                  </div>
                </div>
              </div>
            </div>
            
            <div class="summary-card">
              <h4>By Category</h4>
              <div v-if="!summary.byCategory || summary.byCategory.length === 0">
               <p>No category data available</p>
              </div>
              <div v-else class="category-summary" v-for="cat in summary?.byCategory || []" :key="cat.expense_type">
                <span class="category-name">{{ cat.expense_type }}</span>
                <span class="category-amount">₱{{ cat.total.toFixed(2) }}</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getPercentage(cat.total, summary.total) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Tab (Admin Only) -->
        <div v-if="activeTab === 'settings' && isAdmin" class="settings-tab">
          <div class="settings-section">
            <h3>Group Settings</h3>
            <div class="setting-item">
              <label>Group Name</label>
              <input v-model="group.group_name" type="text" class="setting-input">
              <button @click="updateGroupName" class="save-button">Save</button>
            </div>
          </div>
          
          <div class="danger-zone">
            <h3>Danger Zone</h3>
            <div class="danger-item">
              <p>Delete this group permanently</p>
              <button @click="confirmDeleteGroup" class="delete-button">
                Delete Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Expense Modal -->
    <div v-if="showAddExpenseModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Expense</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitExpense">
            <div class="form-group">
              <label>Item Name</label>
              <input v-model="newExpense.item_name" type="text" required>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input v-model="newExpense.item_price" type="number" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label>Category</label>
              <select v-model="newExpense.expense_type" required>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">Add Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Expense Modal -->
    <div v-if="showEditExpenseModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Expense</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateExpense">
            <div class="form-group">
              <label>Item Name</label>
              <input v-model="editingExpense.item_name" type="text" required>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input v-model="editingExpense.item_price" type="number" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label>Category</label>
              <select v-model="editingExpense.expense_type" required>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">Update Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmationModal" class="modal-overlay">
      <div class="modal-content confirmation-modal">
        <div class="modal-header">
          <h3>{{ confirmationTitle }}</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmationMessage }}</p>
          <div class="confirmation-actions">
            <button @click="closeModal" class="cancel-button">Cancel</button>
            <button @click="confirmAction" class="confirm-button">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from "./navigation.vue";
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  name: 'Group',
  components: { Navigation },
  beforeRouteEnter(to, from, next) {
    if (!to.params.groupId) {
      next('/GC'); // Redirect to GC if no groupId
    } else {
      next(vm => {
        // Additional checks after component instance is created
        if (!vm.hasGroupAccess) {
          vm.$router.replace('/GC');
        }
      });
    }
  },
  data() {
    return {
      groupId: this.$route.params.groupId,
      activeTab: 'expenses',
      currentMonthYear: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      
      // Modals
      showAddExpenseModal: false,
      showEditExpenseModal: false,
      showConfirmationModal: false,
      
      // Form data
      newExpense: {
        item_name: '',
        item_price: 0,
        expense_type: 'Food',
        group_id: this.$route.params.groupId
      },
      
      editingExpense: {},
      confirmationTitle: '',
      confirmationMessage: '',
      confirmAction: () => {},
      
      // Invite member
      inviteEmail: '',
      inviteError: '',
      inviteSuccess: '',
      summaryLoading: false,
      summaryError: null
    };
  },
  computed: {
    ...mapState('group', { // Use object syntax for clarity
      currentGroup: state => state.currentGroup,
      members: state => state.members,
      expenses: state => state.expenses,
      summary: state => state.summary,
      loading: state => state.loading,
      error: state => state.error,
      isAdmin: state => state.isAdmin
    }),
    ...mapGetters('group', ['creatorName']),

    group() {
      return this.currentGroup || {};
    },

    hasGroupAccess() {
      const user = JSON.parse(localStorage.getItem('user'));
      return this.group?.id && this.members?.some(m => m.id === user?.id);
    }
  },

  async created() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('jsontoken');

    if (!user || !token) {
    console.error('Missing authentication data');
    this.$router.push('/login');
    return;
  }

  if (!this.$route.params.groupId) {
    console.error('Missing groupId parameter');
    this.$router.push('/GC');
    return;
  }

  try {
    await this.initializeGroupData();
    await this.fetchGroupData();
    await this.loadExpenses();
    await this.loadSummary();
  } catch (err) {
    console.error('Failed to load group data:', err);
    this.$notify({
      title: 'Error',
      message: 'Failed to load group data',
      type: 'error'
    });

    if (err.message.includes('initialization')) {
      this.$router.push('/GC');
    }
  }
},

  methods: {
    ...mapActions('group', [
      'fetchGroup',
      'fetchExpenses',
      'fetchSummary',
      'addExpense',
      'updateExpense',
      'deleteExpense',
      'sendInvite',
      'removeMember',
      'updateGroupName',
      'deleteGroup'
    ]),

    goToGroupManagement() {
      this.$router.push({ 
        name: 'GC',
        query: { fromGroup: 'true' } 
      });
    },

    async initializeGroupData() {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('jsontoken');

      if (!user || !token) {
        this.$router.push('/login');
        return;
      }

      if (!this.$route.params.groupId) {
        this.$router.push('/GC');
        return;
      }

      try {
        await Promise.all([
          this.fetchGroupData(),
          this.loadExpenses(),
          this.loadSummary()
        ]);
        
        // Verify access after loading
        if (!this.hasGroupAccess) {
          this.$router.replace('/GC');
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
        this.$router.replace('/GC');
      }
    },
    
    async fetchGroupData() {
 const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('No user found in localStorage. Redirecting to login...');
    this.$router.push('/login'); // Redirect to login if no user
    return;
  }

  try {
    console.log('Fetching group data for groupId:', this.groupId);
    await this.fetchGroup(this.groupId);
    console.log('Group data fetched successfully');
    
    if (!this.currentGroup?.id) {
      this.$router.replace('/GC');
      return;
    }

  } catch (err) {
    console.error('Error fetching group:', err, {
      error: err,
      response: err.response?.data
    });
    
    this.$notify({
      title: 'Error',
      message: err.message || 'Failed to load group data',
      type: 'error'
    });

    if (err.response?.status === 401 || err.message.includes('not logged in')) {
      this.$router.push('/login');
    } else {
      // Redirect to group center for any other error
      this.$router.replace('/GC');
    }
  }
},
    
    async loadExpenses() {
    const monthYear = this.formatMonthYear(this.currentMonthYear);
    await this.fetchExpenses({ groupId: this.groupId, monthYear });
  },
    
  async loadSummary() {
    this.summaryLoading = true;
    this.summaryError = null;

    try {
      const monthYear = this.formatMonthYear(this.currentMonthYear);
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      throw new Error('Invalid month format');
    }
    
    await this.fetchSummary({ 
      groupId: this.groupId, 
      monthYear 
    });
  } catch (err) {
    this.summaryError = err.response?.data?.message || err.message || 'Failed to load summary';
    console.error('Failed to load summary:', {
      error: err,
      response: err.response?.data
    });

    this.$notify({
      title: 'Error',
      message: this.summaryError,
      type: 'error',
      duration: 5000
    });
  } finally {
    this.summaryLoading = false;
  }
},
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
    formatMonthYear(monthYearString) {
      const date = new Date(monthYearString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    },
    
    prevMonth() {
      const date = new Date(this.currentMonthYear);
      date.setMonth(date.getMonth() - 1);
      this.currentMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      this.loadExpenses();  
      this.loadSummary(); 
    },
    
    nextMonth() {
      const date = new Date(this.currentMonthYear);
      date.setMonth(date.getMonth() + 1);
      this.currentMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      this.loadExpenses(); 
      this.loadExpenses(); 
    },
    
    copyGroupCode() {
      navigator.clipboard.writeText(this.currentGroup.group_code);
      this.$notify({
        title: 'Copied!',
        message: 'Group code copied to clipboard',
        type: 'success'
      });
    },
    
    async submitExpense() {
      try {
        await this.addExpense(this.newExpense);
        this.$notify({
          title: 'Success',
          message: 'Expense added successfully',
          type: 'success'
        });
        this.closeModal();
        this.resetNewExpense();
      } catch (err) {
        console.error('Error adding expense:', err);
        this.$notify({
          title: 'Error',
          message: err.response?.data?.message || 'Failed to add expense',
          type: 'error'
        });
      }
    },
    
    editExpense(expense) {
      this.editingExpense = { ...expense };
      this.showEditExpenseModal = true;
    },
    
    async updateExpense() {
      try {
        await this.updateExpense(this.editingExpense);
        this.$notify({
          title: 'Success',
          message: 'Expense updated successfully',
          type: 'success'
        });
        this.closeModal();
      } catch (err) {
        console.error('Error updating expense:', err);
        this.$notify({
          title: 'Error',
          message: err.response?.data?.message || 'Failed to update expense',
          type: 'error'
        });
      }
    },
    
    confirmDeleteExpense(expense) {
      this.confirmationTitle = 'Delete Expense';
      this.confirmationMessage = `Are you sure you want to delete "${expense.item_name}" (₱${expense.item_price.toFixed(2)})?`;
      this.confirmAction = async () => {
        try {
          await this.deleteExpense(expense.id);
          this.$notify({
            title: 'Success',
            message: 'Expense deleted successfully',
            type: 'success'
          });
          this.closeModal();
        } catch (err) {
          console.error('Error deleting expense:', err);
          this.$notify({
            title: 'Error',
            message: err.response?.data?.message || 'Failed to delete expense',
            type: 'error'
          });
        }
      };
      this.showConfirmationModal = true;
    },
    
    async sendInvite() {
      this.inviteError = '';
      this.inviteSuccess = '';
      
      if (!this.inviteEmail) {
        this.inviteError = 'Please enter an email address';
        return;
      }
      
      try {
        await this.sendInvite({ groupId: this.groupId, email: this.inviteEmail });
        this.inviteSuccess = 'Invitation sent successfully!';
        this.inviteEmail = '';
        setTimeout(() => this.inviteSuccess = '', 3000);
      } catch (err) {
        console.error('Error sending invite:', err);
        this.inviteError = err.response?.data?.message || 'Failed to send invitation';
      }
    },
    
    confirmRemoveMember(member) {
      this.confirmationTitle = 'Remove Member';
      this.confirmationMessage = `Are you sure you want to remove ${member.username} from the group?`;
      this.confirmAction = async () => {
        try {
          await this.removeMember({ groupId: this.groupId, memberId: member.id });
          this.$notify({
            title: 'Success',
            message: 'Member removed successfully',
            type: 'success'
          });
          this.closeModal();
        } catch (err) {
          console.error('Error removing member:', err);
          this.$notify({
            title: 'Error',
            message: err.response?.data?.message || 'Failed to remove member',
            type: 'error'
          });
        }
      };
      this.showConfirmationModal = true;
    },
    
    async updateGroupName() {
      try {
        await this.updateGroupName({ 
          groupId: this.groupId, 
          name: this.currentGroup.group_name 
        });
        this.$notify({
          title: 'Success',
          message: 'Group name updated successfully',
          type: 'success'
        });
      } catch (err) {
        console.error('Error updating group name:', err);
        this.$notify({
          title: 'Error',
          message: err.response?.data?.message || 'Failed to update group name',
          type: 'error'
        });
      }
    },
    
    confirmDeleteGroup() {
      this.confirmationTitle = 'Delete Group';
      this.confirmationMessage = 'Are you sure you want to delete this group permanently? This action cannot be undone.';
      this.confirmAction = async () => {
        try {
          await this.deleteGroup(this.groupId);
          this.$notify({
            title: 'Success',
            message: 'Group deleted successfully',
            type: 'success'
          });
          this.$router.push('/GC');
        } catch (err) {
          console.error('Error deleting group:', err);
          this.$notify({
            title: 'Error',
            message: err.response?.data?.message || 'Failed to delete group',
            type: 'error'
          });
        }
      };
      this.showConfirmationModal = true;
    },
    
    canEditExpense(expense) {
      const userId = JSON.parse(localStorage.getItem('user')).id;
      return this.isAdmin || expense.user_id === userId;
    },
    
    getPercentage(value, total) {
      if (total === 0) return 0;
      return Math.round((value / total) * 100);
    },
    
    closeModal() {
      this.showAddExpenseModal = false;
      this.showEditExpenseModal = false;
      this.showConfirmationModal = false;
    },
    
    resetNewExpense() {
      this.newExpense = {
        item_name: '',
        item_price: 0,
        expense_type: 'Food',
        group_id: this.groupId
      };
    },

 beforeRouteEnter(to, from, next) {
    if (!to.params.groupId) {
      next('/GC');
    } else {
      next(vm => {
        if (!vm.hasGroupAccess) {
          vm.$router.replace('/GC');
        }
      });
    }
  },

  beforeRouteUpdate(to, from, next) {
    if (!to.params.groupId) {
      this.$router.replace('/GC');
      return;
    }
    
    this.groupId = to.params.groupId;
    this.initializeGroupData()
      .finally(() => next());
  }
}
};
</script>

<style scoped>
.manage-groups-btn {
  background: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}
.group-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 20px 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 20px;
  background-color: #ffebee;
  border-radius: 5px;
  margin-top: 100px;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 15px;
}

.retry-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.group-header {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.group-code {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.copy-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #1976d2;
}

.group-meta {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 0.9rem;
}

.group-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.group-tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
}

.group-tabs button.active {
  color: #1976d2;
  font-weight: bold;
}

.group-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1976d2;
}

.expense-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.month-selector button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.add-expense-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.expenses-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.expense-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.expense-name {
  font-weight: bold;
}

.expense-user {
  font-size: 0.8rem;
  color: #666;
}

.expense-type {
  font-size: 0.8rem;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}

.expense-amount {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
}

.expense-actions {
  display: flex;
  gap: 5px;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.action-button.edit:hover {
  color: #1976d2;
}

.action-button.delete:hover {
  color: #d32f2f;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: bold;
}

.member-email {
  font-size: 0.8rem;
  color: #666;
}

.member-role {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

.role-badge.admin {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.role-badge.member {
  background-color: #e3f2fd;
  color: #1976d2;
}

.remove-button {
  background-color: #ffebee;
  color: #d32f2f;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.invite-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.invite-form {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.email-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.invite-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.total-expenses {
  font-size: 1.2rem;
  font-weight: bold;
}

.member-summary, .category-summary {
  margin-bottom: 15px;
}

.progress-bar {
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  margin-top: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #1976d2;
  border-radius: 4px;
}

.settings-section {
  margin-bottom: 30px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.setting-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.save-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.danger-zone {
  padding: 20px;
  background-color: #ffebee;
  border-radius: 8px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.delete-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-button {
  background-color: #f5f5f5;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirmation-modal {
  text-align: center;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.confirm-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.no-expenses {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-expenses {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.success-message {
  color: #2e7d32;
  margin-top: 10px;
}
</style>
