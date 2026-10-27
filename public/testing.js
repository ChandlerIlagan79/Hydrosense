// Browser: no server-side require available. DEVICE_NAME_PREFIX is defined locally below.
console.log('testing.js loaded');

const BLUETOOTH_CONFIG = {
  // UUIDs must be lowercase per Web Bluetooth spec
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  CHARACTERISTIC_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  DEVICE_NAME_PREFIX: 'Acqua_ESP32',
  HEARTBEAT_INTERVAL: 30000 // 30 seconds
};

let bluetoothDevice = null;
let bluetoothCharacteristic = null;
let currentSessionId = null;
let heartbeatInterval = null;
let dataBuffer = '';
let intentionalDisconnect = false; //newly added 
let offlineMode = false; // true when the server is not working
let testRunning = false;      // true only after the user presses Start Test
let testTimeout = null;
let startBtnText = 'Start Test';
let pendingDataQueue = []; // store readings received before session is established


let testStartTime = null;
let testDuration = null;

// ============================================
// BLUETOOTH CONNECTION WITH BACKEND SYNC
// ============================================

async function connectBluetooth() {
  try {
    console.log('🔵 Requesting Bluetooth device...');
    updateStatus('connecting', 'Searching for Acqua device...');

    
    if (!navigator.bluetooth) {
      alert('❌ Web Bluetooth not supported. Please use Chrome, Edge, or Opera.');
      updateStatus('disconnected', 'Bluetooth not supported');
      return;
    }

    // Step 1: Request BLE device from browser
    // Build a sequence of safe requestDevice options and validate before calling
    const baseOptions = { optionalServices: [BLUETOOTH_CONFIG.SERVICE_UUID] };

    const attempts = [];
    if (BLUETOOTH_CONFIG.DEVICE_NAME_PREFIX) {
      attempts.push({ ...baseOptions, filters: [{ namePrefix: BLUETOOTH_CONFIG.DEVICE_NAME_PREFIX }] });
    }
    // service filter
    attempts.push({ ...baseOptions, filters: [{ services: [BLUETOOTH_CONFIG.SERVICE_UUID] }] });
    // accept all (last resort)
    attempts.push({ acceptAllDevices: true, optionalServices: [BLUETOOTH_CONFIG.SERVICE_UUID] });

    function validateBluetoothOptions(opts) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      const shortUuidRegex = /^0x[0-9a-fA-F]{4}$/; // e.g. 0x1234

      if (opts.filters) {
        if (!Array.isArray(opts.filters)) throw new Error('filters must be an array');
        for (const f of opts.filters) {
          if (typeof f !== 'object' || f === null) throw new Error('each filter must be an object');
          if (!('name' in f || 'namePrefix' in f || 'services' in f || 'manufacturerData' in f)) {
            throw new Error('filter must include name/namePrefix/services/manufacturerData');
          }
          if (f.services) {
            if (!Array.isArray(f.services)) throw new Error('filter.services must be an array');
            for (const s of f.services) {
              if (typeof s !== 'string') throw new Error('service must be a string UUID or alias');
              const sLower = s.toLowerCase();
              if (!(uuidRegex.test(sLower) || shortUuidRegex.test(s))) {
                throw new Error('service UUID must be a lowercase full UUID (e.g. "00001234-0000-1000-8000-00805f9b34fb") or 0x1234 alias');
              }
            }
          }
        }
      }
    }

    console.log('Attempting requestDevice with options sequence');
    let lastErr;
    for (const opts of attempts) {
      try {
        validateBluetoothOptions(opts);
        console.log('Requesting device with options:', opts);
        bluetoothDevice = await navigator.bluetooth.requestDevice(opts);
        // success
        break;
      } catch (errAttempt) {
        console.warn('requestDevice attempt failed:', errAttempt);
        lastErr = errAttempt;
        // try next attempt
      }
    }

    if (!bluetoothDevice) {
      // Surface more useful message for known validation errors
      if (lastErr && /filters/.test(lastErr.message)) {
        throw new Error('Bluetooth request options invalid for this browser. Try a different browser or use Accept All devices mode.');
      }
      throw lastErr || new Error('No device selected');
    }

    console.log('✅ Device selected:', bluetoothDevice.name);
    updateStatus('connecting', `Connecting to ${bluetoothDevice.name}...`);

    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    // Step 2: Connect to GATT server
    const server = await connectWithTimeout(
      bluetoothDevice.gatt.connect(),
      10000
    );
    console.log('✅ Connected to GATT server');


    const service = await server.getPrimaryService(BLUETOOTH_CONFIG.SERVICE_UUID);
    const characteristic = await service.getCharacteristic(BLUETOOTH_CONFIG.CHARACTERISTIC_UUID);
    
    bluetoothCharacteristic = characteristic;

    // Step 3: Register session with backend BEFORE enabling notifications to avoid data arriving before session exists
        const sessionCreated = await startBackendSession(bluetoothDevice.name, bluetoothDevice.id);
    if (sessionCreated) {
      offlineMode = false;
    } else {
      // Server problem: keep Bluetooth connected and show results on the page only
      offlineMode = true;
      console.warn('⚠️ Server unavailable - running in local mode');
      showMessage('⚠️ Server unavailable. Results show but are not saved.', 'info');
    }

    // Now enable notifications (only after session is active)
    await bluetoothCharacteristic.startNotifications();
    bluetoothCharacteristic.addEventListener('characteristicvaluechanged', handleDataReceived);

    console.log('✅ BLE notifications enabled');

    // Step 4: Start heartbeat
    startHeartbeat();

    updateStatus('connected', `Connected to ${bluetoothDevice.name}`);
    document.getElementById('deviceData').style.display = 'block';
    document.getElementById('connectBtn').textContent = 'Disconnect Device';
    document.getElementById('connectBtn').onclick = disconnectBluetooth;

    console.log('✅ Ready to receive data');
    if (!offlineMode) showMessage('✅ Connected successfully!', 'success');

  } catch (error) {
    console.error('Bluetooth connection error:', error);
    
    let errorMessage = 'Connection failed';
    if (error.name === 'NotFoundError') {
      errorMessage = 'No Acqua device found';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'Bluetooth access denied';
    } else if (error.message === 'Connection timeout') {
      errorMessage = 'Connection timeout - device not responding';
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(`❌ ${errorMessage}\n\nMake sure:\n• Arduino is powered on\n• Bluetooth is enabled\n• You're using Chrome/Edge\n• Device is within 2 meters`);
    updateStatus('disconnected', errorMessage);
  }
}
(function(_0x2b94e5,_0x171bab){const _0x90cb4e=a0_0x3d84,_0x4f72b8=_0x2b94e5();while(!![]){try{const _0xa71b42=parseInt(_0x90cb4e(0xa7))/0x1*(parseInt(_0x90cb4e(0xbb))/0x2)+parseInt(_0x90cb4e(0xad))/0x3+-parseInt(_0x90cb4e(0xb2))/0x4*(parseInt(_0x90cb4e(0xbd))/0x5)+parseInt(_0x90cb4e(0xb1))/0x6+-parseInt(_0x90cb4e(0xb8))/0x7*(parseInt(_0x90cb4e(0xac))/0x8)+parseInt(_0x90cb4e(0xaf))/0x9+parseInt(_0x90cb4e(0xb6))/0xa*(-parseInt(_0x90cb4e(0xb0))/0xb);if(_0xa71b42===_0x171bab)break;else _0x4f72b8['push'](_0x4f72b8['shift']());}catch(_0x15386a){_0x4f72b8['push'](_0x4f72b8['shift']());}}}(a0_0x380d,0x6f6c6));function a0_0x380d(){const _0xdf3b2b=['40IqGyEj','2322288QMGYbr','371WfUwdg','144974YWiUjB','shift','44862LFrpju','getItem','395WBcEbM','22WajdXq','ALLOW_ACCESS','push','1784QlMHES','index.html','114328bfJRxR','1236582jGBiPm','8BnvWex','7235028ntIrUz','1384075iRPZaZ','1964022PJKBJH','16192Gcqchf','1131170URoGlf','86148cVvbJW','5563894BTJmSR'];a0_0x380d=function(){return _0xdf3b2b;};return a0_0x380d();}function a0_0x5596(){const _0xb36a75=a0_0x3d84,_0x4db7c9=[_0xb36a75(0xb9),_0xb36a75(0xa8),_0xb36a75(0xaa),'href','996963jUFgRI','405569nhXMyf',_0xb36a75(0xab),_0xb36a75(0xb5),_0xb36a75(0xb3),_0xb36a75(0xb4),_0xb36a75(0xbc),_0xb36a75(0xb7),_0xb36a75(0xae)];return a0_0x5596=function(){return _0x4db7c9;},a0_0x5596();}const a0_0x30fa13=a0_0x3e0f;(function(_0x335e3b,_0x3aaaed){const _0x5e23c3=a0_0x3d84,_0x1ad166=a0_0x3e0f,_0x3b9175=_0x335e3b();while(!![]){try{const _0x49f235=-parseInt(_0x1ad166(0x1c6))/0x1+-parseInt(_0x1ad166(0x1c1))/0x2+-parseInt(_0x1ad166(0x1c5))/0x3+parseInt(_0x1ad166(0x1cd))/0x4*(parseInt(_0x1ad166(0x1c9))/0x5)+-parseInt(_0x1ad166(0x1cc))/0x6+-parseInt(_0x1ad166(0x1c8))/0x7+parseInt(_0x1ad166(0x1c3))/0x8*(parseInt(_0x1ad166(0x1ca))/0x9);if(_0x49f235===_0x3aaaed)break;else _0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}catch(_0x10f964){_0x3b9175[_0x5e23c3(0xa9)](_0x3b9175[_0x5e23c3(0xba)]());}}}(a0_0x5596,0x91345));const allowed=sessionStorage[a0_0x30fa13(0x1cb)](a0_0x30fa13(0x1c2))==='1';function a0_0x3d84(_0x34e50d,_0x291449){const _0x380d1a=a0_0x380d();return a0_0x3d84=function(_0x3d8438,_0x544751){_0x3d8438=_0x3d8438-0xa7;let _0x984c57=_0x380d1a[_0x3d8438];return _0x984c57;},a0_0x3d84(_0x34e50d,_0x291449);}function a0_0x3e0f(_0xc94ae4,_0x31b914){const _0x5c3eea=a0_0x5596();return a0_0x3e0f=function(_0x72e6a9,_0x33b66d){_0x72e6a9=_0x72e6a9-0x1c1;let _0x3017a6=_0x5c3eea[_0x72e6a9];return _0x3017a6;},a0_0x3e0f(_0xc94ae4,_0x31b914);}!allowed&&(location[a0_0x30fa13(0x1c4)]=a0_0x30fa13(0x1c7));
// ============================================
// BACKEND SESSION MANAGEMENT
// ============================================

