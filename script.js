let currentQRData = null;
let currentQRText = '';
let isGenerating = false;

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    
    // Load with sample data
    document.getElementById('textContent').value = 'Welcome to our elegant QR code generator!';
    generateQR();
});

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (!this.classList.contains('active')) {
                const type = this.dataset.type;
                switchDataType(type);
            }
        });
    });

    // Size range update
    const sizeRange = document.getElementById('sizeRange');
    const sizeDisplay = document.getElementById('sizeDisplay');
    
    sizeRange.addEventListener('input', function() {
        sizeDisplay.textContent = this.value + 'px';
    });

    // Generate on Enter (for single inputs)
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !isGenerating) {
            e.preventDefault();
            generateQR();
        }
    });

    // Input validation
    document.addEventListener('input', function(e) {
        if (e.target.matches('input[type="email"]')) {
            validateEmail(e.target);
        }
        if (e.target.matches('input[type="url"]')) {
            validateURL(e.target);
        }
        if (e.target.matches('input[type="tel"]')) {
            validatePhone(e.target);
        }
    });
}

function switchDataType(type) {
    // Update active tab
    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');

    // Show corresponding form
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${type}-form`).classList.add('active');
    
    // Clear any error messages
    clearMessages();
}

function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (input.value && !emailRegex.test(input.value)) {
        input.style.borderColor = '#dc2626';
    } else {
        input.style.borderColor = '#d4a574';
    }
}

function validateURL(input) {
    if (input.value && input.value.length > 0) {
        try {
            new URL(input.value.startsWith('http') ? input.value : 'https://' + input.value);
            input.style.borderColor = '#d4a574';
        } catch {
            input.style.borderColor = '#dc2626';
        }
    } else {
        input.style.borderColor = '#d4a574';
    }
}

function validatePhone(input) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (input.value && !phoneRegex.test(input.value.replace(/[-\s\(\)]/g, ''))) {
        input.style.borderColor = '#dc2626';
    } else {
        input.style.borderColor = '#d4a574';
    }
}

async function generateQR() {
    if (isGenerating) return;
    
    isGenerating = true;
    const generateButton = document.getElementById('generateButton');
    const originalText = generateButton.innerHTML;
    generateButton.innerHTML = '<span class="loading"></span> Generating...';
    generateButton.disabled = true;

    try {
        const activeType = document.querySelector('.type-tab.active').dataset.type;
        const data = collectFormData(activeType);
        
        if (!data || data.trim() === '') {
            throw new Error('Please fill in the required fields.');
        }

        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await createQRCode(data, activeType);
    } catch (error) {
        showError(error.message);
    } finally {
        isGenerating = false;
        generateButton.innerHTML = originalText;
        generateButton.disabled = false;
    }
}

function collectFormData(type) {
    let data = '';
    
    try {
        switch(type) {
            case 'text':
                data = document.getElementById('textContent').value.trim();
                break;
            
            case 'url':
                const url = document.getElementById('urlInput').value.trim();
                if (url) {
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        data = 'https://' + url;
                    } else {
                        data = url;
                    }
                    // Validate URL
                    new URL(data);
                }
                break;
            
            case 'email':
                const email = document.getElementById('emailAddress').value.trim();
                const subject = document.getElementById('emailSubject').value.trim();
                const body = document.getElementById('emailBody').value.trim();
                
                if (email) {
                    // Validate email
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        throw new Error('Please enter a valid email address.');
                    }
                    
                    data = `mailto:${email}`;
                    const params = [];
                    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                    if (body) params.push(`body=${encodeURIComponent(body)}`);
                    if (params.length > 0) data += '?' + params.join('&');
                }
                break;
            
            case 'phone':
                const phone = document.getElementById('phoneNumber').value.trim();
                if (phone) {
                    const cleanPhone = phone.replace(/[-\s\(\)]/g, '');
                    if (!/^[\+]?[1-9][\d]{0,15}$/.test(cleanPhone)) {
                        throw new Error('Please enter a valid phone number.');
                    }
                    data = `tel:${phone}`;
                }
                break;
            
            case 'sms':
                const smsNumber = document.getElementById('smsNumber').value.trim();
                const smsMessage = document.getElementById('smsMessage').value.trim();
                if (smsNumber) {
                    const cleanSmsNumber = smsNumber.replace(/[-\s\(\)]/g, '');
                    if (!/^[\+]?[1-9][\d]{0,15}$/.test(cleanSmsNumber)) {
                        throw new Error('Please enter a valid phone number.');
                    }
                    data = `sms:${smsNumber}`;
                    if (smsMessage) data += `?body=${encodeURIComponent(smsMessage)}`;
                }
                break;
            
            case 'wifi':
                const ssid = document.getElementById('wifiSSID').value.trim();
                const password = document.getElementById('wifiPassword').value.trim();
                const security = document.getElementById('wifiSecurity').value;
                
                if (ssid) {
                    if (ssid.length > 32) {
                        throw new Error('WiFi network name cannot exceed 32 characters.');
                    }
                    if (password && password.length > 63) {
                        throw new Error('WiFi password cannot exceed 63 characters.');
                    }
                    data = `WIFI:T:${security};S:${ssid};P:${password || ''};H:false;;`;
                }
                break;
            
            case 'vcard':
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const org = document.getElementById('organization').value.trim();
                const vcardPhone = document.getElementById('vcardPhone').value.trim();
                const vcardEmail = document.getElementById('vcardEmail').value.trim();
                const website = document.getElementById('vcardWebsite').value.trim();
                
                if (firstName || lastName) {
                    // Validate email if provided
                    if (vcardEmail) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(vcardEmail)) {
                            throw new Error('Please enter a valid email address.');
                        }
                    }
                    
                    // Validate phone if provided
                    if (vcardPhone) {
                        const cleanVcardPhone = vcardPhone.replace(/[-\s\(\)]/g, '');
                        if (!/^[\+]?[1-9][\d]{0,15}$/.test(cleanVcardPhone)) {
                            throw new Error('Please enter a valid phone number.');
                        }
                    }
                    
                    // Validate website if provided
                    if (website) {
                        try {
                            new URL(website.startsWith('http') ? website : 'https://' + website);
                        } catch {
                            throw new Error('Please enter a valid website URL.');
                        }
                    }
                    
                    data = 'BEGIN:VCARD\nVERSION:3.0\n';
                    data += `FN:${firstName} ${lastName}\n`;
                    data += `N:${lastName};${firstName};;;\n`;
                    if (org) data += `ORG:${org}\n`;
                    if (vcardPhone) data += `TEL:${vcardPhone}\n`;
                    if (vcardEmail) data += `EMAIL:${vcardEmail}\n`;
                    if (website) {
                        const fullWebsite = website.startsWith('http') ? website : 'https://' + website;
                        data += `URL:${fullWebsite}\n`;
                    }
                    data += 'END:VCARD';
                }
                break;
        }
    } catch (error) {
        throw error;
    }
    
    return data;
}

async function createQRCode(text, type) {
    const size = parseInt(document.getElementById('sizeRange').value);
    const errorLevel = document.getElementById('errorLevel').value;
    const fgColor = document.getElementById('foregroundColor').value;
    const bgColor = document.getElementById('backgroundColor').value;
    
    const qrDisplay = document.getElementById('qrDisplay');
    const qrContainer = document.getElementById('qrcode');
    const infoDiv = document.getElementById('qrInfo');
    const actionsDiv = document.getElementById('actionButtons');
    const placeholder = document.getElementById('qrPlaceholder');

    // Clear previous content
    qrContainer.innerHTML = '';
    clearMessages();
    placeholder.style.display = 'none';

    try {
        // Check for data length limitations
        if (text.length > 2953) {
            throw new Error('Data is too long. Please reduce the content size.');
        }

        // Create QR code instance with error handling
        const qr = qrcode(0, errorLevel);
        qr.addData(text);
        qr.make();

        // Create canvas with optimized settings
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        
        const moduleCount = qr.getModuleCount();
        const cellSize = Math.max(2, Math.floor(size / moduleCount));
        const canvasSize = cellSize * moduleCount;
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Optimize canvas rendering
        ctx.imageSmoothingEnabled = false;
        
        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // Draw QR modules
        ctx.fillStyle = fgColor;
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }
        }

        // Add canvas to DOM
        qrContainer.appendChild(canvas);
        qrDisplay.classList.add('active');
        
        // Store current QR data
        currentQRData = canvas.toDataURL('image/png', 1.0);
        currentQRText = text;

        // Show info with enhanced details
        const dataTypeMap = {
            'text': 'Plain Text',
            'url': 'Website URL',
            'email': 'Email',
            'phone': 'Phone Number',
            'sms': 'SMS Message',
            'wifi': 'WiFi Network',
            'vcard': 'Contact Card'
        };

        infoDiv.style.display = 'block';
        infoDiv.innerHTML = `
            <strong>Type:</strong> ${dataTypeMap[type] || type}<br>
            <strong>Size:</strong> ${canvasSize}×${canvasSize}px<br>
            <strong>Data Length:</strong> ${text.length} characters<br>
            <strong>Error Correction:</strong> ${getErrorLevelName(errorLevel)}
        `;

        // Show action buttons
        actionsDiv.style.display = 'flex';
        actionsDiv.innerHTML = `
            <button class="action-btn download-btn" onclick="downloadQR('png')" title="Download as PNG">
                📥 PNG
            </button>
            <button class="action-btn download-btn" onclick="downloadQR('svg')" title="Download as SVG">
                📄 SVG
            </button>
            <button class="action-btn copy-btn" onclick="copyToClipboard()" title="Copy to clipboard">
                📋 Copy
            </button>
        `;

        showSuccess('QR code generated successfully!');

    } catch (error) {
        console.error('QR Generation Error:', error);
        placeholder.style.display = 'block';
        qrDisplay.classList.remove('active');
        throw new Error('Failed to generate QR code: ' + error.message);
    }
}

function getErrorLevelName(level) {
    const levels = {
        'L': 'Low (~7%)',
        'M': 'Medium (~15%)',
        'Q': 'Quartile (~25%)',
        'H': 'High (~30%)'
    };
    return levels[level] || level;
}

function downloadQR(format = 'png') {
    if (!currentQRData && !currentQRText) {
        showError('No QR code to download.');
        return;
    }

    try {
        if (format === 'png') {
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = currentQRData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSuccess('PNG downloaded successfully!');
        } else if (format === 'svg') {
            downloadSVG();
        }
    } catch (error) {
        console.error('Download Error:', error);
        showError('Failed to download QR code.');
    }
}

function downloadSVG() {
    if (!currentQRText) {
        showError('No QR code to download.');
        return;
    }
    
    try {
        const errorLevel = document.getElementById('errorLevel').value;
        const fgColor = document.getElementById('foregroundColor').value;
        const bgColor = document.getElementById('backgroundColor').value;
        
        const qr = qrcode(0, errorLevel);
        qr.addData(currentQRText);
        qr.make();
        
        const moduleCount = qr.getModuleCount();
        const cellSize = 8; // Fixed size for SVG
        const size = cellSize * moduleCount;
        
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;
        
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fgColor}"/>`;
                }
            }
        }
        svg += '</svg>';
        
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showSuccess('SVG downloaded successfully!');
    } catch (error) {
        console.error('SVG Download Error:', error);
        showError('Failed to download SVG.');
    }
}

