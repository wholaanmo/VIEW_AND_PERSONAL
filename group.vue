 <script>
import Navigation from "./navigation.vue"; 
 
 export default {
    props: {
    groupId: {
      type: [String, Number],
      required: true,
      validator: value => {
        // Ensure the ID is valid
        return !isNaN(Number(value)) || typeof value === 'string';
      }
    }
  },
   components: { Navigation },
   data() {
     return {
       MemberName: '',
       expenseType: '',
       customExpenseType: '',
       itemName: '',
       itemPrice: '',
       successMessage: '',
       editId: null,
       action: 'add',
       expenses: [],
       currentGroup: null,
       currentUserRole: null,
       showInviteDialog: false
     };
   },
   computed: {
     totalAmount() {
       return this.expenses.reduce((sum, expense) => sum + expense.price, 0);
     }
   },
   
   async created() {
    try {

      const token = localStorage.getItem('jsontoken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    if (!this.groupId) {
      throw new Error('Missing group ID');
    }

    console.log('Loading group data for ID:', this.groupId);
        const response = await this.$axios.get(`/api/grp_expenses/${this.groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load group data');
    }

    this.currentGroup = response.data.data;
    await this.fetchGroupData();
    
  } catch (err) {
    console.error('Group initialization error:', err);
    this.handleGroupError(err);
  }
},

   methods: {
    handleGroupError(err) {
    if (err.response?.status === 401) {
      this.$notify.error({
        title: 'Session Expired',
        message: 'Please login again'
      });
      localStorage.removeItem('jsontoken');
      this.$router.push('/login');
    } else if (err.response?.status === 403) {
      this.$notify.error({
        title: 'Access Denied',
        message: 'You dont have permission to view this group'
      });
      this.$router.push('/GC');
    } else if (err.response?.status === 404) {
      this.$notify.error({
        title: 'Not Found',
        message: 'Group does not exist'
      });
      this.$router.push('/GC');
    } else {
      this.$notify.error({
        title: 'Error',
        message: err.message || 'Failed to load group data'
      });
    }
  },
  
    checkExpenseType() {
       if (this.expenseType === "Other") this.customExpenseType = "";
     },
     handleSubmit() { /* Logic here */ },

    async fetchGroupData() {
      try {
        const response = await this.$axios.get('/api/grp_expenses/current');
        this.currentGroup = response.data.group;
        this.currentUserRole = response.data.role;
      } catch (err) {
        console.error("Failed to fetch group data:", err);
      }
    },
    
    async deleteGroup() {
      if (confirm("Are you sure you want to delete this group?")) {
        try {
          await this.$axios.delete(`/api/grp_expenses/${this.currentGroup.id}`);
          this.$router.push('/GC'); // or this.$router.push('/groups');
        } catch (err) {
          console.error("Failed to delete group:", err);
        }
      }
    }
  }
};
 </script>
