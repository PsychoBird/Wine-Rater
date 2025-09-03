let submit = document.getElementById("submitReview");

submit.addEventListener("click", async () => {
    let wineName = document.getElementById("wineName").value.trim();
    let score = document.getElementById("score").value;
    let country = document.getElementById("country").value.trim();
    let year = document.getElementById("year").value;
    let description = document.getElementById("description").value.trim();
    let msg = document.getElementById("reviewMsg");

    if (!wineName || !description || isNaN(parseInt(score)) || !country || isNaN(parseInt(year))) {
        msg.textContent = "Please enter in all fields completely!";
        return;
    } 

    try {
        let res = await fetch("/add-new-review", {
            method: "POST", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                wineName, 
                postDescription: description, 
                score,
                country,
                year
            })
        });

        if (res.ok) {
            msg.textContent = "sucessfully submitted!";

            document.getElementById("wineName").value = "";
            document.getElementById("score").value = "";
            document.getElementById("description").value = "";
            document.getElementById("country").value = "";
            document.getElementById("year").value = "";
        } else {
            msg.textContent = `error!error! ${await res.text()}`;
        }
    } catch (error) {
        console.error(error);
        msg.textContent = "something went wrong on our side sry!";
    }
});