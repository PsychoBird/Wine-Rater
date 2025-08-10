let defaultProfileData = {
    firstName: "Jane",
    lastName: "Doe",
    email: "doe@gmail.com",
    username: "ThatWineGoodDoe"
};

let nameTextBox = document.getElementById("name-text");
let emailTextBox = document.getElementById("email-text");
let usernameTextBox = document.getElementById("username-text");

// TODO: Get user info from logged in information/cookies, and use those values to load the profile page

addEventListener("load", () => {
    let name = `${defaultProfileData.firstName} ${defaultProfileData.lastName}`
    let email = defaultProfileData.email;
    let username = defaultProfileData.username;

    nameTextBox.textContent = name;
    email.textContent = email;
    username.textContent = username;
});