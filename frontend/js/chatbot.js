document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const windowEl = document.getElementById('chatbot-window');
    const inputEl = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messagesEl = document.getElementById('chatbot-messages');

    let isOpen = false;

    function toggleChat() {
        isOpen = !isOpen;
        windowEl.style.display = isOpen ? 'flex' : 'none';
        if (isOpen) {
            inputEl.focus();
            toggleBtn.style.transform = 'scale(0)';
        } else {
            toggleBtn.style.transform = 'scale(1)';
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    function addMessage(text, isUser = false) {
        const msg = document.createElement('div');
        msg.style.padding = '8px 12px';
        msg.style.borderRadius = '12px';
        msg.style.maxWidth = '85%';
        msg.style.wordBreak = 'break-word';
        
        if (isUser) {
            msg.style.backgroundColor = 'var(--color-primary)';
            msg.style.color = '#fff';
            msg.style.alignSelf = 'flex-end';
            msg.style.borderBottomRightRadius = '2px';
        } else {
            msg.style.backgroundColor = 'var(--color-bg)';
            msg.style.color = 'var(--color-text)';
            msg.style.alignSelf = 'flex-start';
            msg.style.borderBottomLeftRadius = '2px';
        }
        
        msg.textContent = text;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function processInput(text) {
        text = text.toLowerCase();
        
        let response = "I'm a simple assistant. I can help you with adding products, making bills, or checking analytics!";
        
        if (text.includes('add product') || text.includes('new product') || text.includes('create product')) {
            response = "To add a product, go to the Products page using the sidebar and click on the Add Product button. Fill in the product details, including cost price if you want to track profit!";
        } else if (text.includes('bill') || text.includes('invoice') || text.includes('sale')) {
            response = "To make a bill, go to the Billing page. Search for items, enter quantities, add a discount if needed, and click Complete Sale.";
        } else if (text.includes('profit') || text.includes('revenue') || text.includes('analytics')) {
            response = "You can track your sales and profit right here on the Dashboard! Make sure you add Cost Price to your products so we can calculate your profit accurately.";
        } else if (text.includes('low stock') || text.includes('stock')) {
            response = "Items running low on stock will automatically appear in the Low Stock Alerts table on the Dashboard. You can set the low stock threshold when adding or editing a product.";
        } else if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
            response = "Hello! How can I help you manage your store today?";
        }
        
        setTimeout(() => {
            addMessage(response, false);
        }, 500);
    }

    function handleSend() {
        const text = inputEl.value.trim();
        if (!text) return;
        
        addMessage(text, true);
        inputEl.value = '';
        
        processInput(text);
    }

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key 
=== 'Enter') handleSend();
    });
});