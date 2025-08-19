let submit = document.getElementById("submitReview");

submit.addEventListener("click", async () => {
    let wineName = document.getElementById("wineName").value.trim();
    let score = document.getElementById("score").value;
    let description = document.getElementById("description").value.trim();
    let msg = document.getElementById("reviewMsg");

    if (!wineName || !description || isNaN(parseInt(score))) {
        msg.textContent = "please enter in all fields completely!";
    } 

    try {
        let res = await fetch("/add-new-review", {
            method: "POST", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                wineName, 
                postDescription: description, 
                score
            })
        });

        if (res.ok) {
            msg.textContent = "sucessfully submitted!";

            document.getElementById("wineName").value = "";
            document.getElementById("score").value = "";
            document.getElementById("description").value = "";
        } else {
            msg.textContent = `error!error! ${await res.text()}`;
        }
    } catch (error) {
        console.error(error);
        msg.textContent = "something went wrong on our side sry!";
    }
});