import axios from 'axios';

function getDefaultState() {
  return {
    currentGroup: {
      group_name: '',
      group_code: '',
      created_at: null,
      created_by: null
    },
    members: [],
    expenses: [],
    loading: false,
    error: null,
    isAdmin: false
  };
}

export default {
    namespaced: true,
    state: getDefaultState(),
    mutations: {
      RESET_STATE(state) {
        Object.assign(state, getDefaultState());
      },
      SET_GROUP(state, group) {
        state.currentGroup = group;
      },
      SET_MEMBERS(state, members) {
        state.members = members;
      },
      SET_EXPENSES(state, expenses) {
        state.expenses = Array.isArray(expenses) ? expenses : [];
      },
      SET_LOADING(state, loading) {
        state.loading = loading;
      },
      SET_ERROR(state, error) {
        state.error = error;
      },
      SET_ADMIN(state, isAdmin) {
        state.isAdmin = isAdmin;
      },
      ADD_EXPENSE(state, expense) {
        console.log('Current expenses:', state.expenses);
        console.log('Type of expenses:', typeof state.expenses);
        if (!Array.isArray(state.expenses)) {
          console.warn('Expenses was not an array, resetting it');
          state.expenses = [];
        }
        state.expenses.push(expense);
      },
      UPDATE_EXPENSE(state, updatedExpense) {
        const index = state.expenses.findIndex(e => e.id === updatedExpense.id);
        if (index !== -1) {
          state.expenses.splice(index, 1, updatedExpense);
        }
      },
      REMOVE_EXPENSE(state, expenseId) {
        state.expenses = state.expenses.filter(e => e.id !== expenseId);
      },
      ADD_MEMBER(state, member) {
        state.members.push(member);
      },
      REMOVE_MEMBER(state, memberId) {
        state.members = state.members.filter(m => m.id !== memberId);
      }
    },
    actions: {
      async createGroup({ commit }, groupData) {
        try {
          const response = await axios.post('/api/grp_expenses/create', groupData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
            }
          });
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Group creation failed');
          }
          
          return response.data.data; // Return the created group data
        } catch (err) {
          console.error('Group creation error:', err);
          throw err;
        }
      },

      async fetchGroup({ commit }, groupId) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
    try {
      if (!groupId) {
        throw new Error('Missing group ID');
      }
  
    // Fetch group info
    const [groupRes, membersRes] = await Promise.all([
      axios.get(`/api/grp_expenses/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        },
        timeout: 30000
      }),
      axios.get(`/api/grp_expenses/${groupId}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      })
    ]);
    
    if (!groupRes.data?.success || !membersRes.data?.success) {
      throw new Error('Failed to fetch group data');
    }

    commit('SET_GROUP', groupRes.data.data);
    commit('SET_MEMBERS', membersRes.data.data);

    // Check admin status
    const user = JSON.parse(localStorage.getItem('user'));
    const currentMember = membersRes.data.data.find(m => m.id === user?.id);
    commit('SET_ADMIN', currentMember?.role === 'admin');
    
    return groupRes.data.data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      commit('SET_ERROR', 'Request timeout. Please try again.');
    } else {
      commit('SET_ERROR', err.response?.data?.message || err.message);
    }
    throw err;
  } finally {
    commit('SET_LOADING', false);
  }
},
      
      async fetchExpenses({ commit }, { groupId, monthYear }) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        try {
          const res = await axios.get(`/api/grp_expenses/${groupId}/expenses`, {
            params: { monthYear },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
            }
          });

          console.log('API response data:', res.data);

          const expensesData = res.data.success ? (res.data.data || []) : [];
          commit('SET_EXPENSES', expensesData);

          if (!res.data.success) {
            throw new Error(res.data.message || 'Failed to fetch expenses');
          }
  } catch (err) {
    commit('SET_ERROR', err.response?.data?.message || 'Failed to load expenses');
    throw err;
  } finally {
    commit('SET_LOADING', false);
  }
},
      
      async addExpense({ commit }, expenseData) {
        try {
          const res = await axios.post(
            `/api/grp_expenses/${expenseData.group_id}/expenses`,
            expenseData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            }
          );
          
          if (!res.data.success) {
            throw new Error(res.data.message || 'Failed to add expense');
          }

          console.log('Expense added:', res.data.data);
          
          commit('ADD_EXPENSE', res.data.data);
          return res.data;
        } catch (err) {
          console.error('Add expense error:', {
            error: err,
            response: err.response?.data
          });
          throw err;
        }
      },
      
      async updateExpense({ commit }, expenseData) {
        try {
          const res = await axios.put(
            `/api/grp_expenses/${expenseData.group_id}/expenses/${expenseData.id}`,
            expenseData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            }
          );

          if (!res.data.success) {
            throw new Error(res.data.message || 'Failed to update expense');
          }
          
          commit('UPDATE_EXPENSE', res.data.data);
          return res.data;
        } catch (err) {
          console.error('Update expense error:', err);
          throw err;
        }
      },
      
      async deleteExpense({ commit }, { expenseId, groupId }) {
          try {
    const response = await axios.delete(
      `/api/grp_expenses/${groupId}/expenses/${expenseId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete expense');
    }
    
    commit('REMOVE_EXPENSE', expenseId);
    return response.data;
  } catch (err) {
    console.error('Delete expense error:', err);
    throw err;
  }
},
      
      async sendInvite({ commit }, { groupId, email }) {
        try {
          const res = await axios.post(
            `/api/grp_expenses/invite/${groupId}`,
            { email }
          );
          return res.data;
        } catch (err) {
          throw err;
        }
      },
      
      async removeMember({ commit }, { groupId, memberId }) {
        try {
          console.log('Vuex action receiving:', { groupId, memberId });

          if (!groupId || !memberId) {
            throw new Error('Missing groupId or memberId');
          }
          
          const response = await axios.delete(
            `/api/grp_expenses/${groupId}/members/${memberId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            }
          );

          commit('REMOVE_MEMBER', memberId);
          return response.data;
        } catch (err) {
          console.error('Error removing member:', {
          error: err,
          response: err.response?.data
        });
          throw err;
        }
      },
      
      async updateGroupName({ commit, state }, { groupId, name }) {
        try {
          const res = await axios.put(
            `/api/grp_expenses/update-group/${groupId}`,
            { name },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            }
          );
          
          if (res.data.success) {
            commit('SET_GROUP', { 
              ...state.currentGroup, 
              group_name: name 
            });
            return true;
          }
          throw new Error(res.data.message || 'Update failed');
        } catch (err) {
          console.error('Update group name error:', err);
          throw err;
        }
      },
      
      async deleteGroup({ commit }, groupId) {
        try {
          const response = await axios.delete(
            `/api/grp_expenses/delete-group/${groupId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            }
          );
      
          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete group');
          }
      
          commit('RESET_STATE');
          return true;
        } catch (err) {
          console.error('Delete group error:', {
            error: err,
            response: err.response?.data
          });
          throw err;
        }
      }
    },
    getters: {
      creatorName: (state) => {
        if (!state.currentGroup?.created_by) return '';
        const creator = state.members.find(m => m.id === state.currentGroup.created_by);
        return creator ? creator.username : '';
      },
      currentMonthExpenses: (state) => state.expenses
    }
  };