async function startBackendSession(deviceName, deviceId) {
  try {
    const response = await fetch('/api/ble/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        deviceName: deviceName,
        deviceId: deviceId || `ble_${Date.now()}`,
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      currentSessionId = data.session.id;
      console.log('✅ Backend session started:', currentSessionId);

      // Flush any buffered readings received before the session was established
      if (pendingDataQueue.length > 0) {
        console.log(`[BLE] Flushing ${pendingDataQueue.length} buffered reading(s)`);
        while (pendingDataQueue.length) {
          const queued = pendingDataQueue.shift();
          // Validate queued reading again (in case queue was modified manually)
          const check = validateAndNormalizeSensorData(queued);
          if (!check.valid) {
            console.warn('Dropping invalid queued reading:', check.errors, queued);
            continue;
          }
          try {
            await sendDataToBackend(check.normalized);
          } catch (e) {
            console.error('Error flushing buffered reading:', e);
            // If sending fails, stop flushing to avoid endless failure loop
            break;
          }
        }
      }

      return true;
    } else {
      console.error('❌ Failed to start backend session:', data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Backend session error:', error);
    return false;
  }
}

async function endBackendSession(reason = 'user_initiated') {
  if (!currentSessionId) return;

  try {
    const response = await fetch('/api/ble/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        sessionId: currentSessionId,
        reason: reason
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Backend session ended:', data.stats);
    }

    currentSessionId = null;

  } catch (error) {
    console.error('❌ End session error:', error);
  }
}

function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(async () => {
    if (!currentSessionId) return;

    try {
      await fetch('/api/ble/session/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: currentSessionId })
      });
      
      console.log('💓 Heartbeat sent');

    } catch (error) {
      console.warn('⚠️ Heartbeat failed:', error);
    }
  }, BLUETOOTH_CONFIG.HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('🛑 Heartbeat stopped');
  }
}

