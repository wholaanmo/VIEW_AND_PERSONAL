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
                            <input type="password" name="password_confirmation" v-model="password_confirmation" class="text-style" required />
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
    </template>
    
    <script>
import { ref, inject } from 'vue'
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
    
      try {
        const res = await axios.post('http://localhost:3000/api/users', {
          username: username.value,
          email: email.value,
          password: password.value,
        });
    
        if (res.data.success === 1) {
            serverMessage.value = "Registration successful! Redirecting...";

          setTimeout(() => router.push('/login'), 1500)
        } else {
            serverMessage.value = response.data.message || "Registration failed.";
        }
    } catch (error) {
        console.error("Registration error:", error);
        // Handle specific error cases (e.g., duplicate email)
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
      registerUser,
    };
  },
};
    </script>
    
    <style scoped>
    
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
