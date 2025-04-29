<template>
  <navigation/>

  <div class="con">
    <div class="nav-con">
          <h1>Personal Expenses</h1>
    </div>
    <div class="con-container">
    <!-- Navigation Buttons (centered) -->
    <!-- Content Based on the Current View -->
    <div v-if="currentView === 'view'" class="budget-section">
      <div class="content-wrapper">
        <!-- Filter Buttons -->
        <div class="filter-buttons">
          <form @submit.prevent>
          <button @click="filterExpenses('Food')" :class="{ active: filterCategory === 'Food' }">Food</button>
          <button @click="filterExpenses('Bill')" :class="{ active: filterCategory === 'Bill' }">Bill</button>
          <button @click="filterExpenses('Transportation')" :class="{ active: filterCategory === 'Transportation' }">Transportation</button>
          <button @click="filterExpenses('Entertainment')" :class="{ active: filterCategory === 'Entertainment' }">Entertainment</button>
          <button @click="filterExpenses('Healthcare')" :class="{ active: filterCategory === 'Healthcare' }">Healthcare</button>
          <button @click="filterExpenses('Personal Care')" :class="{ active: filterCategory === 'Personal Care' }">Personal Care</button>
          <button @click="filterExpenses('Shopping')" :class="{ active: filterCategory === 'Shopping' }">Shopping</button>
          <button @click="filterExpenses('Other')" :class="{ active: filterCategory === 'Other' }">Other</button>
          <button @click="filterExpenses('all')" :class="{ active: filterCategory === 'all' }">View All</button>
            <input type="month" v-model="filterMonth" />
            <button @click="filterExpensesByMonth" title="Search">
                <i class="fa fa-search"></i>
            </button>
          </form>
        </div>

        <!-- Expense Table -->
        <div class="expense-table">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(expense, index) in filteredExpenses" :key="expense.id" :class="{'alternate-row': index % 2 !== 0}">
                <td>{{ expense.category }}</td>
                <td>{{ expense.name }}</td>
                <td>{{ formatCurrency(expense.amount) }}</td> <!-- Use formatCurrency method here -->
                <td>{{ expense.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Display Total Amount -->
        <div class="total-amount">
          <p>Total: {{ formatCurrency(totalAmount) }}</p>
        </div>
      </div>
    </div>
  </div>
  <div class="chart-summary">
        <div class="chart">
          <pie-chart :data="chartData" 
          :options="chartOptions" 
          style="height: 200px;"/>
        
          <!-- Year and Month Picker for PDF generation -->
          <div class="download">
          <select v-model="selectedYear">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>

          <select v-model="selectedMonth">
            <option v-for="month in availableMonths" :key="month.value" :value="month.value">{{ month.label }}</option>
          </select>

          <button class="download-button" @click="generatePDF">Download Report</button>
        </div>
      </div>

      <div class="summary-box">
    <h3>Budget Summary</h3>
    <div class="summary-item">
      <span>Budget:</span>
      <span>{{ formatCurrency(currentBudget?.budget_amount || 0) }}</span>
    </div>
    <div class="summary-item">
      <span>Spent:</span>
      <span>{{ formatCurrency(totalAmount) }}</span>
    </div>
    <div class="summary-item remaining">
      <span>Remaining:</span>
      <span :class="{ 'negative': remainingBudget < 0 }">
        {{ formatCurrency(remainingBudget) }}
      </span>
    </div>
    <div class="progress-bar">
      <div class="progress" :style="{ width: budgetPercentage + '%' }"></div>
    </div>
    <div class="percentage">{{ budgetPercentage.toFixed(0) }}%</div>
  </div>
  <div v-if="isBudgetExceeded" class="exceeded-warning">
    ⚠️ Budget exceeded by {{ formatCurrency(totalAmount - currentBudget.budget_amount) }}
  </div>
</div>
</div>

</template>


<script>
import Navigation from "./navigation.vue"; 
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js';
import jsPDF from 'jspdf'; // Import jsPDF
import { mapGetters, mapActions } from 'vuex';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale);

export default {
components: {
  Navigation,
  PieChart: Pie,
},
data() {
  return {
    currentView: 'view', 
    filterCategory: 'all', 
    filterMonth: '', 
    wasBudgetExceeded: false,
    selectedYear: new Date().getFullYear().toString(), 
    selectedMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return tooltipItem.label + ': ₱' + tooltipItem.raw.toFixed(2);
              },
            },
          },
        },
      },
    };
  },

