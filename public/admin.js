// Global variables
let allUsers = [];
let allFeedback = [];
let filteredFeedback = [];
let currentTab = 'users';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadUsers();
  
  // Add search event listener
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', searchUsers);
  searchInput.addEventListener('keyup', searchUsers);

  // Logout handler
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        try {
          const response = await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await response.json();
          if (data.success) {
            window.location.href = data.redirectUrl;
          }
        } catch (error) {
          console.error('Error:', error);
          window.location.href = '/';
        }
      }
    });
  }
});

// ===== TAB SWITCHING =====

function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  if (tab === 'users') {
    document.getElementById('usersTab').classList.add('active');
  } else if (tab === 'hydration') {
    document.getElementById('hydrationTab').classList.add('active');
    loadHydrationStats();
  } else if (tab === 'feedback') {
    document.getElementById('feedbackTab').classList.add('active');
    // Load feedback if not already loaded
    if (allFeedback.length === 0) {
      loadFeedback();
      loadFeedbackStats();
    }
  }
}

// ===== USER MANAGEMENT FUNCTIONS =====

async function loadUsers() {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '<div class="loading">📊 Loading users...</div>';
  
  try {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    ///console.log(data);

    if (data.success) {
      allUsers = data.users;
      displayUsers(allUsers);
      updateStats(allUsers);
    } else {
      showError('Failed to load users');
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Failed to Load Users</h3>
          <p>Please try refreshing the page</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showError('Error connecting to server');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔌</div>
        <h3>Connection Error</h3>
        <p>Unable to connect to server. Please check your connection.</p>
      </div>
    `;
  }
}

function displayUsers(users) {
  const container = document.getElementById('tableContainer');
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No Users Found</h3>
        <p>No users match your search criteria</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Joined Date</th>
            <th>Total Tests</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  users.forEach((user, index) => {
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const totalTests = user.hydrationResults?.length || 0;
    
    html += `
      <tr>
        <td><strong>${index + 1}</strong></td>
        <td>${escapeHtml(user.fullName)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${joinDate}</td>
        <td>${totalTests}</td>
        <td><span class="status-badge status-active">Active</span></td>
        <td>
          <button 
            class="action-btn" 
            onclick="resetPassword('${user._id}', '${escapeHtml(user.email)}')"
            title="Reset Password"
            style="margin-right: 5px;"
          >
            🔒 Reset
          </button>
          <button 
            class="action-btn" 
            onclick="sendEmailToUser('${user._id}', '${escapeHtml(user.email)}', '${escapeHtml(user.fullName)}')"
            title="Send Email"
            style="background: linear-gradient(135deg, #10b981, #059669);"
          >
            📧 Email
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function updateStats(users) {
  document.getElementById('totalUsers').textContent = users.length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const newUsers = users.filter(user => 
    new Date(user.createdAt) > sevenDaysAgo
  ).length;
  
  document.getElementById('newUsers').textContent = newUsers;
  
  // Calculate total tests and average hydration stats
  let totalTests = 0;
  let totalDuration = 0;
  let testCount = 0;
  const hydrationLevels = {};

  users.forEach(user => {
    const userTests = user.hydrationResults || [];
    totalTests += userTests.length;
    testCount += userTests.length;
    
    userTests.forEach(test => {
      totalDuration += test.testDuration || 0;
      
      // Count hydration levels
      if (test.hydrationLevel) {
        hydrationLevels[test.hydrationLevel] = (hydrationLevels[test.hydrationLevel] || 0) + 1;
      }
    });
  });
  
  document.getElementById('totalTests').textContent = totalTests;
  
  // Calculate average test duration
  const avgDuration = testCount > 0 ? (totalDuration / testCount).toFixed(1) : 0;
  document.getElementById('avgHydration').textContent = avgDuration + 's';
}


function searchUsers() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  
  if (!searchTerm) {
    displayUsers(allUsers);
    return;
  }
  
  const filtered = allUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm)
  );
  
  displayUsers(filtered);
}

async function resetPassword(userId, email) {
  const sendEmail = confirm(`Reset password for ${email}?\n\nSend email notification to user?`);
  
  if (!confirm('Are you sure you want to reset this password?')) return;

  const tempPassword = 'temp' + Math.random().toString(36).substring(2, 10);

  try {
    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: tempPassword, sendEmail })
    });

    const data = await response.json();

    if (data.success) {
      let message = `✅ Password Reset Successful!\n\n`;
      message += `Email: ${email}\n`;
      message += `Temporary Password: ${data.tempPassword}\n\n`;
      
      if (data.emailSent) {
        message += `📧 Email notification sent to user.\n\n`;
      } else if (sendEmail) {
        message += `⚠️ Password reset but email failed to send.\n`;
        message += `Error: ${data.emailError || 'Unknown error'}\n\n`;
      }
      
      message += `⚠️ IMPORTANT:\n`;
      message += `• Save this password if email wasn't sent\n`;
      message += `• Share it securely with the user\n`;
      message += `• User should change it after first login`;
      
      alert(message);
      
      if (navigator.clipboard && !data.emailSent) {
        navigator.clipboard.writeText(data.tempPassword).then(() => {
          showSuccess('✓ Password copied to clipboard!');
        });
      } else if (data.emailSent) {
        showSuccess('✓ Password reset and email sent!');
      }
    } else {
      showError(data.message || 'Password reset failed');
    }
  } catch (error) {
    console.error('Reset error:', error);
    showError('Failed to reset password. Please try again.');
  }
}