async function copyToClipboard() {
    if (!currentQRData) {
        showError('No QR code to copy.');
        return;
    }
    
    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const response = await fetch(currentQRData);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showSuccess('QR code copied to clipboard!');
        } else {
            // Fallback: download instead
            downloadQR('png');
            showSuccess('QR code downloaded (clipboard not supported)');
        }
    } catch (error) {
        console.error('Clipboard Error:', error);
        // Fallback: download instead
        downloadQR('png');
        showSuccess('QR code downloaded (clipboard not available)');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    const qrDisplay = document.getElementById('qrDisplay');
    
    errorDiv.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
    qrDisplay.classList.remove('active');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.innerHTML = '';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success');
    
    successDiv.innerHTML = `<div class="success">${escapeHtml(message)}</div>`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successDiv.innerHTML = '';
    }, 3000);
}

function clearMessages() {
    document.getElementById('error').innerHTML = '';
    document.getElementById('success').innerHTML = '';
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                if (!isGenerating) generateQR();
                break;
            case 's':
                e.preventDefault();
                if (currentQRData) downloadQR('png');
                break;
            case 'c':
                if (e.shiftKey) {
                    e.preventDefault();
                    if (currentQRData) copyToClipboard();
                }
                break;
        }
    }
});

// Add touch support for mobile
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('type-tab')) {
            e.target.style.transform = 'scale(0.98)';
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (e.target.classList.contains('type-tab')) {
            e.target.style.transform = '';
        }
    });
}