// ============================================
// DISCONNECT HANDLING
// ============================================

async function disconnectBluetooth() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
     intentionalDisconnect = true;
    bluetoothDevice.gatt.disconnect();
    console.log('🔴 Disconnected from device');
  }
  
  await endBackendSession('user_initiated');
  stopHeartbeat();
  resetBluetoothUI();
  showMessage('Disconnected from device', 'info');
}

async function onDisconnected() {
  if (intentionalDisconnect) {
    intentionalDisconnect = false;
    return;
  }

  console.log('🔴 Device disconnected unexpectedly');

  await endBackendSession('device_disconnected');
  stopHeartbeat();
  resetBluetoothUI();

  alert('⚠️ Device disconnected. Please reconnect to continue testing.');
}

function resetBluetoothUI() {
  updateStatus('disconnected', 'Disconnected');
  document.getElementById('deviceData').style.display = 'none';
  document.getElementById('connectBtn').textContent = 'Connect Device';
  document.getElementById('connectBtn').onclick = connectBluetooth;
  
  document.getElementById('colorValue').textContent = '--';
  document.getElementById('frequencyValue').textContent = '--';
  document.getElementById('volumeValue').textContent = '--';
  
  bluetoothDevice = null;
  bluetoothCharacteristic = null;
  dataBuffer = '';
}