computed: {
  ...mapGetters(['getExpenses', 'getPersonalBudgets']),
  expenses() {
    
      return this.getExpenses.map(expense => ({
        ...expense,
        category: expense.expense_type,
        name: expense.item_name,
        amount: Number(expense.item_price),
        date: this.formatDateForView(expense.created_at || expense.date)
      }));
    },
    
    chartData() {
      const categoryCounts = {
        Food: 0,
        Bill: 0,
        Transportation: 0,
        Entertainment: 0,
        Healthcare: 0,
        'Personal Care': 0,
        Shopping: 0,
        Other: 0,
      };

      this.filteredExpenses.forEach(expense => {
        if (expense.category in categoryCounts) {
          categoryCounts[expense.category] += expense.amount;
        } else {
          categoryCounts.Other += expense.amount;
        }
      });

      return {
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Expense Categories',
          data: Object.values(categoryCounts),
          backgroundColor: [
            '#90fefb', '#febee9', '#aefda3', '#f5fda3', 
            '#ecbefe', '#fefdad', '#feadad', '#adb5fe'
          ],
          borderColor: [
            '#90fefb', '#febee9', '#aefda3', '#f5fda3', 
            '#ecbefe', '#fefdad', '#feadad', '#adb5fe'
          ],
          borderWidth: 1,
        }]
      };
    },

    availableYears() {
      const years = new Set();
      this.expenses.forEach(expense => {
        if (expense.date) {
          const year = expense.date.split('-')[0];
          years.add(year);
        }
      });
      return Array.from(years).sort().reverse();
    },
    
    availableMonths() {
      return [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
      ];
    },

    filteredExpenses() {
      return this.expenses.filter(expense => {
        const categoryMatch = this.filterCategory === 'all' || expense.category === this.filterCategory;
        const monthMatch = !this.filterMonth || (expense.date && expense.date.startsWith(this.filterMonth));
        return categoryMatch && monthMatch;
      });
    },

    totalAmount() {
      return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    },

    currentBudget() {
    if (!this.getPersonalBudgets || this.getPersonalBudgets.length === 0) return null;
    const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return this.getPersonalBudgets.find(
      b => b.month_year === currentMonthYear
    ) || { budget_amount: 0 };
  },
  
  remainingBudget() {
    if (!this.currentBudget) return 0;
    return this.currentBudget.budget_amount - this.totalAmount;
  },

  budgetPercentage() {
  if (!this.currentBudget || this.currentBudget.budget_amount <= 0) return 0;
  return Math.min(100, (this.totalAmount / this.currentBudget.budget_amount) * 100);
},

isBudgetExceeded() {
  if (!this.currentBudget?.budget_amount) return false;
  return this.totalAmount > this.currentBudget.budget_amount;
}, // newwwwwwwwwwwww