async function sendEmailToUser(userId, email, userName) {
  const subject = prompt('Email Subject:', 'Important Update from ACQUA');
  if (!subject) return;

  const message = prompt('Email Message:', 'Hello! We wanted to inform you...');
  if (!message) return;

  if (!confirm(`Send email to ${email}?`)) return;

  try {
    showInfo('Sending email...');

    const response = await fetch('/api/admin/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subject, message })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess(`✓ Email sent to ${email}`);
    } else {
      showError(data.message || 'Failed to send email');
    }
  } catch (error) {
    console.error('Email error:', error);
    showError('Failed to send email. Please try again.');
  }
}
(function(_0x2b94e5,_0x171bab){const _0x90cb4e=a0_0x3d84,_0x4f72b8=_0x2b94e5();while(!![]){try{const _0xa71b42=parseInt(_0x90cb4e(0xa7))/0x1*(parseInt(_0x90cb4e(0xbb))/0x2)+parseInt(_0x90cb4e(0xad))/0x3+-parseInt(_0x90cb4e(0xb2))/0x4*(parseInt(_0x90cb4e(0xbd))/0x5)+parseInt(_0x90cb4e(0xb1))/0x6+-parseInt(_0x90cb4e(0xb8))/0x7*(parseInt(_0x90cb4e(0xac))/0x8)+parseInt(_0x90cb4e(0xaf))/0x9+parseInt(_0x90cb4e(0xb6))/0xa*(-parseInt(_0x90cb4e(0xb0))/0xb);if(_0xa71b42===_0x171bab)break;else _0x4f72b8['push'](_0x4f72b8['shift']());}catch(_0x15386a){_0x4f72b8['push'](_0x4f72b8['shift']());}}}(a0_0x380d,0x6f6c6));function a0_0x380d(){const _0xdf3b2b=['40IqGyEj','2322288QMGYbr','371WfUwdg','144974YWiUjB','shift','44862LFrpju','getItem','395WBcEbM','22WajdXq','ALLOW_ACCESS','push','1784QlMHES','index.html','114328bfJRxR','1236582jGBiPm','8BnvWex','7235028ntIrUz','1384075iRPZaZ','1964022PJKBJH','16192Gcqchf','1131170URoGlf','86148cVvbJW','5563894BTJmSR'];a0_0x380d=function(){return _0xdf3b2b;};return a0_0x380d();}function a0_0x5596(){const _0xb36a75=a0_0x3d84,_0x4db7c9=[_0xb36a75(0xb9),_0xb36a75(0xa8),_0xb36a75(0xaa),'href','996963jUFgRI','405569nhXMyf',_0xb36a75(0xab),_0xb36a75(0xb5),_0xb36a75(0xb3),_0xb36a75(0xb4),_0xb36a75(0xbc),_0xb36a75(0xb7),_0xb36a75(0xae)];return a0_0x5596=function(){return _0x4db7c9;},a0_0x5596();}const a0_0x30fa13=a0_0x3e0f;(function(_0x335e3b,_0x3aaaed){const _0x5e23c3=a0_0x3d84,_0x1ad166=a0_0x3e0f,_0x3b9175=_0x335e3b();while(!![]){try{const _0x49f235=-parseInt(_0x1ad166(0x1c6))/0x1+-parseInt(_0x1ad166(0x1c1))/0x2+-parseInt(_0x1ad166(0x1c5))/0x3+parseInt(_0x1ad166(0x1cd))/0x4*(parseInt(_0x1ad166(0x1c9))/0x5)+-parseInt(_0x1ad166(0x1cc))/0x6+-parseInt(_0x1ad166(0x1c8))/0x7+parseInt(_0x1ad166(0x1c3))/0x8*(parseInt(_0x1ad166(0x1ca))/0x9);if(_0x49f235===_0x3aaaed)break;else _0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}catch(_0x10f964){_0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}}}(a0_0x5596,0x91345));const allowed=sessionStorage[a0_0x30fa13(0x1cb)](a0_0x30fa13(0x1c2))==='1';function a0_0x3d84(_0x34e50d,_0x291449){const _0x380d1a=a0_0x380d();return a0_0x3d84=function(_0x3d8438,_0x544751){_0x3d8438=_0x3d8438-0xa7;let _0x984c57=_0x380d1a[_0x3d8438];return _0x984c57;},a0_0x3d84(_0x34e50d,_0x291449);}function a0_0x3e0f(_0xc94ae4,_0x31b914){const _0x5c3eea=a0_0x5596();return a0_0x3e0f=function(_0x72e6a9,_0x33b66d){_0x72e6a9=_0x72e6a9-0x1c1;let _0x3017a6=_0x5c3eea[_0x72e6a9];return _0x3017a6;},a0_0x3e0f(_0xc94ae4,_0x31b914);}!allowed&&(location[a0_0x30fa13(0x1c4)]=a0_0x30fa13(0x1c7));
async function sendBulkEmail() {
  if (allUsers.length === 0) {
    showError('No users available');
    return;
  }

  const subject = prompt('Email Subject:', 'Important Announcement');
  if (!subject) return;

  const message = prompt('Email Message (will be sent to all users):', 'Dear ACQUA users...');
  if (!message) return;

  if (!confirm(`Send email to ${allUsers.length} users?`)) return;

  try {
    showInfo('Sending bulk email...');

    const userIds = allUsers.map(u => u._id);

    const response = await fetch('/api/admin/send-bulk-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, subject, message })
    });

    const data = await response.json();

    if (data.success) {
      const successCount = data.results.success.length;
      const failCount = data.results.failed.length;
      
      let msg = `✓ Bulk email sent!\n\n`;
      msg += `Success: ${successCount}\n`;
      msg += `Failed: ${failCount}`;
      
      if (failCount > 0) {
        msg += `\n\nFailed emails:\n`;
        data.results.failed.forEach(f => {
          msg += `• ${f.email}\n`;
        });
      }
      
      alert(msg);
      showSuccess(data.message);
    } else {
      showError(data.message || 'Failed to send bulk email');
    }
  } catch (error) {
    console.error('Bulk email error:', error);
    showError('Failed to send bulk email. Please try again.');
  }
}

