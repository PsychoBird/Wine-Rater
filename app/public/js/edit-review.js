const queryParams = new URLSearchParams(window.location.search);
const reviewId = queryParams.get("id");

if (!reviewId) {
    alert("No review ID specified. Redirecting back to profile page.");
    window.location.href = "/profile-view";
    throw new Error("Missing review ID in query parameter");
}

console.log("Editing Review Id: ", reviewId);
setUpEditReviewPage(reviewId);

let editButton = document.getElementById("submit-edits");
let cancelButton = document.getElementById("cancel-edits");
let nameInput = document.getElementById("edit-name");
let scoreInput = document.getElementById("edit-score");
let descInput = document.getElementById("edit-description");
let errorSpan = document.getElementById("error");

cancelButton.addEventListener("click", () => {
    window.location.href = "/profile-view";
});

editButton.addEventListener("click", async event => {
    event.preventDefault(); // Stop page reload
    
    let nameVal = nameInput.value.trim();
    let scoreVal = scoreInput.value.trim();
    let descriptionVal = descInput.value.trim();

    if (!nameVal || !descriptionVal || isNaN(parseInt(scoreVal))) {
        errorSpan.textContent = "Please enter in all fields completely!";
        return;
    }

    try {
        let result = await fetch(`/update-review/${reviewId}`, {
            method: "PATCH", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                wineName: nameVal, 
                description: descriptionVal, 
                score: parseInt(scoreVal, 10)
            })
        });

        if (result.ok) {
            let responseBody = await result.json();
            alert(responseBody.note);
            window.location.href = "/profile-view";
        } else {
            errorSpan.textContent = `Error making edits: ${await result.text()}`;
        }
    } catch (error) {
        console.error(error);
        errorSpan.textContent = "Something went wrong. Please try again."
    }
});

async function setUpEditReviewPage(id) {
    let result;
    try {
        let response = await fetch(`/get-single-review-info?id=${id}`);

        if (!response.ok) {
            alert("Review not found or server error. Redirecting back to profile page.");
            window.location.href = "/profile-view";
            throw new Error(`Server returned ${response.status}`);
        }

        result = await response.json();
    } catch (error) {
        console.error(error);
        alert("Error with fetching review information. Redirecting back to profile page.");
        window.location.href = "/profile-view";
    }

    nameInput.value = result.wine_name;
    scoreInput.value = result.score;
    descInput.value = result.description;
}