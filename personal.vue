<template>
  <navigation/>
  <div class="main-layout">
    <div v-if="showBudgetExceededAlert" class="budget-alert">
      <div class="alert-content">
        <span class="alert-icon">⚠️</span>
        <span>You have exceeded your monthly budget!</span>
        <button @click="dismissAlert" class="dismiss-btn">×</button>
      </div>
      </div>
    <div v-if="error" class="error-message">
        An error occurred: {{ error }}
        <button @click="resetError">Try Again</button>
      </div>
      <div v-else>
    <div class="top-row"> 
  <div class="budget-container">
    <div class="budget-content">
    <div v-if="budgetSuccessMessage" class="budget-success-message" :class="{ hide: budgetHideMessage }">
      {{ budgetSuccessMessage }}
    </div>
      <div class="budget-header"> <!--NEWWWWWWWWWW-->
      <h3>Monthly Budget</h3>
      <button 
        v-if="!hasExistingBudget && !isAddingBudget" 
        @click="showAddBudgetForm" 
        class="add-budget-btn"
      >
        Add Budget
      </button>
      <button 
        v-if="hasExistingBudget && !isEditingBudget" 
        @click="showEditBudgetForm" 
        class="edit-budget-btn"
      >
        Edit Budget
      </button>
    </div>

      <div v-if="!isAddingBudget && !isEditingBudget" class="budget-display">
            <div class="budget-info">
              <div class="budget-month-row"> <!--NEWWWWWWWWWWW-->
                <span class="budget-label">Month-Year:</span>
                <span class="budget-month">{{ formatMonthYear(safeSelectedMonthYear) }}</span>
              </div>
              <div class="budget-amount-row">
                <span class="budget-label">Budget Amount:</span>
              <span class="budget-amount">{{ formatPHP(currentBudget.budget_amount) }}</span>
            </div>
        </div>
        </div>

        <!--FOR ADDING BUDGET-->
        <div v-if="isAddingBudget" class="budget-form">
        <div class="form-group">
          <label for="monthYear">Month-Year:</label>
          <span class="uneditable-month">{{ formatMonthYear(currentMonthYear) }}</span>
        </div>
        <div class="form-group">
          <label for="budgetAmount">Budget Amount (₱):</label>
          <input type="number" id="budgetAmount" v-model="budgetAmount" placeholder="Enter budget amount" step="0.01" min="0">
        </div>

        <div class="budget-form-buttons"> <!--NEWWWWWWWW-->
          <button class="budget-btn cancel-btn" @click="cancelBudgetForm">Cancel </button>
            <button class="budget-btn" @click="submitAddBudget">Set Budget</button>
          </div>
    </div>

            <!-- FOR EDITING BUDGET -->
            <div v-if="isEditingBudget" class="budget-form">
          <div class="form-group">
            <label>Month-Year:</label>
            <span class="uneditable-month">{{ formatMonthYear(safeSelectedMonthYear) }}</span>
          </div>
          <div class="form-group">
            <label for="editBudgetAmount">Budget Amount (₱):</label>
            <input type="number" id="editBudgetAmount" v-model="budgetAmount" placeholder="Enter budget amount" step="0.01" min="0" >
          </div>
          <div class="budget-form-buttons">
            <button class="budget-btn cancel-btn" @click="cancelBudgetForm">Cancel</button>
            <button class="budget-btn" @click="updateBudget">Update Budget</button>
          </div>
        </div>