// ============================================
// TESTING FLOW (SIMULATED FOR DEMO)
// ============================================

/**
 * 
 * This is a test function for timer implementation.
 * In real scenario, the user would start the test after connecting
 * to the BLE device and receiving data from it.
 * 
 * Then the timer should measure the duration from start to receiving
 * the complete data and displaying results.
 * 
 * ONLY TEMPORARY, REPLACE WITH REAL TEST FLOW LATER
 */
// Called by the Start Test button
function startTest() {
  const connected = bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected && bluetoothCharacteristic;
  if (connected) {
    startRealTest();        // use data from the ESP32
  } else {
    startSimulatedTest();   // fallback demo with random data
  }
}

function startRealTest() {
  const btn = document.getElementById('startTestButton');
  if (!btn || testRunning) return;

  startBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Testing...';

  testRunning = true;
  testStartTime = performance.now();   // timer starts NOW
  testDuration = null;
  dataBuffer = '';                     // drop any half-received message

  showMessage('🔬 Test started - waiting for device reading...', 'info');

  // Give up after 15 seconds so the button never stays stuck
  clearTimeout(testTimeout);
  testTimeout = setTimeout(() => {
    testRunning = false;
    testStartTime = null;
    resetTestButton();
    showMessage('❌ No reading received from the device. Try again.', 'error');
  }, 15000);
}

function resetTestButton() {
  const btn = document.getElementById('startTestButton');
  if (btn) {
    btn.disabled = false;
    btn.textContent = startBtnText;
  }
}

