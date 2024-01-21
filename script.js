const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const profile = document.getElementById("profile");
const repos = document.getElementById("repos");
const loader = document.getElementById("loader");

let username = "";
let profileData = {};
let reposData = [];
let filteredReposData = [];
let currentPage = 1;
let perPage = 10;
let totalPages = 0;
const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_HEADERS = {
    Accept: "application/vnd.github.v3+json",
};

document.getElementById("search-form").addEventListener("submit", function (event) {
    event.preventDefault();

    username = document.getElementById("search-input").value.trim();

    if (username) {
        document.getElementById("profile").innerHTML = "";
        document.getElementById("repos").innerHTML = "";
        document.getElementById("loader").style.display = "block";
        fetchProfileAndRepos();
    } else {
        alert("Please enter a GitHub username");
    }
});

async function fetchProfileAndRepos() {
    try {
        const profileResponse = await fetch(
            `${GITHUB_API_URL}/users/${username}`,
            {
                headers: GITHUB_API_HEADERS,
            }
        );
        if (profileResponse.status === 200) {
            profileData = await profileResponse.json();
            const reposResponse = await fetch(
                `${GITHUB_API_URL}/users/${username}/repos`,
                {
                    headers: GITHUB_API_HEADERS,
                }
            );
            if (reposResponse.status === 200) {
                reposData = await reposResponse.json();
                filterReposByTopics();
                displayProfileAndRepos();
            } else {
                throw new Error(
                    `Failed to fetch repos data: ${reposResponse.status}`
                );
            }
        } else {
            throw new Error(
                `Failed to fetch profile data: ${profileResponse.status}`
            );
        }
    } catch (error) {
        alert(error.message);
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}

function filterReposByTopics() {
    const topics = ["javascript", "html", "css"];
    filteredReposData = reposData.filter(
        (repo) =>
            repo.topics && repo.topics.some((topic) => topics.includes(topic))
    );
    filteredReposData.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
}

function displayProfileAndRepos() {
    displayProfile();
    displayRepos();
}

function displayProfile() {
    const profileImage = document.createElement("img");
    profileImage.src = profileData.avatar_url;
    profileImage.id = "profile-image";
    const profileInfo = document.createElement("ul");
    profileInfo.id = "profile-info";
    const profileName = document.createElement("li");
    profileName.textContent = `Name: ${profileData.name || "N/A"}`;
    const profileCreatedAt = document.createElement("li");
    profileCreatedAt.textContent = `Created at: ${new Date(
        profileData.created_at
    ).toLocaleDateString()}`;
    const profileTwitterId = document.createElement("li");
    profileTwitterId.textContent = `Twitter id: ${profileData.twitter_username || "N/A"
        }`;
    const profileLocation = document.createElement("li");
    profileLocation.textContent = `Location: ${profileData.location || "N/A"
        }`;
    const profileFollowers = document.createElement("li");
    profileFollowers.textContent = `Followers: ${profileData.followers || 0
        }`;
    const profileFollowing = document.createElement("li");
    profileFollowing.textContent = `Following: ${profileData.following || 0
        }`;
    profileInfo.appendChild(profileName);
    profileInfo.appendChild(profileCreatedAt);
    profileInfo.appendChild(profileTwitterId);
    profileInfo.appendChild(profileLocation);
    profileInfo.appendChild(profileFollowers);
    profileInfo.appendChild(profileFollowing);
    document.getElementById("profile").appendChild(profileImage);
    document.getElementById("profile").appendChild(profileInfo);
}

function displayRepos() {
    if (filteredReposData.length > 0) {
        const reposFilter = document.createElement("div");
        reposFilter.id = "repos-filter";
        const reposFilterInput = document.createElement("input");
        reposFilterInput.type = "text";
        reposFilterInput.id = "repos-filter-input";
        reposFilterInput.placeholder = "Filter by repo name";
        reposFilterInput.addEventListener("input", handleRepoFilter);
        const reposFilterSelect = document.createElement("select");
        reposFilterSelect.id = "repos-filter-select";
        reposFilterSelect.addEventListener("change", handleLanguageFilter);
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All Languages";
        reposFilterSelect.appendChild(allOption);
        const uniqueLanguages = getUniqueLanguages();
        uniqueLanguages.forEach((language) => {
            const option = document.createElement("option");
            option.value = language;
            option.textContent = language;
            reposFilterSelect.appendChild(option);
        });
        reposFilter.appendChild(reposFilterInput);
        reposFilter.appendChild(reposFilterSelect);
        document.getElementById("repos").appendChild(reposFilter);
        const reposTable = document.createElement("table");
        reposTable.id = "repos-table";
        const tableHeaderRow = document.createElement("tr");
        const headerCellName = document.createElement("th");
        headerCellName.textContent = "Repo Name";
        const headerCellLanguage = document.createElement("th");
        headerCellLanguage.textContent = "Language";
        const headerCellStars = document.createElement("th");
        headerCellStars.textContent = "Stars";
        const headerCellUpdated = document.createElement("th");
        headerCellUpdated.textContent = "Last Updated";
        tableHeaderRow.appendChild(headerCellName);
        tableHeaderRow.appendChild(headerCellLanguage);
        tableHeaderRow.appendChild(headerCellStars);
        tableHeaderRow.appendChild(headerCellUpdated);
        reposTable.appendChild(tableHeaderRow);
        const tableBody = document.createElement("tbody");
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        for (
            let i = startIndex;
            i < endIndex && i < filteredReposData.length;
            i++
        ) {
            const repo = filteredReposData[i];
            const row = document.createElement("tr");
            const cellName = document.createElement("td");
            cellName.textContent = repo.name;
            const cellLanguage

                = document.createElement("td");
            cellLanguage.textContent = repo.language || "N/A";
            const cellStars = document.createElement("td");
            cellStars.textContent = repo.stargazers_count || 0;
            const cellUpdated = document.createElement("td");
            cellUpdated.textContent = new Date(
                repo.updated_at
            ).toLocaleDateString();
            row.appendChild(cellName);
            row.appendChild(cellLanguage);
            row.appendChild(cellStars);
            row.appendChild(cellUpdated);
            tableBody.appendChild(row);
        }
        reposTable.appendChild(tableBody);
        document.getElementById("repos").appendChild(reposTable);
        const paginationSection = document.createElement("div");
        paginationSection.id = "repos-pagination";
        const prevButton = document.createElement("button");
        prevButton.id = "repos-pagination-button";
        prevButton.textContent = "<";
        prevButton.addEventListener("click", handlePrevPage);
        const pageInput = document.createElement("input");
        pageInput.type = "text";
        pageInput.id = "repos-pagination-input";
        pageInput.value = currentPage;
        pageInput.addEventListener("input", handlePageInput);
        const pageSizeSelect = document.createElement("select");
        pageSizeSelect.id = "repos-pagination-select";
        pageSizeSelect.addEventListener("change", handlePageSizeChange);
        const pageSizeOptions = [5, 10, 20];
        pageSizeOptions.forEach((size) => {
            const option = document.createElement("option");
            option.value = size;
            option.textContent = size;
            pageSizeSelect.appendChild(option);
        });
        const nextButton = document.createElement("button");
        nextButton.id = "repos-pagination-button";
        nextButton.textContent = ">";
        nextButton.addEventListener("click", handleNextPage);
        paginationSection.appendChild(prevButton);
        paginationSection.appendChild(pageInput);
        paginationSection.appendChild(pageSizeSelect);
        paginationSection.appendChild(nextButton);
        document.getElementById("repos").appendChild(paginationSection);
    } else {
        const noReposMessage = document.createElement("p");
        noReposMessage.textContent = "No repositories match the criteria.";
        document.getElementById("repos").appendChild(noReposMessage);
    }
}

function handleRepoFilter(event) {
    const filterValue = event.target.value.trim().toLowerCase();
    filteredReposData = reposData.filter((repo) =>
        repo.name.toLowerCase().includes(filterValue)
    );
    currentPage = 1;
    displayRepos();
}

function handleLanguageFilter(event) {
    const filterValue = event.target.value;
    filteredReposData =
        filterValue === "all"
            ? reposData
            : reposData.filter((repo) => repo.language === filterValue);
    currentPage = 1;
    displayRepos();
}

function getUniqueLanguages() {
    const languagesSet = new Set();
    reposData.forEach((repo) => {
        if (repo.language) {
            languagesSet.add(repo.language);
        }
    });
    return Array.from(languagesSet);
}

function handlePrevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayRepos();
    }
}

function handleNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        displayRepos();
    }
}

function handlePageInput(event) {
    const inputPage = parseInt(event.target.value);
    if (!isNaN(inputPage) && inputPage > 0 && inputPage <= totalPages) {
        currentPage = inputPage;
        displayRepos();
    }
}

function handlePageSizeChange(event) {
    perPage = parseInt(event.target.value);
    totalPages = Math.ceil(filteredReposData.length / perPage);
    currentPage = 1;
    displayRepos();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}
