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

addEventListener("load", async () => {
    try {
        let res = await fetch("/profile", { credentials: "include" });
        console.log(res)
        if (!res.ok) throw new Error("cant fetch profile");
        
        let data = await res.json();

        nameTextBox.textContent = `${data.first_name} ${data.last_name}`;
        emailTextBox.textContent = data.email;
        usernameTextBox.textContent = data.username;
        userId = data.id;
    } catch (err) {
        console.error(err);
    }
});
