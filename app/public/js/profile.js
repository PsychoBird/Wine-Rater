let defaultProfileData = {
    firstName: "Jane",
    lastName: "Doe",
    email: "doe@gmail.com",
    username: "ThatWineGoodDoe"
};

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

        nameTextBox.textContent = `${data.first_name} ${data.last_name}`;
        emailTextBox.textContent = data.email;
        usernameTextBox.textContent = data.username;
        userId = data.id;

        loadUserReviews();
    } catch (err) {
        console.error(err);
    }
});

async function loadUserReviews() {
    try {
        let result = await fetch(`/get-user-reviews`);
        let userReviews = await result.json();

        let reviewsDisplay = document.getElementById("reviews-display");

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
        document.getElementById("reviews-display").textContent = "Error loading user's reviews."
    }
}