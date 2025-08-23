const queryParams = new URLSearchParams(window.location.search);
const reviewId = queryParams.get("id");

if (!reviewId) {
    alert("No review ID specified. Redirecting back to profile page.");
    window.location.href = "/profile-view";
    throw new Error("Missing review ID in query parameter");
}

console.log("Editing Review Id: ", reviewId);
setUpEditReviewPage(reviewId);

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

    console.log(result);
}