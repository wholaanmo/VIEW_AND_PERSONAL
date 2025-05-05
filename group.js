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
        state.expenses = expenses;
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
        if (!state.expenses) {
          state.expenses = []; // Initialize if undefined
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
        timeout: 10000 // 10 seconds timeout
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
          const res = await axios.get(`/api/grp_expenses/${groupId}`, {
            params: { monthYear }
          });
          commit('SET_EXPENSES', res.data.data);
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
            `/api/grp_expenses/edit/${expenseData.id}`,
            expenseData
          );
          commit('UPDATE_EXPENSE', res.data.data);
          return res.data;
        } catch (err) {
          throw err;
        }
      },
      
      async deleteExpense({ commit }, expenseId) {
        try {
          await axios.delete(`/api/grp_expenses/delete/${expenseId}`);
          commit('REMOVE_EXPENSE', expenseId);
        } catch (err) {
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
          await axios.delete(`/api/grp_expenses/members/${groupId}/${memberId}`);
          commit('REMOVE_MEMBER', memberId);
        } catch (err) {
          throw err;
        }
      },
      
      async updateGroupName({ commit }, { groupId, name }) {
        try {
          const res = await axios.put(
            `/api/grp_expenses/update-group/${groupId}`,
            { name }
          );
          commit('SET_GROUP', { ...state.currentGroup, group_name: name });
          return res.data;
        } catch (err) {
          throw err;
        }
      },
      
      async deleteGroup({ commit }, groupId) {
        try {
          await axios.delete(`/api/grp_expenses/delete-group/${groupId}`);
        } catch (err) {
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