watch: {
  totalAmount(newVal) {
    if (this.isBudgetExceeded) {
      this.$notify({
        title: 'Budget Exceeded',
        text: 'You have exceeded your monthly budget!',
        type: 'warning',
        duration: 0 // 0 means it won't auto-close
      });
    }
  },
  currentBudget: {
    deep: true,
    handler() {
      if (this.isBudgetExceeded) {
        this.$notify({
          title: 'Budget Exceeded',
          text: 'You have exceeded your monthly budget!',
          type: 'warning',
          duration: 0
        });
      }
    }
  }
}
}, //newwwwwwwwwwww

  created() {
    this.fetchExpenses();
    this.fetchPersonalBudgets();
  },
  
  methods: {
    ...mapActions(['fetchExpenses', 'fetchPersonalBudgets']),
    
    filterExpenses(category) {
      this.filterCategory = category;
    },
    
    filterExpensesByDate() {
      this.filterCategory = 'all';
    },
    
    formatCurrency(value) {
      if (value == null || isNaN(value)) return '₱0.00';
      return '₱' + parseFloat(value).toFixed(2);
    },
    
    formatDateForView(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    showBudgetWarning() {
    this.$notify({
      title: 'Budget Exceeded',
      text: `Current spending: ${this.formatCurrency(this.totalAmount)}\nBudget: ${this.formatCurrency(this.currentBudget?.budget_amount)}`,
      type: 'error',
      duration: 0
    });
  }
},

async generatePDF() {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Title section
    doc.setFontSize(18);
    doc.text('Expense Report', 105, 20, { align: 'center' });
    
    // Period info
    doc.setFontSize(12);
    const monthName = this.availableMonths.find(m => m.value === this.selectedMonth)?.label || '';
    doc.text(`Period: ${monthName} ${this.selectedYear}`, 105, 30, { align: 'center' });
    
    // Budget summary
    doc.text(`Budget: ${this.formatCurrency(this.currentBudget?.budget_amount || 0)}`, 20, 40);
    doc.text(`Total Expenses: ${this.formatCurrency(this.totalAmount)}`, 105, 40, { align: 'center' });
    doc.text(`Remaining: ${this.formatCurrency(this.remainingBudget)}`, 180, 40, { align: 'right' });
    
    // Expenses table header
    let yOffset = 60;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Date', 20, yOffset);
    doc.text('Category', 60, yOffset);
    doc.text('Description', 100, yOffset);
    doc.text('Amount', 180, yOffset, { align: 'right' });
    yOffset += 7;
    
    // Table line
    doc.line(20, yOffset, 190, yOffset);
    yOffset += 10;
    doc.setFont(undefined, 'normal');
    
    // Filter expenses for selected period
    const filteredForPDF = this.expenses.filter(expense => {
      return expense.date && expense.date.startsWith(`${this.selectedYear}-${this.selectedMonth}`);
    });
    
    // Add expenses to PDF
    filteredForPDF.forEach((expense) => {
      // Check if we need a new page
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }
      
      doc.text(expense.date, 20, yOffset);
      doc.text(expense.category, 60, yOffset);
      doc.text(expense.name.substring(0, 30), 100, yOffset); // Limit description length
      doc.text(this.formatCurrency(expense.amount), 180, yOffset, { align: 'right' });
      yOffset += 10;
    });
    
    // Add chart if available
    try {
      await this.$nextTick();
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas) {
        // Add new page for chart
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Expense Breakdown', 105, 20, { align: 'center' });
        
        // Convert canvas to image
        const chartImage = await new Promise((resolve) => {
          setTimeout(() => {
            resolve(chartCanvas.toDataURL('image/png'));
          }, 500); // Small delay to ensure chart renders
        });
        
        // Add chart image
        doc.addImage(chartImage, 'PNG', 30, 30, 150, 150);
      }
    } catch (chartError) {
      console.error('Error adding chart:', chartError);
    }
    
    // Save PDF
    doc.save(`expense-report-${this.selectedYear}-${this.selectedMonth}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}
}
</script>



<style scoped>
.text-danger {
  color: #ffffff; /* white text for contrast */
  font-weight: bold;
  font-size: 25px;
}

.exceeded-warning {
  background-color: #e53935; /* Strong red shade */
  border-left: 4px solid #b71c1c;
  padding: 8px 10px;
  margin: 10px auto; /* Center horizontally */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center; /* Center content horizontally */
  gap: 10px;
  color: #ffffff;
  font-size: 18px; /* Bigger text */
  max-width: 400px; /* Prevent it from stretching too wide */
  text-align: center;
}

.summary-box {
  padding: 2px 16px 6px 16px; 
  background-color: #99da99;
  border: 2px solid #1e3731;
  border-radius: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  font-size: 16px;
  margin: 2px 0 6px 0; /* Liit ang top margin to 2px */
  text-align: center;
  color: #000000;
  min-width: 280px;
  max-width: 100%;
}

.progress-bar {
  width: 100%;
  height: 9px; /* Smaller progress bar height */
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 7px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.progress-bar .progress {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.percentage {
  text-align: right;
  font-size: 13px; /* Reduced font size */
  margin-top: 2px;
  color: #555;
  font-weight: bold;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 16px; /* Smaller font */
  font-weight: bold;
}

.summary-item.remaining {
  padding-top: 5px;
  border-top: 1px solid #eee;
  margin-top: 8px;
}

.negative {
  color: #e74c3c;
  font-weight: 500;
}

.con {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap; /* Optional: stack on small screens */
  gap: 10px;
}

.nav-con {
font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
font-size: 20px;
position: relative;
margin-top: 120px;
display: flex;
justify-content: center;
margin-bottom: -10px;
width: 100%;
}


button {
  border-radius: 8px;
  padding: 12px 20px;
  position: relative;
  font-size: 20px;
  border: 2px solid #386233;
  background-color: #fffef5;
  cursor: pointer;
  transition: 0.3s ease;
}

button.active {
  background-color: #2a4935;
  color: white;
}

button:hover {
  background-color: #2a4935;
  color: white;
}

.budget-section {
  text-align: center;
  margin-top: 20px;
  min-height: 654px;
}

.budget-section h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.budget-section p {
  font-size: 24px;
  color: red;
}

.con-container {
  background: rgb(216, 248, 216);
  border: 2px solid #336333;
  border-radius: 20px;
  width: 70%; 
  min-width: 380px;
  max-width: 900px; /* Optional: keep for responsiveness */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  align-items: flex-start;
  margin-bottom: 10px;
}

/* Filter Buttons Styling */
.filter-buttons button {
  position: relative;
  padding: 8px;
  margin: 3px;
  border-radius: 1px;
  background-color: #ffffff;
  border: 2px solid #336333;
  transition: all 0.3s ease;
  font-size: 15px;
  border-radius: 6px;
}

.filter-buttons button.active {
  background-color: #2a4935;
  color: white;
  border-color: #2a4935;
}

.filter-buttons button:hover {
  background-color: #2a4935;
}

/* Expense Table Styling */
.expense-table table {
  position: relative;
  width: 90%;
  justify-self: center;
  margin-top: 20px;
  border-collapse: collapse;
  table-layout: fixed;
}

.expense-table th, .expense-table td {
  padding: 12px;
  text-align: left;
  border: 1px solid #000000;
  vertical-align: top;
  word-break: break-word; 
}

.expense-table th {
  background-color: #2a4935;
  color: white;
}

.expense-table tr {
  background-color: white;
}

/* Alternate Row Color */
.expense-table tr.alternate-row {
  background-color: #fffef5;
}

/* Total Amount Styling */
.total-amount {
  margin-top: 20px;
  font-weight: bold;
}

.chart{
  width: 380px;
  padding: 20px;
  box-sizing: border-box;
  background: #ecfcec;
  border-radius: 20px;
  max-height: 600px;
  border: 2px solid #336333;
  margin-bottom: 10px;
}

.download{
  display: flex;
  flex-wrap: wrap;
  justify-content: center; 
  align-items: center; 
  margin-top: 10px;
}

.download-button {
display: flex;
flex-wrap: wrap;
padding: 10px 20px;
font-size: 16px;
background-color: #2a4935;
color: white;
border: none;
cursor: pointer;
align-self: center;
margin-bottom: 10px;
margin-left: 3px;
}

.download-button:hover {
background-color: #1e3731;
}

</style> 
