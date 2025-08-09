let login = document.getElementById("login");
let error = document.getElementById("error");
let username = document.getElementById("username");
let password = document.getElementById("password");

login.addEventListener("click", (event) => {
    if (!username.value || !password.value) {
        error.textContent = "Username or password missing!";
        //return;
    }
    window.location.href = "/reviews.html"
})