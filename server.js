const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database sederhana menggunakan object
let gameData = {
  coins: 1000,
  pets: [
    { 
      id: 1, 
      name: 'LUFFY', 
      type: 'LUFFY', 
      hp: 100, 
      maxHp: 100, 
      energy: 76, 
      attack: 20, 
      level: 1, 
      exp: 0 
    }
  ]
};

// Pet types configuration
const petTypes = {
  LUFFY: { emoji: '🐵', color: 'orange', sound: 'Gomu Gomu!' },
  DRAGON: { emoji: '🐉', color: 'red', sound: 'ROAAR!' },
  PHOENIX: { emoji: '🦅', color: 'yellow', sound: 'SCREECH!' },
  TIGER: { emoji: '🐯', color: 'orange', sound: 'GRRR!' },
  WOLF: { emoji: '🐺', color: 'gray', sound: 'AWOO!' },
  PANDA: { emoji: '🐼', color: 'green', sound: 'RAWR!' }
};

const shopPets = [
  { type: 'DRAGON', price: 500, attack: 25, hp: 120 },
  { type: 'PHOENIX', price: 600, attack: 22, hp: 110 },
  { type: 'TIGER', price: 400, attack: 23, hp: 105 },
  { type: 'WOLF', price: 450, attack: 21, hp: 100 },
  { type: 'PANDA', price: 550, attack: 24, hp: 115 }
];

// API Routes

// Get game data
app.get('/api/game', (req, res) => {
  res.json(gameData);
});

// Get pet types
app.get('/api/pet-types', (req, res) => {
  res.json(petTypes);
});

// Get shop pets
app.get('/api/shop', (req, res) => {
  res.json(shopPets);
});

// Search magic food (async operation)
app.post('/api/search-food/:petId', async (req, res) => {
  const petId = parseInt(req.params.petId);
  const pet = gameData.pets.find(p => p.id === petId);
  
  if (!pet) {
    return res.status(404).json({ error: 'Pet not found' });
  }

  // Simulate async search with Promise
  const searchMagicFood = () => {
    return new Promise((resolve, reject) => {
      const time = Math.floor(Math.random() * 2000) + 1000;
      const success = Math.random() > 0.3;

      setTimeout(() => {
        if (success) {
          const foodPower = Math.floor(Math.random() * 20) + 10;
          resolve({ power: foodPower });
        } else {
          reject('Tersesat di hutan!');
        }
      }, time);
    });
  };

  try {
    const result = await searchMagicFood();
    pet.energy += result.power;
    pet.hp = Math.min(pet.hp + result.power, pet.maxHp);
    
    res.json({
      success: true,
      message: `Menemukan makanan ajaib! +${result.power} Energy & HP!`,
      pet: pet
    });
  } catch (error) {
    res.json({
      success: false,
      message: error
    });
  }
});

// Train pet
app.post('/api/train/:petId', (req, res) => {
  const petId = parseInt(req.params.petId);
  const pet = gameData.pets.find(p => p.id === petId);
  
  if (!pet) {
    return res.status(404).json({ error: 'Pet not found' });
  }

  if (pet.energy < 20) {
    return res.status(400).json({ error: 'Energy tidak cukup!' });
  }

  pet.energy -= 20;
  pet.exp += 30;
  
  let leveledUp = false;
  if (pet.exp >= 100) {
    pet.level += 1;
    pet.attack += 5;
    pet.maxHp += 20;
    pet.hp += 20;
    pet.exp -= 100;
    leveledUp = true;
  }
  
  gameData.coins += 50;
  
  res.json({
    success: true,
    pet: pet,
    coins: gameData.coins,
    leveledUp: leveledUp
  });
});

// Buy pet
app.post('/api/buy-pet', (req, res) => {
  const { type } = req.body;
  const shopPet = shopPets.find(p => p.type === type);
  
  if (!shopPet) {
    return res.status(404).json({ error: 'Pet not found in shop' });
  }
  
  if (gameData.coins < shopPet.price) {
    return res.status(400).json({ error: 'Coin tidak cukup!' });
  }
  
  const newPet = {
    id: Date.now(),
    name: `${type}_${gameData.pets.length + 1}`,
    type: type,
    hp: shopPet.hp,
    maxHp: shopPet.hp,
    energy: 100,
    attack: shopPet.attack,
    level: 1,
    exp: 0
  };
  
  gameData.pets.push(newPet);
  gameData.coins -= shopPet.price;
  
  res.json({
    success: true,
    pet: newPet,
    coins: gameData.coins
  });
});

// Battle
app.post('/api/battle', (req, res) => {
  const { pet1Id, pet2Id } = req.body;
  
  const pet1 = gameData.pets.find(p => p.id === pet1Id);
  const pet2 = gameData.pets.find(p => p.id === pet2Id);
  
  if (!pet1 || !pet2) {
    return res.status(404).json({ error: 'Pet not found' });
  }
  
  const battleLog = [];
  let pet1Hp = pet1.hp;
  let pet2Hp = pet2.hp;
  let turn = 1;
  
  while (pet1Hp > 0 && pet2Hp > 0) {
    if (turn % 2 === 1) {
      const damage = pet1.attack + Math.floor(Math.random() * 10);
      pet2Hp -= damage;
      battleLog.push(`${pet1.name} menyerang! -${damage} HP`);
    } else {
      const damage = pet2.attack + Math.floor(Math.random() * 10);
      pet1Hp -= damage;
      battleLog.push(`${pet2.name} menyerang! -${damage} HP`);
    }
    turn++;
  }
  
  const winner = pet1Hp > 0 ? pet1 : pet2;
  const loser = pet1Hp > 0 ? pet2 : pet1;
  
  // Update winner
  winner.exp += 50;
  if (winner.exp >= 100) {
    winner.level += 1;
    winner.attack += 5;
    winner.maxHp += 20;
    winner.exp -= 100;
  }
  winner.hp = pet1Hp > 0 ? pet1Hp : pet2Hp;
  
  // Update loser
  loser.hp = Math.max(1, pet1Hp > 0 ? pet2Hp : pet1Hp);
  
  gameData.coins += 200;
  
  res.json({
    success: true,
    winner: winner.name,
    battleLog: battleLog,
    coins: gameData.coins
  });
});

// Reset game
app.post('/api/reset', (req, res) => {
  gameData = {
    coins: 1000,
    pets: [
      { 
        id: 1, 
        name: 'LUFFY', 
        type: 'LUFFY', 
        hp: 100, 
        maxHp: 100, 
        energy: 76, 
        attack: 20, 
        level: 1, 
        exp: 0 
      }
    ]
  };
  res.json({ success: true, message: 'Game direset!' });
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📦 Pet Simulator sudah siap!`);
});