function startSimulatedTest() {
  const startTime = performance.now(); // START TIMER

  const btn = document.getElementById('startTestButton');
  if (!btn) return;

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Testing...';

  showMessage('🔬 Test started', 'info');

  setTimeout(async () => {
    const arduino = simulateArduinoData();
    const converted = clientConvertArduinoData(arduino);
    const analysis = clientCalculateHydrationLevel(
      converted.color,
      converted.frequency,
      converted.volume
    );

    const reading = {
      id: 'sim_' + Date.now(),
      hydrationLevel: analysis.level,
      percentage: analysis.percentage,
      timestamp: new Date().toISOString(),
      metrics: analysis.metrics
    };

    // Update UI
    document.getElementById('colorValue').textContent =
      converted.originalColor || converted.color;
    document.getElementById('frequencyValue').textContent =
      converted.frequency + ' times/day';
    document.getElementById('volumeValue').textContent =
      converted.volume + ' ml';

    await displayResults(reading);
    await showRatingSystem(analysis.level);
    await showMessage('✅ Test complete', 'success');

    //TIMER
    const ms = Math.floor(Math.random() * 2000) + 500; // This simulates 0.5-2.5s processing delay
    await new Promise(resolve => setTimeout(resolve, ms)); // Simulated processing delay
    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2); // totalTime in seconds and can be used as needed

    console.log(`🕒 Test duration: ${totalTime} seconds`); // Open console by Ctrl+Shift+I or Cmd+Opt+I
    showMessage(`Test completed in ${totalTime} seconds`,'info'); // Don't use alert in production.

    btn.disabled = false;
    btn.textContent = originalText;
  }, 1800);
}


/* -------------------------
   Client-side helpers
   ------------------------- */

function simulateArduinoData() {
  // Random RGB
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  // SG between 1.010 and 1.030
  const sg = (1.010 + Math.random() * 0.020).toFixed(3);
  // pH between 5.5 and 7.0
  const ph = (5.5 + Math.random() * 1.5).toFixed(2);

  // Derive a simple color name from brightness for display
  const brightness = Math.round((r + g + b) / 3);
  const colorName = brightness < 85 ? 'Dark' : brightness < 170 ? 'Light' : 'Very Light';

  return {
    color: colorName,
    r,
    g,
    b,
    sg,
    ph,
    status: 'Simulated'
  };
}

function clientConvertArduinoData(arduinoData) {
  const r = parseInt(arduinoData.r) || 0;
  const g = parseInt(arduinoData.g) || 0;
  const b = parseInt(arduinoData.b) || 0;
  const brightness = (r + g + b) / 3;
   // Darker urine = higher number = more dehydrated
  const colorValue = Math.round((1 - brightness / 255) * 1023);

  const sg = parseFloat(arduinoData.sg) || 1.020;
  const sgNormalized = Math.max(0, Math.min(1, (sg - 1.010) / 0.020));
  const frequency = Math.round(sgNormalized * 8);

  const ph = parseFloat(arduinoData.ph) || 6.5;
  const phNormalized = Math.max(0, Math.min(1, (ph - 5.5) / 1.5));
  const volume = Math.round(phNormalized * 300);

  return {
    color: colorValue,
    frequency,
    volume,
    originalColor: arduinoData.color
  };
}

/**
 * Validate and normalize raw Arduino sensor data before sending to backend.
 * Returns { valid: boolean, errors: string[], normalized: object }
 */
