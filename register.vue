<template>
    <div class="register-bg">
        <div class="container">
            <div class="login-container">
                <div class="login-form">
                    <form @submit.prevent="registerUser">
                        <div class="login-form-items">
                            <span class="login-label">REGISTER</span>
    
                            <div class="text-input-container">
                                <label class="form-label">USERNAME</label>
                                <input type="text" name="username" v-model="username" class="text-style" required />

                                <label class="form-label">EMAIL</label>
                                <input type="email" name="email" v-model="email" class="text-style" required />

                                <label class="form-label">PASSWORD</label>
                                <input type="password" name="password" v-model="password" class="text-style" required />

                                <label class="form-label">PASSWORD CONFIRMATION</label>
                                <input 
        type="password" 
        name="password_confirmation" 
        v-model="password_confirmation" 
        @input="checkPasswordStrength"
        class="text-style" 
        required 
    />
    <div class="password-strength-meter">
        <div 
            :class="['strength-bar', strengthClass]" 
            :style="{ width: strengthPercentage + '%' }"
        ></div>
    </div>
    <div class="password-feedback" :class="strengthClass" v-if="password.length > 0">
        {{ strengthMessage }}
    </div>
                            </div>

                            <div class="privacy-policy-container">
                                <input 
                                    type="checkbox" 
                                    id="privacyPolicy" 
                                    v-model="acceptedPrivacyPolicy" 
                                    class="privacy-checkbox"
                                    required
                                />
                                <label for="privacyPolicy" class="privacy-label">
                                    I agree to the <a href="#" @click.prevent="showPrivacyModal = true" class="privacy-link">Privacy Policy</a>
                                </label>
                            </div>

                            <p v-if="serverMessage" class="error-message">{{ serverMessage }}</p>

                            <button type="submit" class="login-btn">SIGN UP</button>
                            <router-link to="/login" class="login-btn1">SIGN IN</router-link>
                        </div>
                    </form>    
                </div>
                <div class="login-deco-container">
                    <div class="login-deco">
                        <span class="penny">MONEY <br> LOG</span>
                        <img src="/LOGO.png" alt="Logo Image" class="deco-image">  
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Privacy Policy Modal -->
    <div v-if="showPrivacyModal" class="modal-overlay" @click.self="showPrivacyModal = false">
        <div class="modal-container">
            <div class="modal-header">
                <h2>Money Log Privacy Policy</h2>
                <button @click="showPrivacyModal = false" class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-content">
                <h3>Your Financial Data Security Is Our Priority</h3>

                <h4>1. Information We Collect</h4>
                <p>To provide our budget tracking services, we collect:</p>
                <ul>
                    <li><strong>Account Information:</strong> Username, email, and encrypted password</li>
                    <li><strong>Financial Data:</strong> 
                        <ul>
                            <li>Individual expense amounts, dates, and categories (food, bills, transportation, etc.)</li>
                            <li>Budget limits and remaining balances</li>
                            <li>Group expense allocations and member contributions</li>
                        </ul>
                    </li>
                    <li><strong>Usage Data:</strong> How you interact with our features (expense filtering, visualization preferences, etc.)</li>
                </ul>
                
                <h4>2. How We Use Your Financial Data</h4>
                <p>We process your information exclusively to:</p>
                <ul>
                    <li>Generate accurate budget reports and spending analyses</li>
                    <li>Power our visualization tools (pie charts, tables, etc.)</li>
                    <li>Calculate group expense allocations and balances</li>
                    <li>Enable date filtering and transaction categorization</li>
                    <li>Improve core features like expense editing/deletion</li>
                    <li>Secure your account and prevent unauthorized access</li>
                </ul>
                
                <h4>3. Group Expense Specifics</h4>
                <p>For shared expense features:</p>
                <ul>
                    <li>Group creators can see member contributions but not their other private expenses</li>
                    <li>Expense details shared within groups are encrypted</li>
                    <li>You can leave groups at any time to stop data sharing</li>
                </ul>
                
                <h4>4. Your Rights & Controls</h4>
                <p>You can:</p>
                <ul>
                    <li>Export all expense data (CSV/JSON formats)</li>
                    <li>Permanently delete individual transactions or entire accounts</li>
                    <li>Opt out of non-essential emails while keeping transaction alerts</li>
                    <li>Request a full data audit report</li>
                </ul>
                
                <div class="policy-highlights">
                    <h4>Key Privacy Features:</h4>
                    <div class="highlight-grid">
                        <div class="highlight-item">
                            <div class="highlight-icon">🔒</div>
                            <div>We never sell or share your financial data</div>
                        </div>
                        <div class="highlight-item">
                            <div class="highlight-icon">🧩</div>
                            <div>Group expenses are encrypted end-to-end</div>
                        </div>
                        <div class="highlight-item">
                            <div class="highlight-icon">📊</div>
                            <div>Visualizations process data locally when possible</div>
                        </div>
                        <div class="highlight-item">
                            <div class="highlight-icon">🗑️</div>
                            <div>Immediate deletion upon account termination</div>
                        </div>
                    </div>
                </div>
                
                <p>By using Money Log, you consent to this privacy-focused data handling.</p>
            </div>
            <div class="modal-footer">
                <button @click="showPrivacyModal = false" class="modal-close-btn">I Understand</button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, inject, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const someInjectedValue = inject('key')
    
    const username = ref('')
    const email = ref('')
    const password = ref('')
    const password_confirmation = ref('')
    const serverMessage = ref('')
    const acceptedPrivacyPolicy = ref(false)
    const showPrivacyModal = ref(false)

    const hasMinLength = computed(() => password.value.length >= 8)
    const hasUppercase = computed(() => /[A-Z]/.test(password.value))
    const hasLowercase = computed(() => /[a-z]/.test(password.value))
    const hasNumber = computed(() => /[0-9]/.test(password.value))
    const hasSpecialChar = computed(() => /[!@#$%^&*]/.test(password.value))

    const strengthScore = computed(() => {
      let score = 0
      if (password.value.length >= 8) score++
      if (/[A-Z]/.test(password.value)) score++
      if (/[a-z]/.test(password.value)) score++
      if (/[0-9]/.test(password.value)) score++
      if (/[!@#$%^&*]/.test(password.value)) score++
      return score
    })

    const strengthPercentage = computed(() => strengthScore.value * 20)
    
    const strengthClass = computed(() => {
      if (password.value.length === 0) return ''
      if (strengthScore.value <= 2) return 'weak'
      if (strengthScore.value <= 3) return 'medium'
      return 'strong'
    })

    const strengthMessage = computed(() => {
      if (password.value.length === 0) return ''
      switch(strengthClass.value) {
        case 'weak': return 'Weak password - easy to guess'
        case 'medium': return 'Medium strength - could be stronger'
        case 'strong': return 'Strong password - good job!'
        default: return ''
      }
    })

    const registerUser = async () => {
      serverMessage.value = ''
    
      if (!username.value || !email.value || !password.value || !password_confirmation.value) {
        serverMessage.value = "All fields are required!"
        return
      }
    
      if (password.value !== password_confirmation.value) {
        serverMessage.value = "Passwords do not match!"
        return
      }
    
      if (!acceptedPrivacyPolicy.value) {
        serverMessage.value = "You must accept the privacy policy!"
        return
      }

      if (strengthScore.value < 3) {
        serverMessage.value = "Please choose a stronger password (mix uppercase, numbers, and special characters)"
        return
      }
    
      try {
        const res = await axios.post('http://localhost:3000/api/users', {
          username: username.value,
          email: email.value,
          password: password.value,
          accepted_privacy_policy: true // Add this to your database
        });
    
        if (res.data.success === 1) {
            serverMessage.value = "Registration successful! Redirecting...";
            setTimeout(() => router.push('/login'), 1500)
        } else {
            serverMessage.value = res.data.message || "Registration failed.";
        }
      } catch (error) {
        console.error("Registration error:", error);
        if (error.response?.data?.message) {
          serverMessage.value = error.response.data.message;
        } else {
          serverMessage.value = "Registration failed. Please try again.";
        }
      }
    };
    
    return {
      username,
      email,
      password,
      password_confirmation,
      serverMessage,
      acceptedPrivacyPolicy,
      showPrivacyModal,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      strengthPercentage,
      strengthClass,
      strengthMessage,
      registerUser,
    };
  },
};
</script>
    
<style scoped>
.password-strength-meter {
    height: 5px;
    background-color: #e0e0e0;
    border-radius: 3px;
    margin: 8px 0;
    overflow: hidden;
}

.strength-bar {
    height: 100%;
    transition: width 0.3s, background-color 0.3s;
}

.strength-bar.weak {
    background-color: #ff4444;
}
.strength-bar.medium {
    background-color: #ffbb33;
}
.strength-bar.strong {
    background-color: #00C851;
}

.password-feedback {
    font-size: 0.85rem;
    margin-bottom: 15px;
}
.password-feedback.weak {
    color: #ff4444;
}
.password-feedback.medium {
    color: #ffbb33;
}
.password-feedback.strong {
    color: #00C851;
}

.requirements-list {
    margin: 8px 0 0 20px;
    padding: 0;
    list-style-type: none;
    font-size: 0.8rem;
    color: #666;
}
.requirements-list li {
    margin: 3px 0;
    position: relative;
    padding-left: 20px;
}
.requirements-list li:before {
    content: "✗";
    position: absolute;
    left: 0;
    color: #ff4444;
}
.requirements-list li.met:before {
    content: "✓";
    color: #00C851;
}
.policy-highlights {
    margin: 2rem 0;
    padding: 1.5rem;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.highlight-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.highlight-item {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
}

.highlight-icon {
    font-size: 1.5rem;
    line-height: 1;
}

.modal-content ul ul {
    margin-left: 1.5rem;
    margin-top: 0.5rem;
}

.modal-content a {
    color: #4a6baf;
    text-decoration: none;
}

.modal-content a:hover {
    text-decoration: underline;
}
    .privacy-policy-container {
    margin: 15px 0;
    display: flex;
    align-items: center;
}

.privacy-checkbox {
    margin-right: 10px;
}

.privacy-label {
    font-size: 14px;
    color: #333;
}

.privacy-link {
    color: #4a6baf;
    text-decoration: none;
    cursor: pointer;
}

.privacy-link:hover {
    text-decoration: underline;
}

.error-message {
    color: #ff4444;
    margin: 10px 0;
    font-size: 14px;
}

/* Modal Styles */
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

.modal-container {
    background-color: white;
    border-radius: 8px;
    width: 80%;
    max-width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-content {
    padding: 20px;
    line-height: 1.6;
}

.modal-content h3, .modal-content h4 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
}

.modal-content ul {
    margin-left: 20px;
    margin-bottom: 1em;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    text-align: right;
}

.modal-close-btn {
    background: transparent;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: #555;
    padding: 0.25em 0.5em;
    border-radius: 10%;
    transition: background 0.3s ease, color 0.3s ease;
}

.modal-close-btn:hover {
    background: #f0f0f0;
    color: #000;
}
    .privacy-policy-container {
    margin: 15px 0;
    display: flex;
    align-items: center;
}

.privacy-checkbox {
    margin-right: 10px;
}

.privacy-label {
    font-size: 14px;
    color: #333;
}

.privacy-link {
    color: #4a6baf;
    text-decoration: none;
}

.privacy-link:hover {
    text-decoration: underline;
}

.error-message {
    color: #ff4444;
    margin: 10px 0;
    font-size: 14px;
}
    
    .register-bg {
    background-image: url("/circle.png");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    }

    .container {
        width: 100%;
        max-width: 1100px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .login-container {
        width: 100%;
        max-width: 650px;
        min-width: 390px;
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        padding: 30px;
        gap: 20px;
        box-sizing: border-box;
    }
    
    .login-form {
        width: 50%;
        display: flex;
        flex-direction: column;
        text-align: center;
        align-items: center;
        padding: 10px;
    }
    
    .login-form-items {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 99%;
        
    }
    
    span.login-label {
        color: black;
        font-weight: 900;
        font-size: 36px;
        letter-spacing: 2px;
        margin-bottom: 20px;
        white-space: nowrap;
    }
    
    .text-input-container {
        width: 100%;
        max-width: 480px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .text-input-container input {
        width: 100%;
        padding: 4px;
        font-size: 14px;
        margin-bottom: 10px;
    }
    
    input.text-style {
        border-radius: 10px;
        width: 100%;
        height: 10px;
        padding: 10px 12px;
        font-size: 14px;
        background: none;
        border: 2px solid rgb(51, 47, 47);
        color: black;
        box-sizing: border-box;
    }
    
    input:focus {
        outline: none;
    }
    
    .form-label {
        color: black;
        font-weight: 350;
        font-size: 15px;
        margin-bottom: 5px;
    }
    
    button.login-btn,
    .login-btn1 {
        width: 200px;
        background: #D6EFD8;
        border-radius: 20px;
        border: none;
        padding: 10px 0;
        color: black;
        font-weight: 700;
        font-size: 14px;
        font-family: sans-serif;
        letter-spacing: 2px;
        margin-top: 10px;
        cursor: pointer;
        box-shadow: 0 8px 10px 0 rgba(0,0,0,0.25);
        text-align: center;
        text-decoration: none;
    }
    
    button.login-btn:hover,
    .login-btn1:hover {
        background-color: #80AF81;
    }
    
    .success {
        color: green;
    }
    
    .invalid {
        color: red;
        font-size: 0.9em;
    }
    
    .login-deco-container {
        width: 50%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px;
        box-sizing: border-box;
    }
    
    .login-deco {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .deco-image {
        width: 100%;
        max-width: 300px;
        height: auto;
        margin-top: 100px;
    }
    
    .penny {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        color: #f6f8d5;
        font-weight: bold;
        font-size: 40px;
        letter-spacing: 2px;
        padding-top: 10px;
        text-align: center;
        font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }
    
    /* RESPONSIVE — Keep side-by-side, scale content */
    
    @media (max-width: 1024px) {
            .login-container {
                padding: 20px;
                gap: 10px;
            }
        
            .login-form,
            .login-deco-container {
                width: 50%;
            }
    
            .text-input-container {
                width: 100%;
            }
        
            .deco-image {
                max-width: 260px;
                margin-top: 80px;
            }
        
            .penny {
                font-size: 36px;
            }
        
            span.login-label {
                font-size: 38px;
            }
        }
        
        @media (max-width: 768px) {
            .login-container {
                padding: 20px;
                gap: 10px;
            }

            .login-form-items{
                width: 100%;
            }
        
            .login-form,
            .login-deco-container {
                width: 50%;
            }
        
            .deco-image {
                max-width: 220px;
            }
    
            .text-input-container {
                width: 100%;
            }
        
            .penny {
                font-size: 32px;
            }
        
            span.login-label {
                font-size: 36px;
            }
        
            .login-btn {
                font-size: 14px;
                padding: 8px 0;
            }
        }
        
        @media (max-width: 480px) {
            .login-container {
                padding: 20px;
                gap: 10px;
            }
        
            .login-form,
            .login-deco-container {
                width: 50%;
                padding: 10px;
            }
        
            .deco-image {
                max-width: 220px;
            }
        
            .penny {
                font-size: 28px;
            }
    
            .text-input-container {
                width: 100%;
            }
        
            span.login-label {
                font-size: 34px;
            }
        
            .login-btn {
                font-size: 13px;
                padding: 6px 0;
            }
        }
    </style>
