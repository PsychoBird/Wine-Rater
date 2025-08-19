async function loadReviews() {
    try {
        let res = await fetch("/get-all-reviews");
        let reviews = await res.json();

        let feedArea = document.getElementById("userfeed");
        feedArea.textContent = "";

        reviews.forEach(review => {
            let box = document.createElement("div");
            box.className = "review-box";

            let user = document.createElement("span");
            user.id = "review-username";
            user.textContent = `@${review.username}`;

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

            box.appendChild(user);
            box.appendChild(reviewInfo);
            box.appendChild(description);

            feedArea.appendChild(box);
        });
    } catch (error) {
        console.error(error);
        document.getElementById("feed").textContent = "Error loading reviews.";
    }
}

document.addEventListener("DOMContentLoaded", loadReviews);