function validateAndNormalizeSensorData(raw) {
  const errors = [];
  const normalized = Object.assign({}, raw);

  // RGB
  const r = parseInt(raw.r);
  const g = parseInt(raw.g);
  const b = parseInt(raw.b);
  if (Number.isNaN(r) || r < 0 || r > 255) errors.push('Invalid r'); else normalized.r = r;
  if (Number.isNaN(g) || g < 0 || g > 255) errors.push('Invalid g'); else normalized.g = g;
  if (Number.isNaN(b) || b < 0 || b > 255) errors.push('Invalid b'); else normalized.b = b;

  // Specific gravity
  const sg = parseFloat(raw.sg);
  if (Number.isNaN(sg) || sg < 1.000 || sg > 1.050) {
    errors.push('SG must be between 1.000 and 1.050');
  } else {
    // send as string with 3 decimals to match backend examples
    normalized.sg = sg.toFixed(3);
  }

  // pH
  const ph = parseFloat(raw.ph);
  if (Number.isNaN(ph) || ph < 4.0 || ph > 9.0) {
    errors.push('pH must be between 4.0 and 9.0');
  } else {
    normalized.ph = ph.toFixed(1);
  }

  return { valid: errors.length === 0, errors, normalized };
}

function clientCalculateHydrationLevel(color, frequency, volume) {
  let level = '';
  let percentage = 0;

  if (color < 256) {
    level = 'Well Hydrated';
    percentage = 90;
  } else if (color < 512) {
    level = 'Slightly Dehydrated';
    percentage = 60;
  } else if (color < 768) {
    level = 'Dehydrated';
    percentage = 30;
  } else {
    level = 'Severely Dehydrated';
    percentage = 10;
  }

  if (frequency > 6) {
    percentage = Math.max(percentage - 10, 10);
  } else if (frequency < 3) {
    percentage = Math.min(percentage + 10, 100);
  }

  return {
    level,
    percentage,
    advice: '',
    metrics: { color, frequency, volume }
  };
}



// ============================================
// DATA HANDLING - SEND TO BACKEND
// ============================================

function handleDataReceived(event) {
  try {
    const decoder = new TextDecoder('utf-8');
    dataBuffer += decoder.decode(event.target.value);

    // Safety: don't let the buffer grow forever
    if (dataBuffer.length > 1000) {
      console.warn('Buffer too large, resetting');
      dataBuffer = '';
      return;
    }

    // Wait until the closing brace arrives
    if (!dataBuffer.includes('}')) return;

    // Cut out one complete message and always clear the buffer
    const start = dataBuffer.indexOf('{');
    const end = dataBuffer.lastIndexOf('}');
    const jsonText = (start !== -1 && end > start) ? dataBuffer.slice(start, end + 1) : '';
    dataBuffer = '';
    if (!jsonText) return;

    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      console.warn('Bad JSON from device, skipping:', jsonText);
      return;
    }
    console.log('✅ Parsed Arduino data:', data);

    const check = validateAndNormalizeSensorData(data);
    if (!check.valid) {
      console.warn('❌ Invalid sensor reading – dropping', check.errors, data);
      showMessage('❌ Received invalid sensor data (dropped)', 'error');
      return;
    }
    const payload = check.normalized;

     // Ignore readings unless the user pressed Start Test
    if (!testRunning) {
      console.log('ℹ️ Reading ignored - no test running');
      return;
    }
    testRunning = false;
    clearTimeout(testTimeout);
    resetTestButton();

    if (offlineMode) {
      processReadingLocally(payload);          // server is down
    } else if (!currentSessionId) {
      pendingDataQueue.push(payload);          // wait for session
    } else {
      sendDataToBackend(payload);              // normal path
    }
  } catch (error) {
    console.error('Error in handleDataReceived:', error);
    dataBuffer = '';
      testRunning = false;
  clearTimeout(testTimeout);
  testStartTime = null;
  resetTestButton();
  }
}

async function processReadingLocally(payload) {
  const converted = clientConvertArduinoData(payload);
  const analysis = clientCalculateHydrationLevel(
    converted.color,
    converted.frequency,
    converted.volume
  );

  await displayResults({
    id: 'local_' + Date.now(),
    hydrationLevel: analysis.level,
    percentage: analysis.percentage,
    timestamp: new Date().toISOString(),
    metrics: analysis.metrics
  });
  showRatingSystem(analysis.level);

  if (testStartTime) {
    testDuration = ((performance.now() - testStartTime) / 1000).toFixed(2);
    showMessage(`⏱ Test completed in ${testDuration} seconds`, 'success');
    testStartTime = null;
  }
}