</div>
</div>


  <!--ADDING EXPENSESSSS-->
    <div class="content-wrapper">
      <form @submit.prevent="handleSubmit" class="expense-form"> <!-- CLASS IS NEWWWWWWWWWWW-->
         <input type="hidden" v-model="action" />
         <input type="hidden" v-if="editId" v-model="editId" />


         <div class="form-group">
           <label>EXPENSE TYPE:</label>
           <select v-model="expenseType" required @change="checkExpenseType">
            <option value="">Select a category</option> 
            <option value="Food">Food</option>
             <option value="Bill">Bill</option>
             <option value="Transportation">Transportation</option>
             <option value="Entertainment">Entertainment</option>
             <option value="Healthcare">Healthcare</option>
             <option value="Shopping">Shopping</option> 
             <option value="Other">Other</option>
            </select>

            <div v-if="showPredictionFeedback" class="prediction-feedback">
            <p>Did you mean <strong>{{ expenseType }}</strong>?</p>
            <button @click="submitPredictionFeedback(true)" class="feedback-btn correct">
              Yes, correct
            </button>
            <button @click="expenseType = ''; showPredictionFeedback = false" class="feedback-btn incorrect">
              No, select manually
            </button>
          </div>
         </div>
 
         <div v-if="expenseType === 'Other'" class="form-group">
           <label>Custom Expense Type:</label>
           <input type="text" v-model="customExpenseType" placeholder="Enter custom expense type" />
         </div>
 
         <div class="form-group">
           <label>ITEM NAME:</label>
           <input type="text" v-model="itemName" @input="onItemNameChange" placeholder="Enter item name" required />
           <small v-if="isPredicting" class="predicting-text">Predicting category...</small>
          </div>
 
         <div class="form-group">
           <label>ITEM PRICE:</label>
           <input type="number" v-model.number="itemPrice" placeholder="Enter item price" required step="0.01" />
         </div>
 
         <button class="btn" type="submit">{{ editId ? 'Update Expense' : 'Add Expense' }}</button>
         <div v-if="expenseSuccessMessage" class="expense-success-message" :class="{ hide: expenseHideMessage }">{{ expenseSuccessMessage }}</div>
      </form>

      </div>
      </div>

      <!--YOUR LIST OF EXPENSES-->
      <div class="expenses-container">
      <div class="expenses-section"> 
        <h3>Your Expenses</h3> 
         <div class="expenses-table"> 
          <table>
            <thead>
              <tr>
                <th>Expense Type</th>
                <th>Item Name</th>
                <th>Item Price</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense?.id">
  <td>{{ expense?.expense_type || 'N/A' }}</td>
  <td>{{ expense?.item_name || 'N/A' }}</td>
  <td>{{ expense?.item_price ? formatPHP(expense.item_price) : '₱0.00' }}</td>
  <td>{{ formatDate(expense?.expense_date) }}</td>
  <td class="actions">
    <button @click="editExpense(expense)" class="edit-btn">Edit</button>
    <button @click="deleteExpense(expense?.id)" class="delete-btn">Delete</button>
                </td>
                </tr>
            </tbody>
          </table>
        </div>
       </div>
       
     <div class="total">
      Total: <strong>₱{{ totalAmount.toFixed(2) }}</strong> (≈ {{ formatUsd(convertPhpToUsd(totalAmount)) }} USD)
     </div>
    </div>
  </div>
  </div>
 </template>
 
 <script>
 import Navigation from "./navigation.vue";
 import { mapState, mapGetters, mapActions } from 'vuex'
 
 export default {
   name: 'Personal',
   components: { Navigation },
   data() {
     return {
       expenseType: '',
       customExpenseType: '',
       itemName: '',
       itemPrice: '',
       editId: null,
       action: 'add',
       hideMessage: false,
       successTimeout: null,
       budgetAmount: '',
       budgetEditId: null, 
       isAddingBudget: false,
       isEditingBudget: false,
       messageContext: '',
       budgetSuccessMessage: '',
       budgetHideMessage: false,
       budgetSuccessTimeout: null,
       expenseSuccessMessage: '',
       expenseHideMessage: false,
       expenseSuccessTimeout: null,
       filterMonth: null,
       error: null,
       currentMonthYear: this.getCurrentMonthYear(),
       showBudgetExceededAlert: false,
       alertDismissed: false,
       lastCheckedMonthYear: null,
       isPredicting: false,
       showPredictionFeedback: false,
       predictionDebounce: null
     };
   },
   
   computed: {
     ...mapState(['expenses', 'personalBudgets', 'usdExchangeRate', 'selectedMonthYear']),
     ...mapGetters(['getTotalAmount', 'getCurrentBudget', 'getAvailableMonths']),
 
     selectedMonthYear: {
    get() {
      return this.$store.state.selectedMonthYear || 
             this.currentMonthYear;
    },
    set(value) {
      this.$store.commit('SET_SELECTED_MONTH_YEAR', value);
    }
  },

  currentBudget() {
    const budget = this.$store.getters.getCurrentBudget;
  return budget || { 
    id: null, 
    budget_amount: 0, 
    month_year: this.currentMonthYear 
  };
},
     
     safeSelectedMonthYear() {
      return this.selectedMonthYear || this.currentMonthYear;
    },
 
     totalAmount() {
       return this.getTotalAmount;
     },
 
     totalInUsd() {
       return (this.totalAmount / this.usdExchangeRate).toFixed(2);
     },
 
     currentBudgetAmount() {
    return this.currentBudget.budget_amount;
  },
     
  hasExistingBudget() {
    return !!this.currentBudget.id;
  },

  isBudgetExceeded() {
    if (!this.currentBudget?.budget_amount) return false;
    return this.totalAmount > this.currentBudget.budget_amount;
  }
},

   async mounted() {
  try {
    this.isLoading = true;
    this.alertDismissed = localStorage.getItem('budgetAlertDismissed') === 'true';
    
    // Initialize selected month first
    if (!this.$store.state.selectedMonthYear) {
      await this.setSelectedMonthYear(this.currentMonthYear);
    }
    
    // Then fetch data
    await Promise.all([
      this.fetchExchangeRate(),
      this.fetchPersonalBudgets(),
      this.fetchExpenses()
    ]);
    
    // Add this line to check initial budget status
    this.checkBudgetStatus();
  } catch (error) {
    console.error("Initialization error:", error);
    this.error = error.message || 'Failed to load data';
  } finally {
    this.isLoading = false;
  }
},

watch: {
  totalAmount(newVal) {
    this.checkBudgetStatus();
  },
  currentBudget: {
    deep: true,
    handler() {
      this.checkBudgetStatus();
    }
  }
  },

   methods: {
     ...mapActions([
       'fetchExchangeRate',
       'fetchExpenses',
       'fetchPersonalBudgets',
       'addExpense',
       'updateExpense',
       'deleteExpense',
       'addBudget',
       'updateBudget',
       'setSelectedMonthYear' 
     ]),
     onItemNameChange() {
      clearTimeout(this.predictionDebounce);
      
      // Only predict if item name has at least 3 characters and no category is selected
      if (this.itemName.length < 3 || this.expenseType) return;
      
      this.predictionDebounce = setTimeout(() => {
        this.predictCategory();
      }, 500); // Debounce to avoid too many requests
    },
    
    async predictCategory() {
      if (this.isPredicting || !this.itemName || this.itemName.length < 3) return;
      
      try {
        this.isPredicting = true;
        
        const response = await this.$axios.post('/api/predictions/predict', {
          item_name: this.itemName
        }, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        });
        
        if (response.data.success) {
      const predictedCategory = response.data.data.expense_type;
      this.expenseType = predictedCategory;
      
      this.showPredictionFeedback = predictedCategory === 'Other' && 
        this.shouldSuggestAlternative(this.itemName);
    }
  } catch (error) {
    console.error('Prediction failed:', error);
  } finally {
    this.isPredicting = false;
  }
},

shouldSuggestAlternative(itemName) {
  const lowerItem = itemName.toLowerCase();
  const words = lowerItem.split(/\s+/);
  
  const categoryKeywords = {
        Food: [
          "burger", "burgei", "burgir", "hamburger", "jollibee", 
          "pizza", "piza", "pasta", "sandwich", "fries", "milktea",
          "rice", "noodles", "chicken", "mcdo", "kfc"
        ],
        Bill: [
          "electric bill", "water bill", "internet bill", "phone bill",
          "cable bill", "utility bill", "rent", "mortgage", "electricity",
          "water payment", "internet payment"
        ],
        Transportation: [
          "gasoline", "gas", "petrol", "diesel", "jeepney fare",
          "bus fare", "mrt fare", "grab", "angkas", "taxi",
          "lrt fare", "tricycle fare", "parking fee", "car maintenance"
        ],
        Entertainment: [
          "movie tickets", "netflix", "spotify", "youtube premium",
          "concert tickets", "videoke", "arcade", "theme park",
          "movie", "cinema", "streaming", "game", "video game"
        ],
        Healthcare: [
          "doctor visit", "hospital", "medicine", "vitamins",
          "checkup", "dentist", "vaccine", "medical supplies",
          "pharmacy", "drugstore", "clinic", "xray", "laboratory"
        ],
        Shopping: [
          'shoes', 'clothes', 'shirt', 'pants', 'dress',
          'gadget', 'phone', 'laptop', 'accessories', 'bag',
          'watch', 'perfume', 'makeup', 'groceries', 'market',
          'office chair', 'desk', 'monitor', 'keyboard', 'mouse',
          'furniture', 'stationery', 'notebook', 'pen', 'backpack'
        ]
      };
  const isUnknown = !Object.values(categoryKeywords).some(keywords => 
    keywords.some(keyword =>
      keyword.includes(' ') ? 
        lowerItem.includes(keyword) : 
        words.includes(keyword)
    )
  );

  return isUnknown;
},
    async submitPredictionFeedback(isCorrect) {
      try {
        if (!isCorrect) {
          // Send correction to backend to learn
          await this.$axios.post('/api/predictions/learn', {
            item_name: this.itemName,
            expense_type: this.expenseType 
          }, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
            }
          });
        }
        
        this.showPredictionFeedback = false;
      } catch (error) {
        console.error('Feedback submission failed:', error);
      }
    },

     checkBudgetStatus() {
  console.log('--- Checking Budget Status ---');
  console.log('Current Budget:', this.currentBudget);
  console.log('Budget Amount:', this.currentBudget?.budget_amount);
  console.log('Total Expenses:', this.totalAmount);

  if (!this.currentBudget?.budget_amount) {
    this.showBudgetExceededAlert = false;
    return;
  }
  
  const currentMonthYear = this.getCurrentMonthYear();
  if (this.lastCheckedMonthYear !== currentMonthYear) {
    this.alertDismissed = false;
    localStorage.removeItem('budgetAlertDismissed');
    this.lastCheckedMonthYear = currentMonthYear;
  }

  const isExceeded = this.totalAmount > Number(this.currentBudget.budget_amount);
  
  if (isExceeded && !this.alertDismissed) {
    console.log('Showing budget exceeded alert');
    this.showBudgetExceededAlert = true;
  } else {
    console.log('Hiding budget exceeded alert');
    this.showBudgetExceededAlert = false;
  }
},
  
  dismissAlert() {
    this.showBudgetExceededAlert = false;
    this.alertDismissed = true;
    // Optional: Store dismissal in localStorage to persist across page refreshes
    localStorage.setItem('budgetAlertDismissed', 'true');
  },
     getCurrentMonthYear() {
      const now = new Date();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed
      const year = now.getFullYear();
      return `${year}-${month.toString().padStart(2, '0')}`;
    },
 
     handleMonthYearChange(newMonthYear) {
       this.setSelectedMonthYear(newMonthYear);  
       this.fetchExpenses();
     },
 
     formatMonthYear(monthYear) {
       try {
         if (!monthYear) {
           const now = new Date();
           return now.toLocaleString('default', { month: 'long', year: 'numeric' });
         }
         
         if (typeof monthYear === 'string') {
           const [year, month] = monthYear.split('-').map(Number);
           if (!isNaN(year) && !isNaN(month)) {
             const date = new Date(year, month - 1);
             return date.toLocaleString('default', { 
               month: 'long', 
               year: 'numeric' 
             });
           }
         }
         
         // Fallback for invalid input
         const now = new Date();
         return now.toLocaleString('default', { month: 'long', year: 'numeric' });
       } catch (e) {
         console.error('Error formatting month/year:', e);
         return 'Invalid date';
       }
     },
 
     // Budget Form Methods - REPLACED submitBudget with these two methods
     showAddBudgetForm() {
       this.isAddingBudget = true;
       this.budgetAmount = '';
     },
     
     showEditBudgetForm() {
       this.isEditingBudget = true;
       this.budgetAmount = this.currentBudgetAmount;
     },
     
     cancelBudgetForm() {
       this.isAddingBudget = false;
       this.isEditingBudget = false;
     },
 
     // NEW BUDGET METHODS - ADD THESE
     async submitAddBudget() {
    try {
      if (!this.budgetAmount) {
        throw new Error('Please enter a budget amount');
      }

      const budgetData = {
        month_year: this.currentMonthYear,
        budget_amount: this.parseCurrency(this.budgetAmount)
      };
      
      const result = await this.addBudget(budgetData); // Now calls the Vuex action
      
      if (result.success) {
        this.showBudgetSuccessMessage(result.message || 'Budget added successfully!');
        await this.fetchPersonalBudgets();
        this.cancelBudgetForm();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Budget add error:', error);
      this.showBudgetSuccessMessage(error.message || 'Failed to add budget');
    }
  },
 
     async updateBudget() {
       try {
        if (!this.currentBudget.id) {
      throw new Error('No budget found for current month');
    }
 
         if (!this.budgetAmount) {
           throw new Error('Please enter a budget amount');
         }
 
         const budgetData = {
           id: this.currentBudget.id,
           month_year: this.selectedMonthYear,
           budget_amount: this.parseCurrency(this.budgetAmount)
         };
         
         const result = await this.$store.dispatch('updateBudget', budgetData);
         
         if (result.success) {
           this.showBudgetSuccessMessage(result.message || 'Budget updated successfully!');
           await this.fetchPersonalBudgets();
           this.cancelBudgetForm();
         } else {
           throw new Error(result.message);
         }
       } catch (error) {
         this.showBudgetSuccessMessage(error.message || 'Failed to update budget');
       }
     },
 
     parseCurrency(value) {
       if (!value) return 0;
       const numericValue = String(value).replace(/[^\d.]/g, '');
       return parseFloat(numericValue) || 0;
     },
     
     convertPhpToUsd(phpAmount) {
       return this.parseCurrency(phpAmount) / this.usdExchangeRate;
     },
     
     formatUsd(value) {
       return '$' + parseFloat(value).toFixed(2);
     },
     
     formatPHP(value) {
       try {
         const amount = Number(this.parseCurrency(value)) || 0;
         return '₱' + amount.toLocaleString('en-PH', {
           minimumFractionDigits: 2,
           maximumFractionDigits: 2
         });
       } catch (e) {
         console.error('Error formatting PHP:', e);
         return '₱0.00';
       }
     },
     
     formatDate(dateString) {
       if (!dateString || dateString === 'N/A') return 'N/A';
       
       try {
         const options = { 
           day: 'numeric',   
           month: 'short',   
           year: 'numeric'    
         };
         return new Date(dateString).toLocaleDateString('en-US', options);
       } catch (e) {
         console.error('Date formatting error:', e);
         return 'N/A';
       }
     },
 
     // Expense Methods
     async handleSubmit() {
  try {
    if (!this.validateExpenseForm()) return;

    if (!this.currentBudget?.id) {
      this.showExpenseSuccessMessage('No valid budget selected');
      return;
    }

    const expenseData = {
      item_price: Number(this.itemPrice), 
      expense_type: this.expenseType === 'Other' ? this.customExpenseType : this.expenseType,
      item_name: this.itemName,
      personal_budget_id: this.currentBudget.id
    };

    let result;
    if (this.editId) {
      result = await this.updateExpense({
        id: this.editId,
        expenseData: expenseData
      });
    } else {
      result = await this.addExpense(expenseData);
    }

    if (result.success) {
      try {
            await this.$axios.post('/api/predictions/learn', {
              item_name: this.itemName,
              expense_type: this.expenseType 
            }, {
              headers: { 
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            });
          } catch (learnError) {
        console.error('Failed to send learning data:', learnError);
      }
    
      this.showExpenseSuccessMessage(result.message || (this.editId ? 'Expense updated!' : 'Expense added!'));
      this.resetForm();
      
      // Wait for both the expenses and budget to be refreshed
      await Promise.all([
        this.fetchExpenses(),
        this.fetchPersonalBudgets()
      ]);
      
      // Force a check after everything is updated
      this.$nextTick(() => {
        console.log('Checking budget after expense update');
        this.checkBudgetStatus();
      });
    } else {
      this.showExpenseSuccessMessage(result.message || 'Operation failed');
    }
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    this.showExpenseSuccessMessage(error.message || 'Failed to save expense');
  }
},
validateExpenseForm() {
  // Check if required fields are filled
  if (!this.itemPrice || isNaN(Number(this.itemPrice))) {
    this.showExpenseSuccessMessage('Please enter a valid amount');
    return false;
  }

  if (!this.expenseType) {
    this.showExpenseSuccessMessage('Please select an expense type');
    return false;
  }

  if (!this.itemName?.trim()) {
    this.showExpenseSuccessMessage('Please enter an item name');
    return false;
  }

  if (!this.currentBudget?.id) {
    this.showExpenseSuccessMessage('No valid budget selected');
    return false;
  }

  return true;
},
 
editExpense(expense) {
  if (!expense?.id) {
    console.error('Cannot edit - invalid expense:', expense);
    this.showExpenseSuccessMessage('Cannot edit this expense');
    return;
  }
  
  this.editId = expense.id;
  this.expenseType = expense.expense_type || '';
  this.customExpenseType = this.expenseType === 'Other' ? expense.expense_type : '';
  this.itemName = expense.item_name || '';
  this.itemPrice = expense.item_price || '';
  this.action = 'edit'; // Make sure this is set

  console.log('Editing expense ID:', this.editId);
},
 
     async deleteExpenseHandler(id) {
       if (!confirm('Are you sure you want to delete this expense?')) return;
 
       const result = await this.deleteExpense(id);
       if (result.success) {
         this.showExpenseSuccessMessage('Expense deleted successfully!');
       } else {
         this.showExpenseSuccessMessage(result.message || 'Failed to delete expense');
       }
     },

     handleError(error) {
    console.error('Component error:', error);
    this.error = error.message || 'An unexpected error occurred';
  },
  resetError() {
    this.error = null;
    this.mounted(); // Retry initialization
  },
     
     resetForm() {
       this.expenseType = '';
       this.customExpenseType = '';
       this.itemName = '';
       this.itemPrice = '';
       this.editId = null;
       this.action = 'add';
     },
 
     showBudgetSuccessMessage(message) {
       if (this.budgetSuccessTimeout) {
         clearTimeout(this.budgetSuccessTimeout);
       }
       
       this.budgetHideMessage = false;
       this.budgetSuccessMessage = message;
       
       this.budgetSuccessTimeout = setTimeout(() => {
         this.budgetHideMessage = true;
         setTimeout(() => {
           this.budgetSuccessMessage = '';
         }, 500);
       }, 2500);
     },
     
     showExpenseSuccessMessage(message) {
  // Clear any existing timeout
  if (this.expenseSuccessTimeout) {
    clearTimeout(this.expenseSuccessTimeout);
    this.expenseSuccessTimeout = null;
  }
  
  this.expenseHideMessage = false;
  this.expenseSuccessMessage = message;
  
  this.expenseSuccessTimeout = setTimeout(() => {
    this.expenseHideMessage = true;
    this.expenseSuccessTimeout = setTimeout(() => {
      this.expenseSuccessMessage = '';
      this.expenseSuccessTimeout = null;
    }, 500);
  }, 2500);
},
 
     getCurrentBudgetId() {
       return this.getCurrentBudget ? this.getCurrentBudget.id : null;
     }
   }
 };
 </script>

 
