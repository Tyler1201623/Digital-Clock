// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                
                // Handle PWA installation
                setupPWAInstallation();
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// PWA Installation Handler
function setupPWAInstallation() {
    let deferredPrompt;
    const installButton = document.getElementById('installPWA');
    
    // Hide the install button initially
    installButton.style.display = 'none';
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 76+ from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show the install button
        installButton.style.display = 'flex';
        
        // Log that the PWA is installable
        sendAnalytics('pwa', 'installable');
    });
    
    // Handle the install button click
    installButton.addEventListener('click', () => {
        // Show the install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    sendAnalytics('pwa', 'installed');
                } else {
                    console.log('User dismissed the install prompt');
                    sendAnalytics('pwa', 'dismissed');
                }
                // Clear the saved prompt since it can't be used again
                deferredPrompt = null;
                // Hide the install button
                installButton.style.display = 'none';
            });
        }
    });
    
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', (e) => {
        console.log('App was installed', e);
        // Hide the install button
        installButton.style.display = 'none';
        // Optionally show a success message or change UI
        showToast('App installed successfully!');
    });
}

// Notification Permission Handler
document.getElementById('notifications').addEventListener('click', () => {
    requestNotificationPermission();
});

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Notifications not supported in this browser');
        return;
    }
    
    if (Notification.permission === 'granted') {
        showToast('Notifications already enabled');
        updateNotificationUI(true);
        return;
    }
    
    if (Notification.permission === 'denied') {
        showToast('Notification permission was denied. Please enable in browser settings.');
        return;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Notifications enabled!');
            updateNotificationUI(true);
            // Send a test notification
            sendTestNotification();
        } else {
            showToast('Notification permission was denied');
            updateNotificationUI(false);
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Error enabling notifications');
    }
}

function updateNotificationUI(enabled) {
    const notificationBtn = document.getElementById('notifications');
    if (enabled) {
        notificationBtn.innerHTML = '<i class="fas fa-bell"></i><span>Notifications On</span>';
        notificationBtn.classList.add('active');
    } else {
        notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i><span>Enable Notifications</span>';
        notificationBtn.classList.remove('active');
    }
}

function sendTestNotification() {
    const notification = new Notification('Chronos Hub', {
        body: 'Notifications are now enabled!',
        icon: '/images/icon-192x192.png'
    });
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
}

// Helper function to display toast messages
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Simple analytics function
function sendAnalytics(category, action, label = null, value = null) {
    // Implement your analytics here
    // This is a placeholder - you would typically send to Google Analytics, Matomo, etc.
    console.log(`Analytics: ${category} - ${action}${label ? ' - ' + label : ''}${value ? ' - ' + value : ''}`);
    
    // Example of sending to a backend
    if (navigator.onLine) {
        try {
            // Uncomment to actually send analytics
            /*
            fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    action,
                    label,
                    value,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                })
            });
            */
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    }
} 