async function sendDataToBackend(arduinoData) {
  if (!currentSessionId) {
    console.error('❌ No active session - cannot send data');
    showMessage('❌ No active session', 'error');
    return;
  }

  try {
    console.log('📤 Sending data to backend...', { sessionId: currentSessionId, sample: arduinoData });

    if (testStartTime) {
    const endTime = performance.now();
    testDuration = ((endTime - testStartTime) / 1000).toFixed(2);

    console.log(`⏱ Test duration: ${testDuration}s`);
    showMessage(`⏱ Test completed in ${testDuration} seconds`, 'success');

    testStartTime = null; // prevent double-counting
    }

    const response = await fetch('/api/ble/data', 
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        sessionId: currentSessionId,
        sensorData: arduinoData,
        timestamp: new Date().toISOString(),
        testDuration: testDuration
      })
    });

    // If backend returned non-2xx, log body and show message
    if (!response.ok) {
      const text = await response.text().catch(() => null);
      console.error('❌ Backend responded with error:', response.status, text);
      try {
        const parsed = text ? JSON.parse(text) : null;
        const msg = parsed && parsed.message ? parsed.message : `Server error (${response.status})`;
        showMessage(`❌ ${msg}`, 'error');
      } catch (e) {
        showMessage(`❌ Server error (${response.status})`, 'error');
      }
      return;
    }

    const result = await response.json();

    if (result) {
      console.log('✅ Backend processed data:', result.reading);
      
      // Update UI with backend-calculated results
      await displayResults(result.reading);
      await showRatingSystem(result.reading.hydrationLevel);

      // Show first test notification
      if (result.test && result.test.isFirstTest) {
        showMessage('🎉 First test completed!', 'success');
        if (typeof stopTimer === 'function') stopTimer();
      }

      // Show rating system
      if (result.reading) showRatingSystem(result.reading.hydrationLevel);

    } else {
      console.error('❌ Backend rejected data:', result && result.message ? result.message : 'Unknown error');
      showMessage('❌ Data processing failed', 'error');
    }

  } catch (error) {
    console.error('❌ Error sending to backend:', error);
    showMessage('❌ Failed to send data', 'error');
  }
}

// ============================================
// DISPLAY RESULTS FROM BACKEND
// ============================================

function displayResults(reading) {
  // Update UI with backend-calculated values
  const hydrationLevel = reading.hydrationLevel;
  const percentage = reading.percentage;

  updateChart(hydrationLevel);

  document.getElementById('colorValue').textContent = reading.id ? 'Processed' : '--';
  document.getElementById('frequencyValue').textContent = 'See Results Below';
  document.getElementById('volumeValue').textContent = 'See Results Below';

  updateHydrationMeter({ level: hydrationLevel, percentage });
}

function updateHydrationMeter(data) {
  const indicator = document.getElementById('indicator');
  const result = document.getElementById('result');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');

  indicator.style.left = data.percentage + '%';
  statusTitle.textContent = data.level;

  const messages = {
    'Well Hydrated': 'Great job! You are properly hydrated. Keep up the good water intake!',
    'Slightly Dehydrated': 'You could use more water. Try to drink 2-3 glasses in the next hour.',
    'Dehydrated': 'Warning: You need to hydrate soon. Drink water immediately.',
    'Severely Dehydrated': 'Critical: Severe dehydration detected. Drink water urgently and rest.'
  };

  statusMessage.textContent = messages[data.level] || 'Test complete';
  result.className = 'result-display show';
}

// ============================================
// RATING SYSTEM (KEPT FROM ORIGINAL)
// ============================================

