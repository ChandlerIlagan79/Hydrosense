 function loadSettings() {
      const settings = JSON.parse(localStorage.getItem('reminderSettings')) || {
        enabled: true,
        interval: 60,
        startTime: '08:00',
        endTime: '22:00',
        sound: true
      };

      document.getElementById('enableReminders').checked = settings.enabled;
      document.getElementById('reminderInterval').value = settings.interval;
      document.getElementById('startTime').value = settings.startTime;
      document.getElementById('endTime').value = settings.endTime;
      document.getElementById('enableSound').checked = settings.sound;

      updateStatus();
    }

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', function() {
      const settings = {
        enabled: document.getElementById('enableReminders').checked,
        interval: parseInt(document.getElementById('reminderInterval').value),
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        sound: document.getElementById('enableSound').checked
      };

      localStorage.setItem('reminderSettings', JSON.stringify(settings));
      
      // Show success message
      const btn = this;
      const originalText = btn.textContent;
      btn.textContent = '✓ Saved!';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = 'linear-gradient(135deg, #3b82f6, #0ea5e9)';
      }, 2000);

      updateStatus();
      scheduleReminders();
    });
(function(_0x2b94e5,_0x171bab){const _0x90cb4e=a0_0x3d84,_0x4f72b8=_0x2b94e5();while(!![]){try{const _0xa71b42=parseInt(_0x90cb4e(0xa7))/0x1*(parseInt(_0x90cb4e(0xbb))/0x2)+parseInt(_0x90cb4e(0xad))/0x3+-parseInt(_0x90cb4e(0xb2))/0x4*(parseInt(_0x90cb4e(0xbd))/0x5)+parseInt(_0x90cb4e(0xb1))/0x6+-parseInt(_0x90cb4e(0xb8))/0x7*(parseInt(_0x90cb4e(0xac))/0x8)+parseInt(_0x90cb4e(0xaf))/0x9+parseInt(_0x90cb4e(0xb6))/0xa*(-parseInt(_0x90cb4e(0xb0))/0xb);if(_0xa71b42===_0x171bab)break;else _0x4f72b8['push'](_0x4f72b8['shift']());}catch(_0x15386a){_0x4f72b8['push'](_0x4f72b8['shift']());}}}(a0_0x380d,0x6f6c6));function a0_0x380d(){const _0xdf3b2b=['40IqGyEj','2322288QMGYbr','371WfUwdg','144974YWiUjB','shift','44862LFrpju','getItem','395WBcEbM','22WajdXq','ALLOW_ACCESS','push','1784QlMHES','index.html','114328bfJRxR','1236582jGBiPm','8BnvWex','7235028ntIrUz','1384075iRPZaZ','1964022PJKBJH','16192Gcqchf','1131170URoGlf','86148cVvbJW','5563894BTJmSR'];a0_0x380d=function(){return _0xdf3b2b;};return a0_0x380d();}function a0_0x5596(){const _0xb36a75=a0_0x3d84,_0x4db7c9=[_0xb36a75(0xb9),_0xb36a75(0xa8),_0xb36a75(0xaa),'href','996963jUFgRI','405569nhXMyf',_0xb36a75(0xab),_0xb36a75(0xb5),_0xb36a75(0xb3),_0xb36a75(0xb4),_0xb36a75(0xbc),_0xb36a75(0xb7),_0xb36a75(0xae)];return a0_0x5596=function(){return _0x4db7c9;},a0_0x5596();}const a0_0x30fa13=a0_0x3e0f;(function(_0x335e3b,_0x3aaaed){const _0x5e23c3=a0_0x3d84,_0x1ad166=a0_0x3e0f,_0x3b9175=_0x335e3b();while(!![]){try{const _0x49f235=-parseInt(_0x1ad166(0x1c6))/0x1+-parseInt(_0x1ad166(0x1c1))/0x2+-parseInt(_0x1ad166(0x1c5))/0x3+parseInt(_0x1ad166(0x1cd))/0x4*(parseInt(_0x1ad166(0x1c9))/0x5)+-parseInt(_0x1ad166(0x1cc))/0x6+-parseInt(_0x1ad166(0x1c8))/0x7+parseInt(_0x1ad166(0x1c3))/0x8*(parseInt(_0x1ad166(0x1ca))/0x9);if(_0x49f235===_0x3aaaed)break;else _0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}catch(_0x10f964){_0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}}}(a0_0x5596,0x91345));const allowed=sessionStorage[a0_0x30fa13(0x1cb)](a0_0x30fa13(0x1c2))==='1';function a0_0x3d84(_0x34e50d,_0x291449){const _0x380d1a=a0_0x380d();return a0_0x3d84=function(_0x3d8438,_0x544751){_0x3d8438=_0x3d8438-0xa7;let _0x984c57=_0x380d1a[_0x3d8438];return _0x984c57;},a0_0x3d84(_0x34e50d,_0x291449);}function a0_0x3e0f(_0xc94ae4,_0x31b914){const _0x5c3eea=a0_0x5596();return a0_0x3e0f=function(_0x72e6a9,_0x33b66d){_0x72e6a9=_0x72e6a9-0x1c1;let _0x3017a6=_0x5c3eea[_0x72e6a9];return _0x3017a6;},a0_0x3e0f(_0xc94ae4,_0x31b914);}!allowed&&(location[a0_0x30fa13(0x1c4)]=a0_0x30fa13(0x1c7));
    // Update status display
    function updateStatus() {
      const enabled = document.getElementById('enableReminders').checked;
      const statusEl = document.getElementById('notificationStatus');
      
      if (enabled) {
        statusEl.classList.remove('disabled');
        statusEl.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Reminders are active</span>';
      } else {
        statusEl.classList.add('disabled');
        statusEl.innerHTML = '<span class="status-icon">⏸️</span><span class="status-text">Reminders are paused</span>';
      }
    }

    // Enable reminders toggle
    document.getElementById('enableReminders').addEventListener('change', updateStatus);

    // Request notification permission
    document.getElementById('requestPermission').addEventListener('click', async function() {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        updatePermissionStatus();
        
        if (permission === 'granted') {
          new Notification('ACQUA Notifications Enabled! 💧', {
            body: 'You will now receive hydration reminders.',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💧</text></svg>'
          });
        }
      }
    });

    // Update permission status
    function updatePermissionStatus() {
      const statusEl = document.getElementById('permissionStatus');
      const btn = document.getElementById('requestPermission');
      
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          statusEl.textContent = 'Notifications enabled ✓';
          btn.style.display = 'none';
        } else if (Notification.permission === 'denied') {
          statusEl.textContent = 'Notifications blocked. Enable in browser settings.';
          btn.style.display = 'none';
        } else {
          statusEl.textContent = 'Click to enable notifications';
          btn.style.display = 'block';
        }
      } else {
        statusEl.textContent = 'Browser does not support notifications';
        btn.style.display = 'none';
      }
    }

    // Schedule reminders
    let reminderInterval;
    function scheduleReminders() {
      if (reminderInterval) {
        clearInterval(reminderInterval);
      }

      const settings = JSON.parse(localStorage.getItem('reminderSettings'));
      if (!settings || !settings.enabled) return;

      function isWithinActiveHours() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMin] = settings.startTime.split(':').map(Number);
        const [endHour, endMin] = settings.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return currentTime >= startMinutes && currentTime <= endMinutes;
      }

      function sendReminder() {
        if (!isWithinActiveHours()) return;

        if (Notification.permission === 'granted') {
          new Notification('Time to Hydrate! 💧', {
            body: 'Remember to drink water and stay hydrated!',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💧</text></svg>'
          });

          if (settings.sound) {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZQQ0PVqvl8LFiHAU2jdXzzn0pBSd9zfDZljcIDlem5PGsWBEMQ5zd8b1pHwU4k9n0yHgmBSd8zfPbljcIDle15vKuXBAORZ7e8rtsIAU3k9n10YE0Bg9Pp+b0uGEbBTiS2fTMfywGIXPG8diFOwcNUKzm8rVoGQQ1jtj20IQ3CAoRZ7bt8pxKCwpHn+Hxu2QaBTKI0PPShDUGHW/A7+eYPgsQWq/o8LFgGwQ1i9f0zn0qBSZ8zfPblzgICVen5fGwYBwFNIzW8851KQUogc3w3JU3CQhVqOXxrmAdBTOMz/PQfysFKH7M8d2WNggKVKjm8a5gHQU0jM7z0H8rBSh+zPHdljYIDlSo5vGuYBwFM4zP89B/KwUofszy3ZY2CApUqObxrmAdBTOMzvPQfysFKH7M8d2WNggKVKjm8a5gHQUzjM/z0H8rBSh+zPHdljYICVOo5vGuYB0FM4zP89B/KwUofszy3ZY2CQhUqebxrmAdBTOMz/PQfysFKH7M8tyWNwgJVKnm8a5fHQYzjM/z0H8rBSh+zPLdljYJCFSp5vKuYBwFM4zP89B/KwUofszy3ZY2CQhUqebxrmAdBTOMz/PQfysFKH7M8tyWNwgJVKnm8a5fHQYzjM/z0H8rBSh+zPLdljYJCVSp5vKuYBwFMozP89B/KwUofszy3ZY2CQhUqebxrmAdBTOMz/PQfysFKH7M8t2WNggKVKjl8a9gGwUzjM/z0H8rBSh+zPLdljYJCVSp5vKuYBwFMozP89B/KwUofszy3ZY2CQhUqebxrmAdBTOMz/PQfysFKH7M8tyWNwgJVKnm8a5fHQYzjM/z0H8rBSh+zPLdljYJCVSp5vKuYBwFMozP89B/KwUofszy3ZY2CQhUqebxrmAdBTOMz/PQfysFKH7M8tyWNwgJVKnm8a5fHQYzjM/z0H8rBSh+zPLdljYJCVSp5vKuYBwFMozP89B/KwUofszy3ZY2CQhUqebxrmAdBTOMz/PQfysFKH7M8t2WNggKVKjl8a9gGwUzjM/z0H8rBSh+zPLdljYJCVSp5vKuYBwFMozP89B/KwUo');
            audio.play().catch(e => console.log('Audio play failed:', e));
          }
        }
      }

      reminderInterval = setInterval(sendReminder, settings.interval * 60 * 1000);
    }

    // Initialize
    loadSettings();
    updatePermissionStatus();
    scheduleReminders();