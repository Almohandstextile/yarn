// Rendering functions
function renderContent(content, targetElement) {
    if (!targetElement) {
        targetElement = document.getElementById('app');
    }
    
    targetElement.innerHTML = content;
}

function createComponent(type, props = {}, children = []) {
    const element = document.createElement(type);
    
    // Set properties
    Object.keys(props).forEach(key => {
        element[key] = props[key];
    });
    
    // Append children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    
    return element;
}

// Export functions if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderContent,
        createComponent
    };
}


function updateTable(data) {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.type}</td>
            <td>${item.color}</td>
            <td>${item.number}</td>
        `;
        tbody.appendChild(row);
    });
}

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.querySelector('.container').insertBefore(messageDiv, document.querySelector('#inventory-list'));
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}