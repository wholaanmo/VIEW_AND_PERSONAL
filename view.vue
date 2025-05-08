<template>
  <navigation/>

  <div class="con">
    <div class="nav-con">
          <h1>Personal Expenses</h1>
    </div>
    <div class="con-container">

    <div v-if="currentView === 'view'" class="budget-section">
      <div class="content-wrapper">
        <div class="view-toggle">
            <button @click="toggleYearFilter" class="toggle-button">
              {{ showYearFilter ? 'Switch to Month View' : 'Switch to Year View' }}
            </button>
          </div>

          <!-- Modified month/year selector section -->
          <div v-if="!showYearFilter" class="month-year-selector">
            <div class="year-selector">
              <label for="year">Year:</label>
              <select id="year" v-model="selectedYear" @change="updateSelectedMonthYear">
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            
            <div class="month-buttons">
              <button 
                v-for="month in availableMonths" 
                :key="month.value"
                @click="selectMonth(month.value)"
                :class="{ active: selectedMonth === month.value }"
              >
                {{ month.label.substring(0, 3) }}
              </button>
            </div>
          </div>

          <div v-if="showYearFilter" class="year-only-selector">
            <div class="year-selector">
              <label for="year-filter">YEAR:</label>
              <select id="year-filter" v-model="yearFilter" @change="updateExpenseView">
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>

        <!-- Filter Buttons -->
        <div class="filter-buttons">
          <button @click="filterExpenses('Food')" :class="{ active: filterCategory === 'Food' }">Food</button>
          <button @click="filterExpenses('Bill')" :class="{ active: filterCategory === 'Bill' }">Bill</button>
          <button @click="filterExpenses('Transportation')" :class="{ active: filterCategory === 'Transportation' }">Transportation</button>
          <button @click="filterExpenses('Entertainment')" :class="{ active: filterCategory === 'Entertainment' }">Entertainment</button>
          <button @click="filterExpenses('Healthcare')" :class="{ active: filterCategory === 'Healthcare' }">Healthcare</button>
          <button @click="filterExpenses('Shopping')" :class="{ active: filterCategory === 'Shopping' }">Shopping</button>
          <button @click="filterExpenses('Other')" :class="{ active: filterCategory === 'Other' }">Other</button>
          <button @click="filterExpenses('all')" :class="{ active: filterCategory === 'all' }">View All</button>
        </div>

        <!-- Expense Table -->
        <div class="expense-table">
            <h3 v-if="!showYearFilter">Expenses for {{ availableMonths.find(m => m.value === selectedMonth)?.label }} {{ selectedYear }}</h3>
            <h3 v-else>Expenses for {{ yearFilter }}</h3>
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
      <tr v-if="filteredExpenses.length === 0">
        <td colspan="4" class="no-expenses-message">
          NO EXPENSES
        </td>
      </tr>
      <tr 
        v-for="(expense, index) in filteredExpenses" 
        v-else
        :key="expense.id" 
        :class="{'alternate-row': index % 2 !== 0}"
      >
        <td>{{ expense.category }}</td>
        <td>{{ expense.name }}</td>
        <td>{{ formatCurrency(expense.amount) }}</td>
        <td>{{ expense.date }}</td>
      </tr>
    </tbody>
          </table>
        </div>

        <!-- Display Total Amount -->
        <div class="total-amount">
          <p>Total: {{ formatCurrency(totalAmount) }} ({{ formatUsd(totalAmount) }})</p>
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

      <div v-if="showYearFilter" class="summary-box">
  <h3>Annual Summary for {{ yearFilter }}</h3>
    <div class="summary-item">
      <span>Total Budget:</span>
      <span>{{ formatCurrency(yearlyBudgetsTotal) }}</span>
    </div>
    
    <div class="summary-item">
      <span>Total Expenses:</span>
      <span>{{ formatCurrency(yearlyExpensesTotal) }}</span>
    </div>
    
    <div class="summary-item remaining">
      <span>Remaining:</span>
      <span :class="{ 'negative': yearlyRemainingBudget < 0 }">
        {{ formatCurrency(yearlyRemainingBudget) }}
      </span>
    </div>

  <div class="progress-bar">
      <div class="progress" :style="{ width: yearlyBudgetPercentage + '%' }"></div>
    </div>
    <div class="percentage">{{ yearlyBudgetPercentage.toFixed(0) }}%</div>
  </div>


      <div v-else class="summary-box">
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
  </div>


<div v-if="isBudgetExceeded && !showYearFilter" class="exceeded-warning">
  ⚠️ Monthly budget exceeded by {{ formatCurrency(totalAmount - currentBudget.budget_amount) }}
</div>

<div v-if="isYearlyBudgetExceeded && showYearFilter" class="exceeded-warning">
  ⚠️ Annual budget exceeded by {{ formatCurrency(yearlyExpensesTotal - yearlyBudgetsTotal) }}