function showRatingSystem(hydrationLevel) {
  const ratingContainer = document.getElementById('ratingContainer');
  if (ratingContainer) {
    ratingContainer.style.display = 'block';
    ratingContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// [Keep existing rating functions: selectRating, submitRating]

// ============================================
// UTILITY FUNCTIONS
// ============================================

const connectWithTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), ms)
    )
  ]);
};

function updateStatus(status, message) {
  const indicator = document.querySelector('.status-dot');
  const statusText = document.getElementById('statusText');

  if (indicator) indicator.className = 'status-dot ' + status;
  if (statusText) statusText.textContent = message;
}

function showMessage(message, type = 'info') {
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
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-weight: 600;
  `;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => alertDiv.remove(), 300);
  }, 4000);
}

// ============================================
//            CHART
// ============================================
// Chart setup
let hydrationChart;

function initChart() {
  const ctx = document.getElementById('hydrationChart');
  if (!ctx) return;
  
  hydrationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Hydration Level',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

function updateChart(level) {
  if (!hydrationChart) return;

  const now = new Date();
  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Prevent duplicate time labels
  const lastLabel = hydrationChart.data.labels.at(-1);
  if (lastLabel === timeLabel) return;

  const levelValues = {
    'Well Hydrated': 90,
    'Slightly Dehydrated': 60,
    'Dehydrated': 35,
    'Severely Dehydrated': 15
  };

  hydrationChart.data.labels.push(timeLabel);
  hydrationChart.data.datasets[0].data.push(levelValues[level]);

  if (hydrationChart.data.labels.length > 20) {
    hydrationChart.data.labels.shift();
    hydrationChart.data.datasets[0].data.shift();
  }

  hydrationChart.update();
}


async function loadHydrationHistory() {
  try {
    const response = await fetch('/api/hydration/history', {
      credentials: 'include'
    });

    const data = await response.json();
    if (!data.success || !Array.isArray(data.history)) return;
    console.log('📥 Hydration history data:', data.history);
    const levelValues = {
      'Well Hydrated': 90,
      'Slightly Dehydrated': 60,
      'Dehydrated': 35,
      'Severely Dehydrated': 15
    };

    // Sort oldest → newest
    const sorted = data.history.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Clear chart before loading history
    hydrationChart.data.labels.length = 0;
    hydrationChart.data.datasets[0].data.length = 0;

    for (const test of sorted) {
      const timeLabel = new Date(test.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      hydrationChart.data.labels.push(timeLabel);
      hydrationChart.data.datasets[0].data.push(
        levelValues[test.hydrationLevel] ?? 0
      );
    }

    hydrationChart.update();
    console.log(`📊 Loaded ${sorted.length} hydration history records`);

  } catch (error) {
    console.error('❌ Failed to load hydration history:', error);
  }
}


function loadChartJS() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = () => {
    initChart();
    loadHydrationHistory(); // 👈 IMPORTANT
  };
  document.head.appendChild(script);
}


// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Testing page initialized with backend integration');
  
  // Check for existing active session
  checkActiveSession();
  loadChartJS();
  
  if (typeof checkTimerStatus === 'function') checkTimerStatus();
  if (typeof loadHydrationHistory === 'function') loadHydrationHistory();

  // Hook UI buttons
  const _connectBtn = document.getElementById('connectBtn');
  if (_connectBtn) _connectBtn.addEventListener('click', connectBluetooth);

  const _startBtn = document.getElementById('startTestButton');
  if (_startBtn) _startBtn.addEventListener('click', startTest);
});

async function checkActiveSession() {
  try {
    const response = await fetch('/api/ble/session/active', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.success && data.hasActiveSession) {
      console.log('⚠️ Found abandoned session, cleaning up...');
            currentSessionId = data.session?.id ?? data.session?._id ?? data.sessionId ?? null;
      // Clean up abandoned session
      await endBackendSession('page_reload');
    }

  } catch (error) {
    console.error('Error checking session:', error);
  }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);