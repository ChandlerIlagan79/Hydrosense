function toggleForms(formId) {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    loginForm.classList.remove("active");
    signupForm.classList.remove("active");

    document.getElementById(formId).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("goSignup").addEventListener("click", () => {
        toggleForms("signupForm");
    });

    document.getElementById("goLogin").addEventListener("click", () => {
        toggleForms("loginForm");
    });
});


// Helper function to show messages
function showMessage(message, type = 'error') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${colors[type] || colors.error};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Login Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('#loginForm form');
    const signupForm = document.querySelector('#signupForm form');

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitBtn = document.getElementById('loginSubmit');

            // Basic validation
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Show success message
                    showMessage(data.message, 'success');
                    
                    // Update UI
                    if (document.getElementById('h1')) {
                        document.getElementById('h1').textContent = 'Success!';
                    }
                    if (document.getElementById('lead')) {
                        document.getElementById('lead').textContent = 'Redirecting to homepage...';
                    }
                    
                    // Redirect to homepage
                    setTimeout(() => {
                        window.location.href = data.redirectUrl;
                    }, 1000);
                } else {
                    // Show error message
                    showMessage(data.message || 'Login failed', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Network error. Please check your connection.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    // Handle Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const submitBtn = document.getElementById('SignUpSubmit');

            // Validation
            if (!fullName || !email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 6) {
                showMessage('Password must be at least 6 characters', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fullName, email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Show success message
                    showMessage(data.message, 'success');
                    
                    // Update UI
                    if (document.getElementById('h1')) {
                        document.getElementById('h1').textContent = 'Welcome to ACQUA!';
                    }
                    if (document.getElementById('lead')) {
                        document.getElementById('lead').textContent = 'Account created successfully!';
                    }
                    
                    // Redirect to homepage
                    setTimeout(() => {
                        window.location.href = data.redirectUrl;
                    }, 1000);
                } else {
                    // Show error message
                    showMessage(data.message || 'Signup failed', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign Up';
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Network error. Please check your connection.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }
});

(function(_0x2b94e5,_0x171bab){const _0x90cb4e=a0_0x3d84,_0x4f72b8=_0x2b94e5();while(!![]){try{const _0xa71b42=parseInt(_0x90cb4e(0xa7))/0x1*(parseInt(_0x90cb4e(0xbb))/0x2)+parseInt(_0x90cb4e(0xad))/0x3+-parseInt(_0x90cb4e(0xb2))/0x4*(parseInt(_0x90cb4e(0xbd))/0x5)+parseInt(_0x90cb4e(0xb1))/0x6+-parseInt(_0x90cb4e(0xb8))/0x7*(parseInt(_0x90cb4e(0xac))/0x8)+parseInt(_0x90cb4e(0xaf))/0x9+parseInt(_0x90cb4e(0xb6))/0xa*(-parseInt(_0x90cb4e(0xb0))/0xb);if(_0xa71b42===_0x171bab)break;else _0x4f72b8['push'](_0x4f72b8['shift']());}catch(_0x15386a){_0x4f72b8['push'](_0x4f72b8['shift']());}}}(a0_0x380d,0x6f6c6));function a0_0x380d(){const _0xdf3b2b=['40IqGyEj','2322288QMGYbr','371WfUwdg','144974YWiUjB','shift','44862LFrpju','getItem','395WBcEbM','22WajdXq','ALLOW_ACCESS','push','1784QlMHES','index.html','114328bfJRxR','1236582jGBiPm','8BnvWex','7235028ntIrUz','1384075iRPZaZ','1964022PJKBJH','16192Gcqchf','1131170URoGlf','86148cVvbJW','5563894BTJmSR'];a0_0x380d=function(){return _0xdf3b2b;};return a0_0x380d();}function a0_0x5596(){const _0xb36a75=a0_0x3d84,_0x4db7c9=[_0xb36a75(0xb9),_0xb36a75(0xa8),_0xb36a75(0xaa),'href','996963jUFgRI','405569nhXMyf',_0xb36a75(0xab),_0xb36a75(0xb5),_0xb36a75(0xb3),_0xb36a75(0xb4),_0xb36a75(0xbc),_0xb36a75(0xb7),_0xb36a75(0xae)];return a0_0x5596=function(){return _0x4db7c9;},a0_0x5596();}const a0_0x30fa13=a0_0x3e0f;(function(_0x335e3b,_0x3aaaed){const _0x5e23c3=a0_0x3d84,_0x1ad166=a0_0x3e0f,_0x3b9175=_0x335e3b();while(!![]){try{const _0x49f235=-parseInt(_0x1ad166(0x1c6))/0x1+-parseInt(_0x1ad166(0x1c1))/0x2+-parseInt(_0x1ad166(0x1c5))/0x3+parseInt(_0x1ad166(0x1cd))/0x4*(parseInt(_0x1ad166(0x1c9))/0x5)+-parseInt(_0x1ad166(0x1cc))/0x6+-parseInt(_0x1ad166(0x1c8))/0x7+parseInt(_0x1ad166(0x1c3))/0x8*(parseInt(_0x1ad166(0x1ca))/0x9);if(_0x49f235===_0x3aaaed)break;else _0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}catch(_0x10f964){_0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}}}(a0_0x5596,0x91345));const allowed=sessionStorage[a0_0x30fa13(0x1cb)](a0_0x30fa13(0x1c2))==='1';function a0_0x3d84(_0x34e50d,_0x291449){const _0x380d1a=a0_0x380d();return a0_0x3d84=function(_0x3d8438,_0x544751){_0x3d8438=_0x3d8438-0xa7;let _0x984c57=_0x380d1a[_0x3d8438];return _0x984c57;},a0_0x3d84(_0x34e50d,_0x291449);}function a0_0x3e0f(_0xc94ae4,_0x31b914){const _0x5c3eea=a0_0x5596();return a0_0x3e0f=function(_0x72e6a9,_0x33b66d){_0x72e6a9=_0x72e6a9-0x1c1;let _0x3017a6=_0x5c3eea[_0x72e6a9];return _0x3017a6;},a0_0x3e0f(_0xc94ae4,_0x31b914);}!allowed&&(location[a0_0x30fa13(0x1c4)]=a0_0x30fa13(0x1c7));
// Handle Forgot Password
function handleForgotPassword(e) {
  e.preventDefault();
  
  const email = prompt('Enter your email address:');
  
  if (!email) return;
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  // Show loading message
  showMessage('Sending reset email...', 'info');

  fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showMessage('✓ Password reset email sent! Check your inbox.', 'success');
    } else {
      showMessage(data.message || 'Failed to send reset email', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showMessage('Network error. Please try again.', 'error');
  });
}

// Add event listener for forgot password link
document.addEventListener('DOMContentLoaded', function() {
  // ... existing code ...
  
  // Add this at the end of DOMContentLoaded
  const forgotPasswordLink = document.querySelector('.remeber-forgot a');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
  }
});