</div>
</div>
</template>


<script>
import Navigation from "./navigation.vue"; 
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mapGetters, mapActions } from 'vuex';

ChartJS.register(
  Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, 
  ChartDataLabels 
);

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
      yearFilter: null, // Add this for year-only filtering
      showYearFilter: false,
      chartOptions: {
        responsive: true,
        plugins: {
          datalabels: {
            formatter: (value, context) => {
              const dataset = context.chart.data.datasets[0].data;
              const total = dataset.reduce((sum, val) => sum + val, 0);
              if (value > 0) {
                return (value / total * 100).toFixed(1) + '%';
              }
              return null; // This will hide the label for zero values
            },
            color: '#000',
            font: {
              weight: 'bold',
              size: 12
            },
            anchor: 'center',
            align: 'center',
            offset: 0,
            padding: 0
          },
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
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const month = this.availableMonths[index];
            this.selectMonth(month.value);
          }
        }
      },
    };
  },

  computed: {
    ...mapGetters(['getViewExpenses', 'getPersonalBudgets', 'getViewPageMonthYear']),
    yearlyExpensesTotal() {
    if (!this.showYearFilter || !this.yearFilter) return 0;
    return this.getViewExpenses.reduce((sum, expense) => {
      return sum + (Number(expense.item_price) || 0);
    }, 0);
  },

  // Calculate sum of all monthly budgets for the year
  yearlyBudgetsTotal() {
    if (!this.showYearFilter || !this.yearFilter) return 0;
    return this.getPersonalBudgets.reduce((sum, budget) => {
      if (budget.month_year && budget.month_year.startsWith(this.yearFilter)) {
        return sum + (Number(budget.budget_amount) || 0);
      }
      return sum;
    }, 0);
  },

  // Calculate remaining budget for the year
  yearlyRemainingBudget() {
    return this.yearlyBudgetsTotal - this.yearlyExpensesTotal;
  },

  // Calculate budget percentage for the year
  yearlyBudgetPercentage() {
    if (!this.yearlyBudgetsTotal) return 0;
    return Math.min(100, (this.yearlyExpensesTotal / this.yearlyBudgetsTotal) * 100);
  },

  // Check if yearly budget is exceeded
  isYearlyBudgetExceeded() {
    return this.yearlyExpensesTotal > this.yearlyBudgetsTotal;
  },

    availableYears() {
  const years = new Set();
  this.getViewExpenses.forEach(expense => {
    if (expense.expense_date) {
      years.add(new Date(expense.expense_date).getFullYear());
    }
  });
  this.getPersonalBudgets.forEach(budget => {
    if (budget.month_year) {
      years.add(parseInt(budget.month_year.split('-')[0]));
    }
  });
  return Array.from(years).sort((a, b) => b - a); // Descending order
},

    usdExchangeRate() {
      return this.$store.state.usdExchangeRate || 0.018045;
    },

   selectedMonthYear: {
    get() {
      return this.$store.state.viewPageMonthYear;
    },
    set(value) {
      this.$store.commit('SET_VIEW_PAGE_MONTH_YEAR', value);
    }
  },

    expenses() {   
      return (this.getViewExpenses || []).map(expense => ({
        ...expense,
        category: expense.expense_type,
        name: expense.item_name,
        amount: Number(expense.item_price),
        date: this.formatDateForView(expense.expense_date)
      }));
    },
    
    chartData() {
      const categoryCounts = {
        Food: 0,
        Bill: 0,
        Transportation: 0,
        Entertainment: 0,
        Healthcare: 0,
        Shopping: 0,
        Other: 0,
      };

      this.filteredExpenses.forEach(expense => {
        const category = expense.category === 'HealthCare' ? 'Healthcare' : expense.category; // Normalize category name
        if (category in categoryCounts) {
          categoryCounts[category] += expense.amount;
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
            '#c5fdfa', '#febee9', '#c9d1fd', '#f5fda3', 
            '#ecbefe', '#c7fbc5', '#feadad', '#adb5fe'
          ],
          borderColor: [
            '#a0f0eb', '#fba9dc', '#a9b3f0', '#e3f484', 
            '#d3a9f5', '#a9e9a7', '#f98b8b', '#8f9ff0'  
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
  let expenses = this.getViewExpenses || [];
  
  // Apply year filter if enabled
  if (this.showYearFilter && this.yearFilter) {
    expenses = expenses.filter(expense => {
      if (!expense.expense_date) return false;
      return new Date(expense.expense_date).getFullYear() == this.yearFilter;
    });
  } 
  // Apply month filter if not in year view
  else {
    const currentBudget = this.$store.getters.getCurrentBudget(
      `${this.selectedYear}-${this.selectedMonth}`
    );
    
    if (!currentBudget?.id) return [];
    
    expenses = expenses.filter(expense => 
      expense.personal_budget_id === currentBudget.id
    );
  }

  // Apply category filter
  if (this.filterCategory && this.filterCategory !== 'all') {
    expenses = expenses.filter(expense => 
      expense.expense_type.toLowerCase() === this.filterCategory.toLowerCase()
    );
  }

  return expenses.map(expense => ({
    ...expense,
    category: expense.expense_type,
    name: expense.item_name,
    amount: Number(expense.item_price),
    date: this.formatDateForView(expense.expense_date)
  }));
},

toggleYearFilter() {
  this.showYearFilter = !this.showYearFilter;
  this.updateExpenseView();
},

updateExpenseView() {
  if (this.showYearFilter) {
    this.$store.dispatch('fetchViewExpenses', { year: this.yearFilter });
  } else {
    const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
    this.$store.dispatch('fetchViewExpenses', { monthYear });
  }
},

  currentBudget() {
    const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
    return this.$store.getters.getCurrentBudget(monthYear) || {
      month_year: monthYear,
      budget_amount: 0
    };
  },

    totalAmount() {
      return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    },

    currentBudget() {
  const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
  return this.$store.getters.getCurrentBudget(monthYear);
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
    }
  },

  watch: {
    selectedMonth(newVal) {
      this.updateSelectedMonthYear();
    },
    selectedYear(newVal) {
      this.updateSelectedMonthYear();
    },
    totalAmount(newVal) {
      if (this.isBudgetExceeded) {
        this.$notify({
          title: 'Budget Exceeded',
          text: 'You have exceeded your monthly budget!',
          type: 'warning',
          duration: 0 
        });
      }
    }
  },

  created() {
    this.fetchViewExpenses();
    this.fetchPersonalBudgets();
    this.fetchExchangeRate();
  },

  methods: {
    ...mapActions(['fetchViewExpenses', 'fetchPersonalBudgets', 'fetchExchangeRate']),
    
    formatUsd(value) {
    const rate = this.$store.state.usdExchangeRate || 0.018045;
    const usdAmount = parseFloat(value) * rate;
    return `$${usdAmount.toFixed(2)}`;
  },

    filterExpenses(category) {
      this.filterCategory = category;
    },

    selectMonth(month) {
      this.selectedMonth = month;
      this.filterCategory = 'all';
    },

    updateSelectedMonthYear() {
  const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
  this.$store.commit('SET_VIEW_PAGE_MONTH_YEAR', monthYear);
  
  this.$store.dispatch('fetchViewExpenses', monthYear)
    .then(() => {
      console.log('Successfully fetched expenses for:', monthYear);
    })
    .catch((error) => {
      console.error('Error fetching expenses:', error);
    });
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
    },

    async generatePDF() {
  try {
    const doc = new jsPDF();
    this.formatCurrency = value => `PHP ${parseFloat(value||0).toFixed(2)}`;
    
    // Title 
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    let periodText;
    if (this.showYearFilter) {
      periodText = `Period: Year ${this.yearFilter}`;
    } else {
      const monthName = this.availableMonths.find(m => m.value === this.selectedMonth)?.label || '';
      periodText = `Period: ${monthName} ${this.selectedYear}`;
    }
      
      // Add category filter info if not 'all'
      if (this.filterCategory && this.filterCategory !== 'all') {
        periodText += ` (${this.filterCategory} only)`;
      }
      
      doc.text(periodText, 105, 30, { align: 'center' });
    
    // Budget summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (this.showYearFilter) {
      // Year view summary
      doc.text(`Total Budget: ${this.formatCurrency(this.yearlyBudgetsTotal)}`, 20, 45);
      doc.text(`Total Expenses: ${this.formatCurrency(this.yearlyExpensesTotal)}`, 165, 45, { align: 'center' });
      doc.text(`Remaining: ${this.formatCurrency(this.yearlyRemainingBudget)}`, 128, 55, { align: 'right' });
    } else {
      // Month view summary
      doc.text(`Budget: ${this.formatCurrency(this.currentBudget?.budget_amount || 0)}`, 20, 45);
      doc.text(`Total Expenses: ${this.formatCurrency(this.totalAmount)}`, 165, 45, { align: 'center' });
      doc.text(`Remaining: ${this.formatCurrency(this.remainingBudget)}`, 128, 55, { align: 'right' });
    }
    
    const pdfExpenses = this.filteredExpenses;
    
    // Prepare table data
    const tableData = pdfExpenses.map(expense => [
      expense.date,
      expense.category,
      expense.name,
      this.formatCurrency(expense.amount)
    ]);
    
    // Add expense table
    autoTable(doc, {
  head: [['Date', 'Category', 'Description', 'Amount']],
  body: tableData,
  startY: 70, 
  margin: { left: 10, right: 10 },
  styles: {
    cellPadding: 4, 
    fontSize: 9,
    halign: 'left',
    valign: 'middle',
    overflow: 'linebreak'
  },
  columnStyles: {
    0: { cellWidth: 60 }, // Date
    1: { cellWidth: 60 }, // Category
    2: { cellWidth: 'auto',},
    3: { cellWidth: 25 } // Amount
  },
  didDrawCell: (data) => {
    if (data.section === 'body' && data.column.index === 2) {
      data.cell.text = doc.splitTextToSize(data.cell.raw, data.cell.width - 4);
    }
  },
  headStyles: {
    fillColor: [76, 175, 80],
    textColor: 255,
    fontStyle: 'bold'
  }
});
    
    // Add chart with percentages
    try {
      await this.$nextTick();
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const chartImage = chartCanvas.toDataURL('image/png');
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Expense Breakdown', 105, 20, { align: 'center' });
        doc.addImage(chartImage, 'PNG', 30, 30, 150, 150);
      }
    } catch (chartError) {
      console.error('Error adding chart:', chartError);
    }
    
    doc.save(`expense-report-${this.selectedYear}-${this.selectedMonth}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    this.$store.commit('SET_GLOBAL_ALERT', {
      message: 'Failed to generate PDF. Please try again.',
      type: 'error'
    });
  }
}
}
};
</script>



<style scoped>
.no-expenses-message {
  justify-content: center;   
  align-items: center;                 
  padding: 20px;
  text-align: center;
  font-style: italic;
  font-size: 23px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 10px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.no-expenses-message {
  animation: fadeIn 0.5s ease-in-out;
}
.view-toggle {
  margin-bottom: 5px;
  text-align: center;
}

.toggle-button {
  background-color: #e6f4ea; /* soft green background */
  color: #2e5940; /* darker green text */
  border: 2px solid #2e5940;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-button:hover {
  background-color: #2e5940;
  color: white;
  transform: translateY(-1px);
}

.year-only-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.year-only-selector .year-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.year-only-selector select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
.month-year-selector {
  margin: 1px 0 0px 0; 
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.year-selector {
  margin-bottom: 5px;
}

.year-selector label {
  margin-right: 10px;
  font-weight: bold;
  font-size: 16px;
}

.year-selector select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 2px solid #336333;
  background-color: white;
  font-size: 15px;
  cursor: pointer;
}

.month-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.month-buttons button {
  padding: 8px;
  margin: 3px;
  border-radius: 6px;
  background-color: #ffffff;
  border: 2px solid #336333;
  transition: all 0.3s ease;
  font-size: 15px;
  cursor: pointer;
}

.month-buttons button:hover {
  background-color: #2a4935;
  color: white;
}

.month-buttons button.active {
  background-color: #2a4935;
  color: white;
  border-color: #2a4935;
}

.text-danger {
  color: #ffffff;
  font-weight: bold;
  font-size: 25px;
}

.exceeded-warning {
  margin-top: 0px !important;
  background-color: #e53935;
  border-left: 6px solid #b71c1c;
  border-right: 6px solid #b71c1c;
  padding: 14px 20px;
  margin: 20px auto; /* vertically space + center horizontally */
  margin-inline: 30px; 
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #ffffff;
  font-size: 20px;
  text-align: center;
  width: 100%; /* avoids overflowing if parent is small */
  box-sizing: border-box;
}



.summary-box {
  padding: 2px 16px 6px 16px; 
  background-color: #99da99;
  border: 2px solid #1e3731;
  border-radius: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  font-size: 16px;
  margin: 2px 0 6px 0; 
  text-align: center;
  color: #000000;
  min-width: 280px;
  max-width: 100%;
}

.progress-bar {
  width: 100%;
  height: 9px;
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
  margin-top: 4px;
  color: #555;
  font-weight: bold;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
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
  max-width: 900px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  align-items: flex-start;
  margin-bottom: 10px;
  overflow-y: auto; /* Enables vertical scrolling when needed */
  max-height: 105vh; /* Limits height to 80% of viewport height */
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: #2a4935 #ecfcec; /* For Firefox */
}

/* For Chrome/Edge/Safari */
.con-container::-webkit-scrollbar {
  width: 8px;
}

.con-container::-webkit-scrollbar-track {
  background: #ecfcec;
  border-radius: 0 20px 20px 0;
}

.con-container::-webkit-scrollbar-thumb {
  background-color: #2a4935;
  border-radius: 20px;
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
  text-align: center;
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
.download {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; 
  align-items: center; 
  margin-top: 10px;
  gap: 10px;
}

.download select {
  width: 100px; /* Smaller width */
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
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
margin-bottom: 8px;
margin-left: 3px;
}

.download-button:hover {
background-color: #1e3731;
}

</style> 
