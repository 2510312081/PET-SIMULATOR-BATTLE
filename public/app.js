let gameData = null;
let petTypes = null;
let shopPets = null;
let selectedBattlePets = [];

// Load initial data
async function loadGame() {
  try {
    const [gameRes, typesRes, shopRes] = await Promise.all([
      fetch('/api/game'),
      fetch('/api/pet-types'),
      fetch('/api/shop')
    ]);
    
    gameData = await gameRes.json();
    petTypes = await typesRes.json();
    shopPets = await shopRes.json();
    
    updateUI();
    showView('home');
  } catch (error) {
    console.error('Error loading game:', error);
  }
}

function updateUI() {
  document.getElementById('coins').textContent = gameData.coins;
  document.getElementById('petCount').textContent = gameData.pets.length;
}

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  
  if (view === 'home') {
    document.getElementById('homeView').classList.remove('hidden');
    renderMyPets();
  } else if (view === 'shop') {
    document.getElementById('shopView').classList.remove('hidden');
    renderShop();
  } else if (view === 'battle') {
    document.getElementById('battleView').classList.remove('hidden');
    renderBattle();
  }
}

function renderMyPets() {
  const container = document.getElementById('homeView');
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${gameData.pets.map(pet => `
        <div class="bg-white rounded-xl shadow-xl p-6">
          <div class="text-center">
            <div class="text-6xl mb-2 pet-bounce">${petTypes[pet.type].emoji}</div>
            <h3 class="text-xl font-bold mb-4">${pet.name}</h3>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span>❤️ HP:</span>
              <span class="font-bold">${pet.hp}/${pet.maxHp}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>⚡ Energy:</span>
              <span class="font-bold">${pet.energy}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>⚔️ Attack:</span>
              <span class="font-bold">${pet.attack}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>📊 Level:</span>
              <span class="font-bold">${pet.level}</span>
            </div>
            <div class="bg-gray-200 rounded-full h-2 mt-2">
              <div class="bg-blue-500 h-2 rounded-full" style="width: ${(pet.exp / 100) * 100}%"></div>
            </div>
            <div class="text-xs text-gray-600 text-center">EXP: ${pet.exp}/100</div>
          </div>
          
          <div class="space-y-2">
            <button onclick="searchFood(${pet.id})" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all">
              🍖 Cari Makanan
            </button>
            <button onclick="trainPet(${pet.id})" ${pet.energy < 20 ? 'disabled class="opacity-50"' : ''} class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-all">
              💪 Latihan (-20 Energy)
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderShop() {
  const container = document.getElementById('shopView');
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${shopPets.map(pet => `
        <div class="bg-white rounded-xl shadow-xl p-6">
          <div class="text-6xl text-center mb-4">${petTypes[pet.type].emoji}</div>
          <h3 class="text-2xl font-bold text-center mb-2">${pet.type}</h3>
          <div class="space-y-2 mb-4">
            <div class="flex justify-between">
              <span>⚔️ Attack:</span>
              <span class="font-bold">${pet.attack}</span>
            </div>
            <div class="flex justify-between">
              <span>❤️ HP:</span>
              <span class="font-bold">${pet.hp}</span>
            </div>
            <div class="flex justify-between text-yellow-600 font-bold text-lg">
              <span>💰 Harga:</span>
              <span>${pet.price} Coins</span>
            </div>
          </div>
          <button onclick="buyPet('${pet.type}')" ${gameData.coins < pet.price ? 'disabled class="opacity-50"' : ''} class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-lg">
            🛒 Beli Pet
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBattle() {
  const container = document.getElementById('battleView');
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-center">Pilih 2 Pet untuk Bertarung!</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        ${gameData.pets.map(pet => `
          <div onclick="selectBattlePet(${pet.id})" 
               class="cursor-pointer p-4 rounded-xl transition-all ${
                 selectedBattlePets.includes(pet.id) ? 'ring-4 ring-yellow-400 bg-yellow-50' : 'bg-gray-100 hover:bg-gray-200'
               }">
            <div class="text-4xl text-center mb-2">${petTypes[pet.type].emoji}</div>
            <div class="text-sm font-bold text-center">${pet.name}</div>
            <div class="text-xs text-center text-gray-600">LV ${pet.level}</div>
          </div>
        `).join('')}
      </div>
      <button onclick="startBattle()" ${selectedBattlePets.length !== 2 ? 'disabled class="opacity-50"' : ''} class="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-4 rounded-lg text-xl">
        ⚔️ MULAI BATTLE!
      </button>
    </div>
    <div id="battleLog" class="bg-white rounded-xl shadow-xl p-6 hidden">
      <h3 class="text-xl font-bold mb-4">📜 Battle Log:</h3>
      <div id="battleLogContent" class="space-y-2 max-h-64 overflow-y-auto"></div>
    </div>
  `;
}

function selectBattlePet(petId) {
  if (selectedBattlePets.includes(petId)) {
    selectedBattlePets = selectedBattlePets.filter(id => id !== petId);
  } else if (selectedBattlePets.length < 2) {
    selectedBattlePets.push(petId);
  }
  renderBattle();
}

async function searchFood(petId) {
  try {
    const response = await fetch(`/api/search-food/${petId}`, { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      await loadGame();
    } else {
      alert(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function trainPet(petId) {
  try {
    const response = await fetch(`/api/train/${petId}`, { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      const msg = result.leveledUp ? `🎉 LEVEL UP! Sekarang Level ${result.pet.level}!` : '💪 Training berhasil! +50 Coins';
      alert(msg);
      await loadGame();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function buyPet(type) {
  try {
    const response = await fetch('/api/buy-pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const result = await response.json();
    
    if (result.success) {
      alert(`🎊 Berhasil membeli ${type}!`);
      await loadGame();
      showView('home');
    } else {
      alert(`❌ ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function startBattle() {
  if (selectedBattlePets.length !== 2) return;
  
  try {
    const response = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet1Id: selectedBattlePets[0],
        pet2Id: selectedBattlePets[1]
      })
    });
    const result = await response.json();
    
    if (result.success) {
      const logDiv = document.getElementById('battleLog');
      const logContent = document.getElementById('battleLogContent');
      
      logDiv.classList.remove('hidden');
      logContent.innerHTML = result.battleLog.map(log => 
        `<div class="bg-gray-100 p-3 rounded-lg">${log}</div>`
      ).join('');
      
      setTimeout(() => {
        alert(`🏆 ${result.winner} MENANG! +200 Coins`);
        selectedBattlePets = [];
        loadGame();
      }, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function resetGame() {
  if (confirm('Yakin ingin reset game?')) {
    try {
      await fetch('/api/reset', { method: 'POST' });
      await loadGame();
      alert('🔄 Game berhasil direset!');
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Initialize game on load
loadGame();