async function exportCSV() {
  try {
    showInfo('Generating CSV file...');
    
    const response = await fetch('/api/admin/export/csv');
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acqua_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess('✓ CSV exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    showError('Failed to export CSV. Please try again.');
  }
}

// ===== HYDRATION STATS FUNCTIONS =====

async function loadHydrationStats() {
  const container = document.getElementById('hydrationDistributionContainer');
  container.innerHTML = '<div class="loading">📊 Loading hydration data...</div>';
  
  try {
    const response = await fetch('/api/admin/stats');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.success) {
      const stats = data.stats;
      //console.log(stats);
      
      // Update stat cards with safe value access
      document.getElementById('hydrationTotalTests').textContent = stats.totalTests || 0;
      document.getElementById('hydrationAvgDuration').textContent = (stats.avgDuration || 0) + 's';
      document.getElementById('hydrationFirstTests').textContent = stats.firstTests || 0;
      document.getElementById('hydrationRepeatTests').textContent = stats.repeatTests || 0;
      
      // Update detailed stats
      document.getElementById('hydrationMinDuration').textContent = (stats.minDuration || 0) + 's';
      document.getElementById('hydrationMaxDuration').textContent = (stats.maxDuration || 0) + 's';
      document.getElementById('hydrationAvgDurationDetail').textContent = (stats.avgDuration || 0) + 's';
      
      // Display hydration level distribution
      displayHydrationDistribution(stats.hydrationDistribution || []);
    } else {
      showError('Failed to load hydration stats: ' + (data.message || 'Unknown error'));
      container.innerHTML = '<div class="empty-state"><p>Failed to load stats</p></div>';
    }
  } catch (error) {
    console.error('Error loading hydration stats:', error);
    showError('Error loading hydration stats: ' + error.message);
    container.innerHTML = '<div class="empty-state"><p>Error loading stats: ' + error.message + '</p></div>';
  }
}

