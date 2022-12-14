const API_URL_POPULAR = `https://api.themoviedb.org/3/movie/popular?language=en-US&api_key=`;
const API_URL_NOW_PLAYING = `https://api.themoviedb.org/3/movie/now_playing?language=en-US&api_key=`;
const API_KEY = `2c46288716a18fb7aadcc2a801f3fc6b`;
const IMG_URL = "https://image.tmdb.org/t/p/original";

let favoriteMovies = localStorage.favoriteMovies;
favoriteMovies = favoriteMovies ? JSON.parse(favoriteMovies) : {};

const modalContainer = document.querySelector(".modal-container");
const modal = document.querySelector(".modal");

const getItems = async (url) => {
  try {
    const response = await fetch(`${url}${API_KEY}`);
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.log(err);
  }
};

function getStatsChildren(statsContainer, movie) {
  const originalLanguage = document.createElement("span");
  originalLanguage.className = "modal-stats";
  originalLanguage.innerText = `original language: ${movie.original_language}`;

  const release_date = document.createElement("span");
  release_date.className = "modal-stats";
  release_date.innerText = `release date: ${movie.release_date}`;

  const popularity = document.createElement("span");
  popularity.className = "modal-stats";
  popularity.innerText = `popularity: ${movie.popularity}`;

  const vote_average = document.createElement("span");
  vote_average.className = "modal-stats";
  vote_average.innerText = `vote average: ${movie.vote_average}`;

  const vote_count = document.createElement("span");
  vote_count.className = "modal-stats";
  vote_count.innerText = `vote count: ${movie.vote_count}`;

  statsContainer.appendChild(originalLanguage);
  statsContainer.appendChild(release_date);
  statsContainer.appendChild(popularity);
  statsContainer.appendChild(vote_average);
  statsContainer.appendChild(vote_count);
}

function createMovieCard(movie, closeModuleEvent) {  
  const moviePoster = document.createElement("img");
  moviePoster.src = IMG_URL + movie.poster_path;
  moviePoster.className = "movie-image";

  const div = document.createElement("div");
  div.className = "movie-card";
  div.appendChild(moviePoster);

  //handle card click
  div.addEventListener("click", () => {
    //first clear the modal
    modal.innerHTML = "";
    //load the content of the modal
    const modalImage = document.createElement("img");
    modalImage.className = "modal-image";
    modalImage.src = IMG_URL + movie.backdrop_path;

    const favoritesButton = document.createElement("button");
    favoritesButton.className = "modal-button";
    //we need to check if this movie already in our favorites
    favoriteMovies[movie.id]
      ? (favoritesButton.innerText = "remove from favorites")
      : (favoritesButton.innerText = "add to favorites");

    favoritesButton.addEventListener("click", () => {
      //if the value is 1 we want to remove it
      //after we remove it we want to refresh the page
      //that we would only see the current favorites and
      //not include the movie that was removed
      if (favoriteMovies[movie.id]) {
        delete favoriteMovies[movie.id];
      } else {
        favoriteMovies[movie.id] = 1;
      }
      localStorage.favoriteMovies = JSON.stringify(favoriteMovies);

      if (modalContainer) {
        modalContainer.removeEventListener("click", onModalClick);
      }

      //after that we want to close the modal
      closeModuleEvent();
    });

    const title = document.createElement("h2");
    title.className = "modal-title";
    title.innerText = movie.title;

    const statsContainer = document.createElement("div");
    statsContainer.className = "stats-container";

    getStatsChildren(statsContainer, movie);

    const closeButton = document.createElement("button");
    closeButton.className = "close-modal";
    closeButton.innerText = "X";

    closeButton.addEventListener("click", () => {
      if (modalContainer) {
        modalContainer.removeEventListener("click", onModalClick);
      }
      closeModuleEvent();
    });

    const overview = document.createElement("p");
    overview.className = "modal-overview";
    overview.innerText = `${movie.overview}`;

    //append all the children in the correct order
    modal.appendChild(title);
    modal.appendChild(modalImage);
    modal.appendChild(statsContainer);
    modal.appendChild(overview);
    modal.appendChild(favoritesButton);
    modal.appendChild(closeButton);

    modal.style.display = "flex";
    modalContainer.style.display = "flex";
    //prevent scrolling while modal is displayed
    document.body.style.overflow = "hidden";

    //closing the modal
    const onModalClick = function (e) {
      //we need to check that we actually clicked the modal container and not the modal itself
      if (e.target === modalContainer) {
        modalContainer.removeEventListener("click", onModalClick);
        closeModuleEvent();
      }
    };

    modalContainer.addEventListener("click", onModalClick);
  });
  return div;
}

const main = async () => {
  //we might need nowPlayingData if a user already picked one of the movies as a favorite from now playing
  const requestAll = Promise.all([
    getItems(API_URL_POPULAR),
    getItems(API_URL_NOW_PLAYING),
  ]);
  //the reason we do not use onLoad is that its wait for styles and images and we only want to html elements
  window.addEventListener("DOMContentLoaded", async () => {
    const [popularData, nowPlayingData] = await requestAll;

    const content = document.querySelector(".content");

    if (!popularData) {
      return;
    }

    const selectOptions = document.querySelector(".filter-movies");

    const closeModuleEvent = () => {
      modal.style.display = "none";
      modalContainer.style.display = "none";
      document.body.style.overflow = "visible";
      if (selectOptions.value === "Favorites") {
        content.innerHTML = "";
        loadFavorites();
      }
    };

    popularData.forEach((movie) => {
      content.appendChild(createMovieCard(movie, closeModuleEvent));
    });

    //this function render the favorites movies 
    const loadFavorites = function () {
      //first we take all the favorites from the popular movies
      const filterData = popularData
        .filter((movie) => favoriteMovies[movie.id])
        .map((movie) => {
          content.appendChild(createMovieCard(movie, closeModuleEvent));
          return movie.id;
        });
      //now we take all the favorites from the now playing movies
      //while making sure we don't make doubles
      if (nowPlayingData) {
        nowPlayingData
          .filter(
            (movie) =>
              favoriteMovies[movie.id] && !filterData.includes(movie.id)
          )
          .forEach((movie) => {
            content.appendChild(createMovieCard(movie, closeModuleEvent));
          });
      }
    };

    selectOptions.addEventListener("change", async () => {
      //clear the movies container
      content.innerHTML = "";
      if (selectOptions.value === "Popular") {
        //render the most popular movies
        popularData.forEach((movie) => {
          content.appendChild(createMovieCard(movie, closeModuleEvent));
        });
      }
      if (selectOptions.value === "Now Playing") {
        if (!nowPlayingData) {
          return;
        }
        //render the movies that are playing right now
        nowPlayingData.forEach((movie) => {
          content.appendChild(createMovieCard(movie, closeModuleEvent));
        });
      }
      if (selectOptions.value === "Favorites") {
        loadFavorites();
      }
    });
  });
};

main();
