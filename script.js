const key = "Harsh-Key";
const results = document.querySelector("#results");
const loadMore = document.querySelector("#loadMore");
const dialog = document.querySelector("#dialog");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const resetBtn = document.querySelector("#resetBtn");
const loadingDiv = document.querySelector("#loading");

let pokedata = [];
let dataToDisplay = [];
let pokesave = [];

function retrieveData() {
  const data = localStorage.getItem(key);
  if (data) {
    pokesave = JSON.parse(data);
  } else {
    pokesave = [];
  }
}

function saveToLocalStorage() {
  localStorage.setItem(key, JSON.stringify(pokesave));
}

function localSavedDisplay() {
  document.querySelectorAll(".card").forEach((card) => {
    const id = Number(card.getAttribute("data-id"));
    const caughtBadge = card.querySelector(".caught");
    if (pokesave.includes(id)) {
      caughtBadge.classList.add("active");
    } else {
      caughtBadge.classList.remove("active");
    }
  });
}

function displayPokemon(list) {
  results.innerHTML = "";
  list.forEach((pokemon) => {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-id", pokemon.id);
    card.innerHTML = `
      <img src="${
        pokemon.sprites.other["official-artwork"].front_default
      }" alt="${pokemon.name}">
      <h2 class="poke-title">${pokemon.name}</h2>
      <div class="caught ${
        pokesave.includes(pokemon.id) ? "active" : ""
      }">CAUGHT</div>
    `;
    card.addEventListener("click", () => clickOnCard(pokemon.id));
    results.appendChild(card);
  });
}

async function fetchPokemonDetails(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch (err) {
    console.error("Error fetching details:", err);
  }
}

async function processFetch(data) {
  pokedata.push(...data.results);

  const newPokemonData = await Promise.all(
    data.results.map(async (item) => {
      return await fetchPokemonDetails(item.url);
    })
  );
  dataToDisplay.push(...newPokemonData);
  applyFiltersAndSort();
}

async function loadPokemon(offset = 0, limit = 20) {
  loadingDiv.style.display = "block";
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error("Failed to load Pokemon");
    const data = await response.json();
    await processFetch(data);
  } catch (error) {
    console.error("Error loading Pokemon:", error);
    alert("Error loading Pokemon. Please try again later.");
  } finally {
    loadingDiv.style.display = "none";
  }
}

function applyFiltersAndSort() {
  let filteredData = [...dataToDisplay];
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredData = filteredData.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchTerm)
    );
  }
  if (sortSelect.value === "name") {
    filteredData.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filteredData.sort((a, b) => a.id - b.id);
  }
  displayPokemon(filteredData);
}

searchInput.addEventListener("input", applyFiltersAndSort);

sortSelect.addEventListener("change", applyFiltersAndSort);

resetBtn.addEventListener("click", () => {
  pokesave = [];
  saveToLocalStorage();
  localSavedDisplay();
});

function clickOnCard(id) {
  const pokemon = dataToDisplay.find((p) => p.id === id);
  if (pokemon) {
    displayDialog(pokemon);
  }
}

function displayDialog(pokemon) {
  const types = pokemon.types.map((item) => item.type.name).join(", ");
  const moves = pokemon.moves
    .slice(0, 6)
    .map((item) => item.move.name)
    .join(", ");
  const abilities = pokemon.abilities
    .map((item) => item.ability.name)
    .join(", ");
  const stats = pokemon.stats
    .map((item) => `<li>${item.stat.name}: ${item.base_stat}</li>`)
    .join("");

  dialog.innerHTML = `
    <div class="dialogContainer">
      <div class="dialogHeader">
        <h2>${pokemon.name}</h2>
        <button id="dialogClose" class="btn">Close</button>
      </div>
      <div class="dialogData">
        <img src="${
          pokemon.sprites.other["official-artwork"].front_shiny
        }" alt="${pokemon.name}">
        <div class="dialogText" data-id="${pokemon.id}">
          <p><strong>ID:</strong> ${pokemon.id}</p>
          <p><strong>Types:</strong> ${types}</p>
          <p><strong>Abilities:</strong> ${abilities}</p>
          <p><strong>Height:</strong> ${pokemon.height}</p>
          <p><strong>Weight:</strong> ${pokemon.weight}</p>
          <p><strong>Moves:</strong> ${moves}</p>
          <p><strong>Stats:</strong></p>
          <ul>${stats}</ul>
          ${
            pokesave.includes(pokemon.id)
              ? `<button class="delete btn" data-id="${pokemon.id}">Release</button>`
              : `<button class="catch btn" data-id="${pokemon.id}">Catch</button>`
          }
        </div>
      </div>
    </div>
  `;
  dialog.showModal();

  const closeBtn = dialog.querySelector("#dialogClose");
  closeBtn.addEventListener("click", () => dialog.close());

  const catchBtn = dialog.querySelector(".catch");
  if (catchBtn) {
    catchBtn.addEventListener("click", catchAction);
  }
  const deleteBtn = dialog.querySelector(".delete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", releaseAction);
  }
}

function catchAction(ev) {
  ev.preventDefault();
  const pokemonId = Number(ev.target.getAttribute("data-id"));
  if (!pokesave.includes(pokemonId)) {
    pokesave.push(pokemonId);
    saveToLocalStorage();
    localSavedDisplay();
  }
  dialog.close();
}

function releaseAction(ev) {
  ev.preventDefault();
  const pokemonId = Number(ev.target.getAttribute("data-id"));
  const index = pokesave.indexOf(pokemonId);
  if (index !== -1) {
    pokesave.splice(index, 1);
    saveToLocalStorage();
    localSavedDisplay();
  }
  dialog.close();
}

loadMore.addEventListener("click", () => {
  loadPokemon(pokedata.length, 20);
});

document.addEventListener("DOMContentLoaded", () => {
  retrieveData();
  loadPokemon(0, 20);
});
