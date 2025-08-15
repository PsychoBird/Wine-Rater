let login = document.getElementById("login");
let error = document.getElementById("error");
let username = document.getElementById("username");
let password = document.getElementById("password");

login.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!username.value || !password.value) {
        error.textContent = "Username or password missing!";
        return;
    }

    try {
        let res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            })
        });

        if (!res.ok) {
            let msg = await res.text();
            error.textContent = msg || "Login failed";
            return;
        }

        //good to login
        window.location.href = "reviews.html";
    } catch (err) {
        console.error("Network error:", err);
        error.textContent = "Could not reach server.";
    }
});