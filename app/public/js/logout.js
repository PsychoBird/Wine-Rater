let logout = document.getElementById("logout");

logout.addEventListener("click", async() => {
    try {
        let res = await fetch ("/logout", {
            method: "POST",
            credentials: "include"
        });

        if (res.ok) {
            window.location.href = "/login.html";
        } else {
            console.error("can't log out:", await res.text());
        }
    } catch (error) {
        console.error(error);
    }
});