<style scoped>
.predicting-text {
  color: #555;
  font-style: italic;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: block;
  margin-top: 2px;
  opacity: 0.85;
}

.prediction-feedback {
  margin-top: 10px;
  padding: 5px;
  background: linear-gradient(to right, #fafafa, #f0f0f0);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
}

.feedback-btn {
  margin-right: 8px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease, transform 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.feedback-btn.correct {
  background: #4CAF50;
  color: white;
}

.feedback-btn.correct:hover {
  background: #45a049;
  transform: scale(1.05);
}

.feedback-btn.incorrect {
  background: #f44336;
  color: white;
}

.feedback-btn.incorrect:hover {
  background: #e53935;
  transform: scale(1.05);
}


.budget-alert {
  position: fixed;
  top: 290px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 20px 30px; /* Increased padding */
  min-width: 350px;    /* Optional: ensures a wider box */
  color: #c62828;
  font-weight: bold;
  font-size: 1.2em;    /* Increased font size */
  z-index: 1000;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 1.5em; /* Increased icon size */
}

.dismiss-btn {
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.8em; /* Bigger button */
  cursor: pointer;
  margin-left: 20px;
  padding: 0 8px;
}

.dismiss-btn:hover {
  color: #b71c1c;
}


@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
} /*NEWWWWWWWWWWWW */
.main-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
}

