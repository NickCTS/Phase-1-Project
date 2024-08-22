document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');

    const filterContainer = document.createElement('div');
    filterContainer.classList.add('filter-container');

    const inputs = {
        minPrice: createInput('number', 'min-price', 'Min price'),
        maxPrice: createInput('number', 'max-price', 'Max price'),
        search: createInput('text', 'search', 'Search by name or symbol'),
    };

    const toggleThemeButton = document.createElement('button');
    toggleThemeButton.id = 'toggle-theme';
    toggleThemeButton.textContent = 'Toggle Theme';

    filterContainer.append(inputs.minPrice, inputs.maxPrice, inputs.search, toggleThemeButton);
    contentDiv.prepend(filterContainer);

    const formContainer = document.createElement('div');
    formContainer.classList.add('form-container');

    const nameInput = createInput('text', 'new-name', 'Name');
    const symbolInput = createInput('text', 'new-symbol', 'Symbol');
    const priceInput = createInput('number', 'new-price', 'Price (USD)');
    const marketCapInput = createInput('number', 'new-market-cap', 'Market Cap (USD)');
    const volumeInput = createInput('number', 'new-volume', '24h Volume (USD)');
    const changeInput = createInput('number', 'new-change', 'Change (24h)');

    const addButton = document.createElement('button');
    addButton.id = 'add-crypto';
    addButton.textContent = 'Add Crypto';

    formContainer.append(nameInput, symbolInput, priceInput, marketCapInput, volumeInput, changeInput, addButton);
    contentDiv.appendChild(formContainer);

    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`${theme}-theme`);

    toggleThemeButton.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        document.body.className = `${newTheme}-theme`;
        localStorage.setItem('theme', newTheme);
    });
    let assetsData = [];
    let localData = JSON.parse(localStorage.getItem('localData')) || [];
    async function fetchAndDisplayData() {
        try {
            const response = await fetch('https://api.coincap.io/v2/assets');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { data } = await response.json();
            assetsData = data;
            updateTable();
            loadFavorites();
            filterData();
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load data. Please try again later.');
        }
    }
    function updateTable() {
        let table = document.getElementById('data-table');
        if (!table) {
            table = document.createElement('table');
            table.id = 'data-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Price (USD)</th>
                        <th>Market Cap (USD)</th>
                        <th>24h Volume (USD)</th>
                        <th>Change (24h)</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            contentDiv.appendChild(table);
        }
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = [...assetsData, ...localData].map(asset => `
            <tr data-id="${asset.id}">
                <td><input type="checkbox" class="favorite-checkbox" data-id="${asset.id}" /></td>
                <td>${asset.name}</td>
                <td>${asset.symbol}</td>
                <td>$${parseFloat(asset.priceUsd).toLocaleString()}</td>
                <td>$${parseFloat(asset.marketCapUsd).toLocaleString()}</td>
                <td>$${parseFloat(asset.volumeUsd24Hr).toLocaleString()}</td>
                <td>${parseFloat(asset.changePercent24Hr).toFixed(2)}%</td>
            </tr>
        `).join('');
    }
    function createInput(type, id, placeholder) {
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.placeholder = placeholder;
        return input;
    }
    function showError(message) {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = message;
        errorMsg.style.color = 'red';
        contentDiv.appendChild(errorMsg);
    }
    function loadFavorites() {
        const favoriteIds = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
        document.querySelectorAll('.favorite-checkbox').forEach(checkbox => {
            checkbox.checked = favoriteIds.has(checkbox.dataset.id);
        });
        updateFavoritesList();
    }
    function saveFavorite(assetId, isFavorite) {
        const favoriteIds = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
        if (isFavorite) {
            favoriteIds.add(assetId);
        } else {
            favoriteIds.delete(assetId);
        }
        localStorage.setItem('favorites', JSON.stringify([...favoriteIds]));
        updateFavoritesList();
    }
    function updateFavoritesList() {
        const favoritesList = document.getElementById('favorites-list');
        favoritesList.innerHTML = '';
        const favoriteIds = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
        document.querySelectorAll('.favorite-checkbox:checked').forEach(checkbox => {
            const assetRow = checkbox.closest('tr');
            const [name, symbol, price] = Array.from(assetRow.children).slice(1, 4).map(cell => cell.textContent);
            const listItem = document.createElement('li');
            listItem.textContent = `${name} (${symbol}): ${price}`;
            favoritesList.appendChild(listItem);
        });
    }

    function filterData() {
        const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
        const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;
        const searchQuery = document.getElementById('search').value.toLowerCase();
        document.querySelectorAll('#data-table tbody tr').forEach(row => {
            const price = parseFloat(row.children[3].textContent.replace(/[^0-9.-]+/g, ''));
            const name = row.children[1].textContent.toLowerCase();
            const symbol = row.children[2].textContent.toLowerCase();
            row.style.display = (price >= minPrice && price <= maxPrice && (name.includes(searchQuery) || symbol.includes(searchQuery))) ? '' : 'none';
        });
    }
    function addNewCrypto() {
        const newCrypto = {
            id: Date.now().toString(),
            name: document.getElementById('new-name').value,
            symbol: document.getElementById('new-symbol').value,
            priceUsd: document.getElementById('new-price').value,
            marketCapUsd: document.getElementById('new-market-cap').value,
            volumeUsd24Hr: document.getElementById('new-volume').value,
            changePercent24Hr: document.getElementById('new-change').value
        };
        if (Object.values(newCrypto).every(value => value.trim() !== '')) {
            localData.push(newCrypto);
            localStorage.setItem('localData', JSON.stringify(localData));
            updateTable();
            clearForm();
        } else {
            showError('Please fill out all fields.');
        }
    }
    function clearForm() {
        document.querySelectorAll('.form-container input').forEach(input => input.value = '');
    }
    document.addEventListener('change', (event) => {
        if (event.target.classList.contains('favorite-checkbox')) {
            saveFavorite(event.target.dataset.id, event.target.checked);
        }
    });
    document.getElementById('min-price').addEventListener('input', filterData);
    document.getElementById('max-price').addEventListener('input', filterData);
    document.getElementById('search').addEventListener('input', filterData);
    document.getElementById('add-crypto').addEventListener('click', addNewCrypto);

    fetchAndDisplayData();
    setInterval(fetchAndDisplayData, 5000);
});