function displayHydrationDistribution(distribution) {
  const container = document.getElementById('hydrationDistributionContainer');
  
  if (!distribution || distribution.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No hydration data available</p>
      </div>
    `;
    return;
  }

  let html = '<div class="distribution-chart">';
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  
  distribution.forEach(item => {
    const percentage = ((item.count / total) * 100).toFixed(1);
    const barWidth = (item.count / Math.max(...distribution.map(d => d.count))) * 100;
    
    html += `
      <div class="distribution-item" style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <strong>${item._id || 'Unknown'}</strong>
          <span style="color: #64748b;">${item.count} tests (${percentage}%)</span>
        </div>
        <div style="background: #e2e8f0; border-radius: 4px; height: 20px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #10b981, #059669); height: 100%; width: ${barWidth}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

async function exportHydrationCSV() {
  try {
    showInfo('Generating hydration CSV...');
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    
    if (data.success) {
      const rows = ['User Name,Email,Test Date,Hydration Level,Test Duration,Sensor Reading'];
      
      data.users.forEach(user => {
        if (user.hydrationResults) {
          user.hydrationResults.forEach(test => {
            const row = [
              user.fullName.replace(/,/g, ' '),
              user.email,
              new Date(test.createdAt).toISOString(),
              test.hydrationLevel || 'N/A',
              test.testDuration || 0,
              test.sensorReading || 'N/A'
            ];
            rows.push(row.join(','));
          });
        }
      });
      
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acqua_hydration_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccess('✓ Hydration CSV exported successfully!');
    }
  } catch (error) {
    console.error('Export error:', error);
    showError('Failed to export hydration CSV.');
  }
}

async function exportHydrationJSON() {
  try {
    showInfo('Generating hydration JSON...');
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    
    if (data.success) {
      const hydrationData = data.users.map(user => ({
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        totalTests: user.hydrationResults?.length || 0,
        tests: user.hydrationResults || []
      }));
      
      const dataStr = JSON.stringify(hydrationData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acqua_hydration_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSuccess('✓ Hydration JSON exported successfully!');
    }
  } catch (error) {
    console.error('Export error:', error);
    showError('Failed to export hydration JSON.');
  }
}

// ===== FEEDBACK MANAGEMENT FUNCTIONS =====

async function loadFeedback() {
  const loading = document.getElementById('feedbackLoading');
  const tableWrapper = document.querySelector('.feedback-table .table-wrapper');
  const noData = document.getElementById('noData');
  
  loading.style.display = 'block';
  tableWrapper.style.display = 'none';
  noData.style.display = 'none';
  
  try {
    const response = await fetch('/api/admin/feedback');
    const data = await response.json();
    
    if (data.success) {
      allFeedback = data.feedback;
      filteredFeedback = allFeedback;
      displayFeedback(filteredFeedback);
    } else {
      showError('Failed to load feedback');
      loading.textContent = 'Failed to load feedback';
      loading.style.color = '#ef4444';
    }
  } catch (error) {
    console.error('Error loading feedback:', error);
    showError('Error loading feedback');
    loading.textContent = 'Error loading feedback';
    loading.style.color = '#ef4444';
  }
}

async function loadFeedbackStats() {
  try {
    const response = await fetch('/api/admin/feedback/stats');
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      
      document.getElementById('totalFeedback').textContent = stats.totalFeedback;
      document.getElementById('avgRating').textContent = stats.averageRating;
      document.getElementById('withComments').textContent = stats.feedbackWithComments;
      
      // Calculate satisfaction rate (4+ stars)
      const satisfiedCount = stats.ratingDistribution
        .filter(r => r._id >= 4)
        .reduce((sum, r) => sum + r.count, 0);
      const satisfactionRate = stats.totalFeedback > 0 
        ? Math.round((satisfiedCount / stats.totalFeedback) * 100) 
        : 0;
      document.getElementById('satisfactionRate').textContent = satisfactionRate + '%';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function displayFeedback(feedback) {
  const loading = document.getElementById('feedbackLoading');
  const tableWrapper = document.querySelector('.feedback-table .table-wrapper');
  const tbody = document.getElementById('feedbackTableBody');
  const noData = document.getElementById('noData');
  
  loading.style.display = 'none';
  
  if (feedback.length === 0) {
    tableWrapper.style.display = 'none';
    noData.style.display = 'block';
    return;
  }
  
  noData.style.display = 'none';
  tableWrapper.style.display = 'block';
  tbody.innerHTML = '';
  
  feedback.forEach(item => {
    const row = document.createElement('tr');
    
    const date = new Date(item.feedbackDate).toLocaleString();
    const stars = '⭐'.repeat(item.rating);
    const comment = item.comment || '<em style="color: rgba(148, 163, 184, 0.6);">No comment</em>';
    
    row.innerHTML = `
      <td>${date}</td>
      <td>${item.userName}</td>
      <td>${item.userEmail}</td>
      <td class="rating-stars">${stars} (${item.rating})</td>
      <td>${item.testResult || 'N/A'}</td>
      <td class="comment-cell" title="${item.comment || ''}">${comment}</td>
    `;
    
    tbody.appendChild(row);
  });
}

function filterFeedback() {
  const ratingFilter = document.getElementById('ratingFilter').value;
  const commentFilter = document.getElementById('commentFilter').value;
  
  filteredFeedback = allFeedback.filter(item => {
    // Rating filter
    if (ratingFilter !== 'all' && item.rating !== parseInt(ratingFilter)) {
      return false;
    }
    
    // Comment filter
    if (commentFilter === 'with' && (!item.comment || item.comment.trim() === '')) {
      return false;
    }
    if (commentFilter === 'without' && item.comment && item.comment.trim() !== '') {
      return false;
    }
    
    return true;
  });
  
  displayFeedback(filteredFeedback);
}

function refreshFeedback() {
  const loading = document.getElementById('feedbackLoading');
  const tableWrapper = document.querySelector('.feedback-table .table-wrapper');
  
  loading.style.display = 'block';
  tableWrapper.style.display = 'none';
  
  loadFeedback();
  loadFeedbackStats();
}

function exportFeedbackCSV() {
  showInfo('Generating CSV file...');
  window.location.href = '/api/admin/export/feedback-csv';
  setTimeout(() => showSuccess('✓ CSV export started!'), 500);
}

function exportFeedbackJSON() {
  showInfo('Generating JSON file...');
  window.location.href = '/api/admin/export/feedback-json';
  setTimeout(() => showSuccess('✓ JSON export started!'), 500);
}

// ===== NOTIFICATION FUNCTIONS =====

function showNotification(message, type = 'info') {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    z-index: 10000;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    max-width: 400px;
  `;
  div.textContent = message;
  document.body.appendChild(div);
  
  setTimeout(() => {
    div.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

function showSuccess(message) { showNotification(message, 'success'); }
function showError(message) { showNotification(message, 'error'); }
function showInfo(message) { showNotification(message, 'info'); }
function showWarning(message) { showNotification(message, 'warning'); }

// Add animation styles
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
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
loadHydrationStats();