.top-row {
  margin-top: 100px;
  display: flex;
  gap: 20px;
  width: 100%;
} 

/* Budget Container Styles */
.budget-container {
  width: 30%;
  background-color: #4a7c59; 
  padding: 25px;
  border-radius: 15px;
  border: 2px solid #2e4e38;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  height: auto;
  color: white;
}

.budget-header {
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.budget-header h3 {
  color: white;
  font-size: 1.5rem;
  margin-right: 16px;
}

.budget-content {
  width: 100%;
}

.add-budget-btn, .edit-budget-btn {
  background: #2a4935;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 72px;
  font-size: 14px;
  margin-left: 5px;
}


.add-budget-btn:hover, .edit-budget-btn:hover {
  background: #12301f;
  transform: translateY(-2px);
}

.budget-display {
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.budget-month-row, .budget-amount-row {
  flex-wrap: wrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-weight: 500;
  font-size: 1rem;
}
.budget-month, .budget-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.budget-amount {
  color: #ffea00; 
}

.budget-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
}

.budget-form .form-group {
  display: flex;
  align-items: center;
}

.budget-form label {
  min-width: 100px;
}

.budget-form input, .budget-form select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
}

.budget-form-buttons {
  display: flex;
  flex-wrap: wrap; /* allows buttons to wrap on small screens */
  gap: 12px;        /* space between buttons */
  justify-content: center; /* or 'center' if you prefer */
  box-sizing: border-box;
  margin-top: 20px;
  width: 100%;
}

