const defaultProfileData = {
    firstName: "Jane",
    lastName: "Doe",
    email: "doe@gmail.com",
    username: "ThatWineGoodDoe"
};

const savedWineHeaders = ["Name", "Country", "Year", "Description"];

let nameTextBox = document.getElementById("name-text");
let emailTextBox = document.getElementById("email-text");
let usernameTextBox = document.getElementById("username-text");
let userId = null;

window.addEventListener("load", async () => {
    try {
        let res = await fetch("/profile", { credentials: "include" });
        console.log(res)
        if (!res.ok) throw new Error("cant fetch profile");
        
        let data = await res.json();

        nameTextBox.textContent = `Name: ${data.first_name} ${data.last_name}`;
        emailTextBox.textContent = `Email: ${data.email}`;
        usernameTextBox.textContent = `Username: ${data.username}`;
        userId = data.id;

        loadSavedWines();
        loadUserReviews();
    } catch (err) {
        console.error(err);
    }
});

async function loadUserReviews() {
    try {
        let result = await fetch(`/get-user-reviews`);
        let userReviews = await result.json();

        let reviewsDisplay = document.getElementById("personal-reviews-display");

        userReviews.forEach(review => {
            let newDiv = document.createElement("div");
            newDiv.classList.add("review-box");

            let reviewInfo = document.createElement("div");
            reviewInfo.className = "review-meta";

            let wineName = document.createElement("span");
            wineName.className = "review-info";
            wineName.textContent = `Wine: ${review.wine_name}`;

            let score = document.createElement("span");
            score.className = "review-info";
            score.textContent = `Score: ${review.score}/10`;

            reviewInfo.appendChild(wineName);
            reviewInfo.appendChild(score);

            let description = document.createElement("p");
            description.id = "review-description";
            description.textContent = `${review.description}`;

            let editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "edit-button";
            editButton.addEventListener("click", () => {
                window.location.href = `/profile-view/edit-review?id=${review.id}`;
            });

            newDiv.appendChild(reviewInfo);
            newDiv.appendChild(description);
            newDiv.appendChild(editButton);

            reviewsDisplay.appendChild(newDiv)
        });
    } catch (error) {
        console.error(error);
        document.getElementById("personal-reviews-display").textContent = "Error loading user's reviews."
    }
}

async function loadSavedWines() {
    const saved_wines_display = document.getElementById("saved-wines-display");
    try {
        let result = await fetch("/get-personal-list");
        let saved_wines = await result.json();

        if (saved_wines.count === 0) {
            saved_wines_display.textContent = "No wines saved yet for this user. Add a wine or review one!";
        } else {
            const wine_table = document.createElement("table");

            const headerRow = document.createElement("tr");
            savedWineHeaders.forEach(header => {
                const headerElement = document.createElement("th");
                headerElement.textContent = header;
                headerRow.appendChild(headerElement);
            });
            wine_table.appendChild(headerRow);
            
            saved_wines.wines.forEach(wineObj => {
                console.log(wineObj);
                const row = document.createElement("tr");
                Object.values(wineObj).forEach(value => {
                    const td = document.createElement("td");
                    td.textContent = value;
                    row.appendChild(td);
                });
                wine_table.appendChild(row)
            });

            saved_wines_display.appendChild(wine_table);
        }
    } catch (error) {
        console.error(error);
        saved_wines_display.textContent = "Error loading saved wine list."
    }
}