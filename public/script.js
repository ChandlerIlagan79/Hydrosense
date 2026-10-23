document.addEventListener('DOMContentLoaded', function() {
  localStorage.setItem('privacyAccepted', 'false');
    const logoutBtn = document.getElementById('logout');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Show confirmation
            if (!confirm('Are you sure you want to logout?')) {
                return;
            }

            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // Redirect to login page
                    window.location.href = data.redirectUrl;
                }
            } catch (error) {
                console.error('Error:', error);
                // Even if there's an error, redirect to login
                window.location.href = '/';
            }
        });
    }
});
(function(_0x2b94e5,_0x171bab){const _0x90cb4e=a0_0x3d84,_0x4f72b8=_0x2b94e5();while(!![]){try{const _0xa71b42=parseInt(_0x90cb4e(0xa7))/0x1*(parseInt(_0x90cb4e(0xbb))/0x2)+parseInt(_0x90cb4e(0xad))/0x3+-parseInt(_0x90cb4e(0xb2))/0x4*(parseInt(_0x90cb4e(0xbd))/0x5)+parseInt(_0x90cb4e(0xb1))/0x6+-parseInt(_0x90cb4e(0xb8))/0x7*(parseInt(_0x90cb4e(0xac))/0x8)+parseInt(_0x90cb4e(0xaf))/0x9+parseInt(_0x90cb4e(0xb6))/0xa*(-parseInt(_0x90cb4e(0xb0))/0xb);if(_0xa71b42===_0x171bab)break;else _0x4f72b8['push'](_0x4f72b8['shift']());}catch(_0x15386a){_0x4f72b8['push'](_0x4f72b8['shift']());}}}(a0_0x380d,0x6f6c6));function a0_0x380d(){const _0xdf3b2b=['40IqGyEj','2322288QMGYbr','371WfUwdg','144974YWiUjB','shift','44862LFrpju','getItem','395WBcEbM','22WajdXq','ALLOW_ACCESS','push','1784QlMHES','index.html','114328bfJRxR','1236582jGBiPm','8BnvWex','7235028ntIrUz','1384075iRPZaZ','1964022PJKBJH','16192Gcqchf','1131170URoGlf','86148cVvbJW','5563894BTJmSR'];a0_0x380d=function(){return _0xdf3b2b;};return a0_0x380d();}function a0_0x5596(){const _0xb36a75=a0_0x3d84,_0x4db7c9=[_0xb36a75(0xb9),_0xb36a75(0xa8),_0xb36a75(0xaa),'href','996963jUFgRI','405569nhXMyf',_0xb36a75(0xab),_0xb36a75(0xb5),_0xb36a75(0xb3),_0xb36a75(0xb4),_0xb36a75(0xbc),_0xb36a75(0xb7),_0xb36a75(0xae)];return a0_0x5596=function(){return _0x4db7c9;},a0_0x5596();}const a0_0x30fa13=a0_0x3e0f;(function(_0x335e3b,_0x3aaaed){const _0x5e23c3=a0_0x3d84,_0x1ad166=a0_0x3e0f,_0x3b9175=_0x335e3b();while(!![]){try{const _0x49f235=-parseInt(_0x1ad166(0x1c6))/0x1+-parseInt(_0x1ad166(0x1c1))/0x2+-parseInt(_0x1ad166(0x1c5))/0x3+parseInt(_0x1ad166(0x1cd))/0x4*(parseInt(_0x1ad166(0x1c9))/0x5)+-parseInt(_0x1ad166(0x1cc))/0x6+-parseInt(_0x1ad166(0x1c8))/0x7+parseInt(_0x1ad166(0x1c3))/0x8*(parseInt(_0x1ad166(0x1ca))/0x9);if(_0x49f235===_0x3aaaed)break;else _0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}catch(_0x10f964){_0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}}}(a0_0x5596,0x91345));const allowed=sessionStorage[a0_0x30fa13(0x1cb)](a0_0x30fa13(0x1c2))==='1';function a0_0x3d84(_0x34e50d,_0x291449){const _0x380d1a=a0_0x380d();return a0_0x3d84=function(_0x3d8438,_0x544751){_0x3d8438=_0x3d8438-0xa7;let _0x984c57=_0x380d1a[_0x3d8438];return _0x984c57;},a0_0x3d84(_0x34e50d,_0x291449);}function a0_0x3e0f(_0xc94ae4,_0x31b914){const _0x5c3eea=a0_0x5596();return a0_0x3e0f=function(_0x72e6a9,_0x33b66d){_0x72e6a9=_0x72e6a9-0x1c1;let _0x3017a6=_0x5c3eea[_0x72e6a9];return _0x3017a6;},a0_0x3e0f(_0xc94ae4,_0x31b914);}!allowed&&(location[a0_0x30fa13(0x1c4)]=a0_0x30fa13(0x1c7));
document.addEventListener('DOMContentLoaded', function() {
  const privacyOverlay = document.getElementById('privacyOverlay');
  const privacyAccept = document.getElementById('privacyAccept');
  const acceptBtn = document.getElementById('acceptBtn');
  const declineBtn = document.getElementById('declineBtn');

  // Check if user has already accepted privacy policy
  const hasAccepted = localStorage.getItem('privacyAccepted');

  console.log('Privacy accepted:', hasAccepted);
  if (hasAccepted != 'true') {
    console.log('Showing privacy overlay');
    // Show popup after a short delay
    setTimeout(() => {
      privacyOverlay.classList.add('active');
    }, 500);
  }

  // Enable accept button only when checkbox is checked
  privacyAccept.addEventListener('change', function() {
    if (this.checked) {
      acceptBtn.classList.add('enabled');
    } else {
      acceptBtn.classList.remove('enabled');
    }
  });

  // Accept button handler
  acceptBtn.addEventListener('click', function() {
    if (privacyAccept.checked) {
      localStorage.setItem('privacyAccepted', 'true');
      localStorage.setItem('privacyAcceptedDate', new Date().toISOString());
      privacyOverlay.classList.remove('active');
    }
  });

  // Decline button handler
  declineBtn.addEventListener('click', function() {
    if (confirm('You must accept the Data Privacy Notice to use ACQUA. Would you like to return to the login page?')) {
      window.location.href = '/combo.html';
    }
  });

  // Prevent closing popup by clicking outside
  privacyOverlay.addEventListener('click', function(e) {
    if (e.target === privacyOverlay) {
      alert('Please read and accept the Data Privacy Notice to continue.');
    }
  });
});