.budget-btn {
  padding: 12px 0;
  background-color: #2a4935;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  flex: 1;
}

.budget-btn:hover {
  background-color: #12301f;
  transform: translateY(-2px);
}

.cancel-btn {
  background-color: #6c757d;
}

.cancel-btn:hover {
  background-color: #4b5256;
}

.budget-success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
}

.expense-success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
} /* for expenses*/

.budget-success-message.hide,
.expense-success-message.hide {
  opacity: 0;
}


.uneditable-month {
  display: inline-block;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-weight: bold;
  min-width: 100px;
}
 
 .content-wrapper {
  align-content: center;
  width: 70%;
  background-color: #85cf9d;
  border: 2px solid #365c42;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  height: auto;
}

.expenses-container {
  max-width: 100%; 
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  border: 2px solid #85cf9d;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  margin-top: 30px;
}
 

 .expense-form {
  text-align: center;
  width: 100%; 
}  
 

.expenses-section {
  margin-top: 10px; 
}

.expenses-section h3 {
  margin-top: 10px;
  margin-bottom: 25px; 
  color: #333;
  font-size: 1.5rem; 
  padding-bottom: 10px;
  border-bottom: 2px solid #eee; 
} 

.expenses-table {
  overflow-x: auto;
  margin: 30px 0; 
}  

table {
  width: 100%;
  border-collapse: separate; 
  border-spacing: 0 10px; 
  margin-bottom: 30px; 
}  

th, td {
  padding: 6px 20px; 
  text-align: center;
  border-bottom: 2px solid #ddd;
  color: #333;
} 

th {
  background-color: #f8f9fa;
  font-weight: 600;
  font-size: 1rem; 
  padding: 12px 20px; 
} 

tr {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
  margin-bottom: 15px; 
}

tr:hover {
  background-color: #f5f5f5;
  transform: translateY(-2px); 
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
  transition: all 0.2s ease; 
} 

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
} 

.edit-btn, .delete-btn {
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  color: white;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.edit-btn {
  background-color: #2196F3;
}


.delete-btn {
  background-color: #f44336;
}


.edit-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
  

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
  }
  
  &:hover::after {
    animation: ripple 0.6s ease-out;
  }
}

.delete-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
  

  animation: pulse 0.5s ease-in-out;
}


@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}


@keyframes pulse {
  0% {
    transform: translateY(-2px) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.05);
  }
  100% {
    transform: translateY(-2px) scale(1);
  }
}


.edit-btn:active, .delete-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.total {
     font-size: 20px;
     font-weight: bold;
     color: #333;
     padding: 20px;
     background-color: white;
     box-sizing: border-box;
     box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
     text-align: center;
     max-width: 1300px;
     width: 100%;
     position: relative; 
     bottom: 0;   
}

 
 .form-group {
     margin-bottom: 20px;
     margin-top: 20px;
 }
 
 label {
     margin-left: 10px;
     text-align: left;
     display: block;
     margin-bottom: 5px;
     font-size: 17px;
     color: black;
 }
 
 input[type="text"],
 input[type="number"],
 select {
     width: 100%;
     max-width: 800px;
     padding: 10px;
     font-size: 16px;
     border-radius: 10px;
     border: 3px solid #ddd;
     border-color: #2a4935;
     box-sizing: border-box;
     min-height: 35px;
 }
 
 .btn {
     padding: 12px 50px;
     background-color: #2a4935;
     box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
     color: white;
     border: none;
     border-radius: 12px;
     cursor: pointer;
     font-size: 15px;
     transition: background-color 0.3s, color 0.3s; /* Smooth effect */
}

.btn:hover {
    background-color: #12301f; /* Change to any color you want */
    color: white; /* Text color on hover */
    transform: translateY(-2px);
}

.btn1 {
    padding: 12px 50px;
    background-color: white;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
    color: black;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 15px;
    margin-top: 10px; /* Add vertical spacing instead */
    margin-left: 430px;
    transition: background-color 0.3s, color 0.3s;
}

.btn1:hover {
    background-color: rgb(26, 25, 25); /* Change to any color you want */
    color: white; /* Text color on hover */
}

/* RESPONSIVE DESIGN */

@media screen and (max-width: 1000px) {
    .container {
        margin: 20px 0px 0px 30px;
        padding: 15px;
        height: 500px;
    }

    .expense-form{
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .add-budget-btn, .edit-budget-btn {
      margin-bottom: 10px;
    }

    .content-wrapper {
        padding: 0px;
    }

    input[type="text"],
    input[type="number"],
    select {
        width: 90%;
        max-width: 600px;
        font-size: 15px;
    }

    .h3{
      font-size: 20px;
      font-weight: bold;
      margin-top: 30px;
      color: white;
    }

    .expenses-container{
        width: 100%;
        max-width: 1000px;
    }
}

</style>
